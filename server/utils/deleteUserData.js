import { collections, serializeDocs } from "./firestore.js";
import { deleteUser } from "./auth.js";

// Deletes a user's Firestore profile plus every request, donation-history
// entry, and notification tied to them, then removes the Firebase Auth
// account. Shared by the admin "delete user" action and the user's own
// "Delete Account" (Account Settings) action.
export const deleteUserCascade = async (user) => {
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
  // Firebase Auth account may already be gone (removed directly from the
  // console) — that's exactly the "ghost profile" case being cleaned up.
  try {
    await deleteUser(user.firebaseUid);
  } catch (err) {
    if (!/not found|not_found|no user/i.test(err?.message || "")) throw err;
  }
};

export default deleteUserCascade;