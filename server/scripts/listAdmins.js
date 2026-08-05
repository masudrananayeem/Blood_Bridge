/**
 * Lists every user currently holding the "admin" role.
 *
 *   cd server
 *   node scripts/listAdmins.js
 *
 * Requires the same .env as the server (FIREBASE_SERVICE_ACCOUNT_BASE64).
 */
import "dotenv/config";
import { db } from "../utils/firestore.js";
import { getServiceAccount } from "../config/serviceAccount.js";

if (!getServiceAccount()) {
  console.error("Firebase isn't configured — check FIREBASE_SERVICE_ACCOUNT_BASE64 in server/.env");
  process.exit(1);
}

const run = async () => {
  const snapshot = await db.collection("users").where("role", "==", "admin").get();

  if (snapshot.empty) {
    console.log("⚠️  No admin accounts exist right now.");
    console.log("    Create one with: node scripts/makeAdmin.js <email>");
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} admin(s):\n`);
  snapshot.docs.forEach((doc) => {
    const u = doc.data();
    console.log(`  - ${u.fullName || "(no name)"}  <${u.email}>  [id: ${doc.id}]`);
  });
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to list admins:", err);
  process.exit(1);
});