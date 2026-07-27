import { collections, FieldValue } from "./firestore.js";

const notify = (recipientUid, type, message, relatedRequestId = null) =>
  collections.notifications.add({
    recipientUid,
    type,
    message,
    relatedRequestId,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

export default notify;
