import { collections, serializeDocs } from "./firestore.js";

// Deletes a user's Firestore profile plus every request, donation-history
// entry, and notification tied to them, then removes the Firebase Auth
// account. Shared by the admin "delete user" action and the user's own
// "Delete Account" (Account Settings) action.
export const deleteUserCascade = async (admin, user) => {
  const [requests, donationHistory, notifications] = await Promise.all([
    serializeDocs(await collections.requests.get()),
    serializeDocs(await collections.donationHistory.get()),
    serializeDocs(await collections.notifications.get()),
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

  await Promise.all(deletions);
  await collections.users.doc(user.id).delete();
  await admin.auth().deleteUser(user.firebaseUid);
};

export default deleteUserCascade;
