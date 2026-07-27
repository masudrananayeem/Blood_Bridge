import admin, { db, FieldValue, Timestamp } from "../config/firebaseAdmin.js";

export { db, FieldValue, Timestamp };

export const collections = {
    users: db.collection("users"),
    requests: db.collection("requests"),
    donationHistory: db.collection("donationHistory"),
    notifications: db.collection("notifications"),
};

const isTimestamp = (value) => value instanceof admin.firestore.Timestamp;

const serializeValue = (value) => {
    if (value === null || value === undefined) return value;
    if (isTimestamp(value)) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
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
    if (value instanceof admin.firestore.Timestamp) return value;
    if (value instanceof Date) return Timestamp.fromDate(value);
    return Timestamp.fromDate(new Date(value));
};