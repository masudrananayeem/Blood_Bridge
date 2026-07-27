import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";

// @route  GET /api/notifications
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = serializeDocs(
      await collections.notifications.where("recipientUid", "==", req.user.id).get()
    );
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    res.json({ success: true, notifications: notifications.slice(0, 50), unreadCount });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notificationRef = collections.notifications.doc(req.params.id);
    const notification = serializeDoc(await notificationRef.get());

    if (!notification || notification.recipientUid !== req.user.id) {
      res.status(404);
      throw new Error("Notification not found");
    }

    await notificationRef.update({ isRead: true, updatedAt: FieldValue.serverTimestamp() });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    const unreadNotifications = await collections.notifications
      .where("recipientUid", "==", req.user.id)
      .where("isRead", "==", false)
      .get();

    const batch = collections.notifications.firestore.batch();
    unreadNotifications.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true, updatedAt: FieldValue.serverTimestamp() });
    });

    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
