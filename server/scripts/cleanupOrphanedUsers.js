/**
 * Finds and removes "ghost" user profiles — Firestore documents in the
 * `users` collection that don't correspond to a real, usable account. This
 * happens most often when:
 *
 *   - Someone deletes a user directly from the Firebase Console
 *     (Authentication tab) instead of through the app's Admin panel /
 *     Delete Account — the Firestore profile document is left behind, and
 *     it keeps showing up in donor search / saved donors even though the
 *     account itself doesn't exist.
 *   - A registration was interrupted partway through and never finished
 *     writing all required fields (fullName, bloodGroup, district, phone).
 *
 * Usage:
 *   cd server
 *   node scripts/cleanupOrphanedUsers.js          # dry run — lists what it WOULD remove
 *   node scripts/cleanupOrphanedUsers.js --apply   # actually deletes them
 */
import "dotenv/config";
import admin, { db } from "../config/firebaseAdmin.js";
import { deleteUserCascade } from "../utils/deleteUserData.js";

const apply = process.argv.includes("--apply");

if (!db) {
  console.error("Firebase Admin isn't initialized — check FIREBASE_SERVICE_ACCOUNT_BASE64 in server/.env");
  process.exit(1);
}

const isCompleteProfile = (user) =>
  Boolean(user?.firebaseUid && user?.fullName?.trim() && user?.bloodGroup && user?.district && user?.phone);

const run = async () => {
  const snapshot = await db.collection("users").get();
  const ghosts = [];

  for (const doc of snapshot.docs) {
    const user = { id: doc.id, ...doc.data() };

    if (!isCompleteProfile(user)) {
      ghosts.push({ user, reason: "incomplete profile (missing required fields)" });
      continue;
    }

    try {
      await admin.auth().getUser(user.firebaseUid);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        ghosts.push({ user, reason: "no matching Firebase Auth account" });
      } else {
        console.warn(`  ! Couldn't verify ${user.email || user.id}: ${err.message}`);
      }
    }
  }

  if (ghosts.length === 0) {
    console.log("✅ No ghost profiles found — everything looks clean.");
    process.exit(0);
  }

  console.log(`Found ${ghosts.length} ghost profile(s):\n`);
  ghosts.forEach(({ user, reason }) => {
    console.log(`  - ${user.fullName || "(no name)"} <${user.email || "no email"}> [${user.id}] — ${reason}`);
  });

  if (!apply) {
    console.log("\nDry run only — nothing was deleted. Re-run with --apply to remove these.");
    process.exit(0);
  }

  console.log("\nDeleting...");
  for (const { user } of ghosts) {
    await deleteUserCascade(admin, user);
    console.log(`  ✓ removed ${user.email || user.id}`);
  }
  console.log(`\n✅ Removed ${ghosts.length} ghost profile(s).`);
  process.exit(0);
};

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
