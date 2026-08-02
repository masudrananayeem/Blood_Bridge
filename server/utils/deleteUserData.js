import { collections, serializeDocs } from "./firestore.js";

// Deletes a user's Firestore profile plus every request, donation-history
// entry, and notification tied to them, then removes the Firebase Auth
// account. Shared by the admin "delete user" action and the user's own
// "Delete Account" (Account Settings) action.
export const deleteUserCascade = async (admin, user) => {
  const [requests, donationHistory, notifications, feedback] = await Promise.all([
    serializeDocs(await collections.requests.get()),
    serializeDocs(await collections.donationHistory.get()),
    serializeDocs(await collections.notifications.get()),
    serializeDocs(await collections.feedback.get()),
  ]);

  const deletions = [];
  requests.forEach((request) => {
    if (
      request.seekerUid === user.id ||
      request.acceptedDonorUid === user.id ||
      request.targetDonorUid === user.id ||
      (request.rejectedByUids || []).includes(user.id) ||
      (request.notifiedDonorUids || []).includes(user.id)
    ) {
      deletions.push(collections.requests.doc(request.id).delete());
    }
  });
  donationHistory.forEach((entry) => {
    if (entry.donorUid === user.id) {
      deletions.push(collections.donationHistory.doc(entry.id).delete());
    }
  });
  notifications.forEach((notification) => {
    if (notification.recipientUid === user.id) {
      deletions.push(collections.notifications.doc(notification.id).delete());
    }
  });
  feedback.forEach((item) => {
    if (item.userUid === user.id) {
      deletions.push(collections.feedback.doc(item.id).delete());
    }
  });

  await Promise.all(deletions);
  await collections.users.doc(user.id).delete();
  try {
    await admin.auth().deleteUser(user.firebaseUid);
  } catch (err) {
    // Already gone from Firebase Auth (e.g. removed directly via the
    // Firebase console) — that's exactly the "ghost profile" case this
    // cascade is meant to clean up, so it's fine to keep going.
    if (err?.code !== "auth/user-not-found") throw err;
  }
};

export default deleteUserCascade;
