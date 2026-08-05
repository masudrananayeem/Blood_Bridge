import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import { HttpError } from "../middlewares/errorHandler.js";

// @route  GET /api/notifications
export const getMyNotifications = async (c) => {
  const user = c.get("user");
  const notifications = serializeDocs(
    await collections.notifications.where("recipientUid", "==", user.id).get()
  ).sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return c.json({ success: true, notifications: notifications.slice(0, 50), unreadCount });
};

// @route  PATCH /api/notifications/:id/read
export const markAsRead = async (c) => {
  const user = c.get("user");
  const notificationRef = collections.notifications.doc(c.req.param("id"));
  const notification = serializeDoc(await notificationRef.get());

  if (!notification || notification.recipientUid !== user.id) {
    throw new HttpError(404, "Notification not found");
  }

  await notificationRef.update({ isRead: true, updatedAt: FieldValue.serverTimestamp() });
  return c.json({ success: true });
};

// @route  PATCH /api/notifications/read-all
export const markAllAsRead = async (c) => {
  const user = c.get("user");
  const unreadNotifications = await collections.notifications
    .where("recipientUid", "==", user.id)
    .where("isRead", "==", false)
    .get();

  const batch = collections.notifications.firestore.batch();
  unreadNotifications.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true, updatedAt: FieldValue.serverTimestamp() });
  });

  await batch.commit();
  return c.json({ success: true });
};