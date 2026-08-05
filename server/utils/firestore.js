import { db, FieldValue, Timestamp } from "./firestoreClient.js";

export { db, FieldValue, Timestamp };

export const collections = {
  users: db.collection("users"),
  requests: db.collection("requests"),
  donationHistory: db.collection("donationHistory"),
  notifications: db.collection("notifications"),
  organizations: db.collection("organizations"),
  feedback: db.collection("feedback"),
};

const isSerializableDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const serializeValue = (value) => {
  if (value === null || value === undefined) return value;
  if (isSerializableDate(value)) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serializeValue(entry)]));
  }
  return value;
};

export const serializeDoc = (docSnap) => {
  if (!docSnap || !docSnap.exists) return null;
  return { id: docSnap.id, ...serializeValue(docSnap.data()) };
};

export const serializeDocs = (querySnap) => querySnap.docs.map(serializeDoc).filter(Boolean);

export const toTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Timestamp.fromDate(value);
  return Timestamp.fromDate(new Date(value));
};