/**
 * Promote an already-registered user to the "admin" role.
 *
 * There is no public "sign up as admin" flow (by design — anyone could
 * otherwise register themselves as admin). Instead:
 *
 *   1. Register a normal account through the app as usual
 *      (email/password or Google) — it will be created with role "donor".
 *   2. Run this script with that account's email:
 *
 *        cd server
 *        node scripts/makeAdmin.js someone@example.com
 *
 *   3. Log back in (or refresh) on the site with that same account.
 *      Login now redirects role "admin" straight to /admin.
 *
 * Requires the same .env as the server (FIREBASE_SERVICE_ACCOUNT_BASE64),
 * since it talks to Firestore directly.
 */
import "dotenv/config";
import admin, { db } from "../config/firebaseAdmin.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

if (!db) {
  console.error("Firebase Admin isn't initialized — check FIREBASE_SERVICE_ACCOUNT_BASE64 in server/.env");
  process.exit(1);
}

const run = async () => {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", email).limit(1).get();

  if (snapshot.empty) {
    console.error(`No registered user found with email "${email}". Register through the app first, then re-run this script.`);
    process.exit(1);
  }

  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({ role: "admin", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  console.log(`✅ ${email} is now an admin. Log in (or refresh) on the site — you'll land in /admin.`);
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to promote user:", err);
  process.exit(1);
});
