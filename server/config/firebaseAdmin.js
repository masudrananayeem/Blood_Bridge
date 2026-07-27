import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

/*
  FIREBASE_SERVICE_ACCOUNT_BASE64 = the service account JSON (downloaded from
  Firebase Console > Project Settings > Service Accounts > Generate new
  private key), base64-encoded into a single line so it fits in a .env file.

  To generate the value locally:
    base64 -i serviceAccountKey.json | tr -d '\n'
*/
if (!admin.apps.length) {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encoded) {
    console.warn(
      "⚠️  FIREBASE_SERVICE_ACCOUNT_BASE64 is not set — Firebase token verification will fail until it is."
    );
  } else {
    const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export const db = admin.apps.length ? admin.firestore() : null;
export const { FieldValue, Timestamp } = admin.firestore;

export default admin;
