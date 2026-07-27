/**
 * Demote a user out of the "admin" role, back to a normal "donor" account.
 * The exact reverse of scripts/makeAdmin.js.
 *
 *   cd server
 *   node scripts/removeAdmin.js someone@example.com
 *
 * After this runs, log out and back in on the site (or just visit
 * /dashboard) — the account behaves like a regular donor/seeker again and
 * loses access to /admin.
 *
 * Requires the same .env as the server (FIREBASE_SERVICE_ACCOUNT_BASE64).
 */
import "dotenv/config";
import admin, { db } from "../config/firebaseAdmin.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/removeAdmin.js <email>");
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
    console.error(`No registered user found with email "${email}".`);
    process.exit(1);
  }

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();

  if (user.role !== "admin") {
    console.log(`ℹ️  ${email} is already not an admin (current role: "${user.role}"). Nothing to do.`);
    process.exit(0);
  }

  // Make sure at least one admin always remains, so nobody locks
  // themselves out of the admin panel entirely.
  const adminCountSnap = await usersRef.where("role", "==", "admin").get();
  if (adminCountSnap.size <= 1) {
    console.error(
      "⚠️  Refusing to remove the last remaining admin. Promote another account with scripts/makeAdmin.js first."
    );
    process.exit(1);
  }

  await userDoc.ref.update({ role: "donor", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  console.log(`✅ ${email} is no longer an admin — back to a normal donor account.`);
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to demote user:", err);
  process.exit(1);
});