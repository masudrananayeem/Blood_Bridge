// A minimal, runtime-agnostic Firestore client implemented on top of the
// Firestore REST API (no gRPC, no firebase-admin). It mirrors the tiny slice
// of the Firebase Admin SDK surface this project actually uses:
//
//   db.collection(name)          -> .doc(id) .add(data) .get() .where() .limit() .firestore
//   docRef                       -> .get() .set(data,{merge}) .update(data) .delete()
//   queryRef                     -> .get() .where() .limit()
//   db.batch()                   -> .set(ref,data) .update(ref,data) .delete(ref) .commit()
//   FieldValue.serverTimestamp()
//   Timestamp.fromDate()
//
// Values are encoded/decoded to/from Firestore's REST wire format. Server
// timestamps become Date objects on read (serialized to ISO elsewhere), so
// downstream code treats everything uniformly. Uses only Web-standard APIs
// (fetch, crypto, TextEncoder), so the exact same code runs on Node.js and
// Cloudflare Workers.
import { getProjectId } from "../config/serviceAccount.js";
import { getServiceAccountToken, FIRESTORE_SCOPE } from "./oauthToken.js";

// ---- Field sentinels -------------------------------------------------------

export const SERVER_TIMESTAMP = Symbol("SERVER_TIMESTAMP");
export const DELETE = Symbol("DELETE");

export const FieldValue = {
  serverTimestamp: () => SERVER_TIMESTAMP,
  delete: () => DELETE,
  arrayUnion: (value) => Array.isArray(value) ? [value, ARRAY_UNION] : value,
  increment: (n) => n,
};

export const Timestamp = {
  fromDate: (date) => (date instanceof Date ? date : new Date(date)),
};

// ---- Value <-> wire format -------------------------------------------------

const isServerTimestamp = (v) => v === SERVER_TIMESTAMP;
const isDelete = (v) => v === DELETE;

const encodeValue = (v) => {
  if (v === null || v === undefined || isServerTimestamp(v) || isDelete(v)) return null;
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isSafeInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v) } };
  throw new Error(`Unsupported Firestore value: ${String(v)}`);
};

const encodeFields = (obj) => {
  const fields = {};
  for (const key of Object.keys(obj)) {
    const encoded = encodeValue(obj[key]);
    if (encoded !== null) fields[key] = encoded;
  }
  return fields;
};

const decodeValue = (v) => {
  if (v === null || v === undefined) return null;
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("timestampValue" in v) return new Date(v.timestampValue);
  if ("stringValue" in v) return v.stringValue;
  if ("bytesValue" in v) return v.bytesValue;
  if ("referenceValue" in v) return v.referenceValue;
  if ("geoPointValue" in v) return v.geoPointValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return null;
};

const decodeFields = (fields) => {
  const out = {};
  for (const key of Object.keys(fields || {})) out[key] = decodeValue(fields[key]);
  return out;
};

// ---- Plumbing --------------------------------------------------------------

const encodePath = (rel) => rel.split("/").map(encodeURIComponent).join("/");
const documentsBase = () =>
  `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/(default)/documents`;

// Resource name (not URL) used inside write/commit bodies. Firestore's commit
// API rejects full URLs here — names must start with "projects/".
const documentsName = () =>
  `projects/${getProjectId()}/databases/(default)/documents`;

const getToken = () => getServiceAccountToken(FIRESTORE_SCOPE);

const throwOnError = async (res) => {
  if (res.ok) return;
  let message = `Firestore request failed (${res.status})`;
  try {
    const payload = await res.json();
    message = payload?.error?.message || message;
  } catch {
    /* ignore parse errors */
  }
  const err = new Error(message);
  err.status = res.status;
  throw err;
};

const fetchJson = async (url, init) => {
  const res = await fetch(url, init);
  await throwOnError(res);
  return res.json();
};

const postCommit = async (writes) =>
  fetchJson(`${documentsBase()}:commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ writes }),
  });

const randomId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) id += chars[byte % chars.length];
  return id;
};

// Builds the REST `write` objects for a set/update, splitting plain fields
// from server-timestamp fields (which need a separate transform write).
const buildWrites = (rel, data, mask) => {
  const plain = {};
  const serverTimes = [];
  for (const key of Object.keys(data)) {
    if (isServerTimestamp(data[key])) serverTimes.push(key);
    else if (!isDelete(data[key])) plain[key] = data[key];
  }

  const name = `${documentsName()}/${rel}`;
  const writes = [];
  if (Object.keys(plain).length > 0) {
    const write = { update: { name, fields: encodeFields(plain) } };
    // updateMask is a sibling of `update` at the Write level, not a field
    // of the Document itself.
    if (mask) write.updateMask = { fieldPaths: Object.keys(plain) };
    writes.push(write);
  }
  if (serverTimes.length > 0) {
    writes.push({
      transform: {
        document: name,
        fieldTransforms: serverTimes.map((fieldPath) => ({ fieldPath, setToServerValue: "REQUEST_TIME" })),
      },
    });
  }
  return writes;
};

const makeDocSnapshot = (documentObj) => {
  const rel = documentObj.name.replace(documentsName() + "/", "");
  return { exists: true, id: rel.split("/").pop(), data: () => decodeFields(documentObj.fields), ref: rel };
};

const makeMissingSnapshot = (rel) => ({
  exists: false,
  id: rel.split("/").pop(),
  data: () => undefined,
  ref: rel,
});

const makeListSnapshot = (documents) => {
  const docs = documents.map(makeDocSnapshot);
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (fn) => docs.forEach(fn),
  };
};

// ---- Query building --------------------------------------------------------

const OP_MAP = {
  "==": "EQUAL",
  "!=": "NOT_EQUAL",
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUAL",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUAL",
  array_contains: "ARRAY_CONTAINS",
  in: "IN",
};

const queryRef = (coll, filters, limit = null) => ({
  get: () => runQuery(coll, filters, limit),
  where: (field, op, value) => queryRef(coll, [...filters, { field, op, value }], limit),
  limit: (n) => queryRef(coll, filters, n),
});

const runQuery = async (coll, filters, limit) => {
  const structured = { from: [{ collectionId: coll }] };
  if (filters.length === 1) {
    const { field, op, value } = filters[0];
    structured.where = {
      fieldFilter: { field: { fieldPath: field }, op: OP_MAP[op] || "EQUAL", value: encodeValue(value) },
    };
  } else if (filters.length > 1) {
    structured.where = {
      compositeFilter: {
        op: "AND",
        filters: filters.map(({ field, op, value }) => ({
          fieldFilter: { field: { fieldPath: field }, op: OP_MAP[op] || "EQUAL", value: encodeValue(value) },
        })),
      },
    };
  }
  if (limit !== null) structured.limit = limit;

  const payload = await fetchJson(`${documentsBase()}:runQuery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: structured }),
  });

  const documents = (Array.isArray(payload) ? payload : [])
    .map((result) => result?.document)
    .filter(Boolean);
  return makeListSnapshot(documents);
};

const listCollection = async (coll) => {
  const docs = [];
  let pageToken = "";
  do {
    const url = `${documentsBase()}/${encodePath(coll)}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const payload = await fetchJson(url, { headers: { Authorization: `Bearer ${await getToken()}` } });
    docs.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return makeListSnapshot(docs);
};

// ---- References ------------------------------------------------------------

const documentRef = (rel) => ({
  id: rel.split("/").pop(),
  ref: rel,
  get: async () => {
    try {
      const payload = await fetchJson(`${documentsBase()}/${encodePath(rel)}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      return makeDocSnapshot(payload);
    } catch (err) {
      if (err?.status === 404) {
        return makeMissingSnapshot(rel);
      }
      throw err;
    }
  },
  set: async (data, options) => {
    const merge = Boolean(options?.merge);
    await postCommit(buildWrites(rel, data, merge));
  },
  update: async (data) => {
    await postCommit(buildWrites(rel, data, true));
  },
  delete: async () => {
    await postCommit([{ delete: `${documentsName()}/${rel}` }]);
  },
});

const collectionRef = (coll) => ({
  id: coll,
  firestore: db,
  doc: (id) => documentRef(`${coll}/${id}`),
  add: async (data) => {
    const rel = `${coll}/${randomId()}`;
    await postCommit(buildWrites(rel, data, false));
    return documentRef(rel);
  },
  get: () => listCollection(coll),
  where: (field, op, value) => queryRef(coll, [{ field, op, value }]),
});

// ---- Batch -----------------------------------------------------------------

const relOf = (target) => (typeof target === "string" ? target : target?.ref);

class WriteBatch {
  constructor() {
    this.writes = [];
  }

  update(target, data) {
    this.writes.push(...buildWrites(relOf(target), data, true));
  }

  set(target, data, options) {
    this.writes.push(...buildWrites(relOf(target), data, Boolean(options?.merge)));
  }

  delete(target) {
    this.writes.push({ delete: `${documentsName()}/${relOf(target)}` });
  }

  async commit() {
    await postCommit(this.writes);
  }
}

// ---- Root ------------------------------------------------------------------

export const db = {
  collection: (name) => collectionRef(name),
  batch: () => new WriteBatch(),
};

export default { db, FieldValue, Timestamp, SERVER_TIMESTAMP, DELETE };