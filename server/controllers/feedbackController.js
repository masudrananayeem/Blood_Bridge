import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import notify from "../utils/notify.js";
import { readBody } from "../utils/request.js";
import { HttpError } from "../middlewares/errorHandler.js";

const sortByNewest = (items) =>
  [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

// @route  POST /api/feedback
// @desc   Logged-in user submits feedback/a message that goes to admins
export const createFeedback = async (c) => {
  const body = await readBody(c);
  const { message, category } = body;
  if (!message || !message.trim()) {
    throw new HttpError(400, "Feedback message is required");
  }

  const user = c.get("user");
  const feedbackRef = await collections.feedback.add({
    userUid: user.id,
    userName: user.fullName,
    userEmail: user.email,
    category: category || "General",
    message: message.trim(),
    status: "new", // "new" | "reviewed"
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Let every admin know feedback came in, so it doesn't just sit unseen.
  const admins = serializeDocs(await collections.users.where("role", "==", "admin").get());
  await Promise.all(
    admins.map((admin) =>
      notify(admin.id, "feedback", `${user.fullName} নতুন একটি feedback পাঠিয়েছেন।`, feedbackRef.id)
    )
  );

  const feedback = serializeDoc(await feedbackRef.get());
  return c.json({ success: true, feedback }, 201);
};

// @route  GET /api/feedback/my
// @desc   The logged-in user's own submitted feedback (so they can see it landed)
export const getMyFeedback = async (c) => {
  const user = c.get("user");
  const feedback = serializeDocs(await collections.feedback.where("userUid", "==", user.id).get());
  return c.json({ success: true, feedback: sortByNewest(feedback) });
};

// @route  GET /api/feedback  (admin only)
export const getAllFeedback = async (c) => {
  const { status } = c.req.query();
  let feedback = serializeDocs(await collections.feedback.get());
  if (status) feedback = feedback.filter((item) => item.status === status);
  return c.json({ success: true, feedback: sortByNewest(feedback) });
};

// @route  PATCH /api/feedback/:id/status  (admin only)
export const updateFeedbackStatus = async (c) => {
  const body = await readBody(c);
  const { status } = body;
  if (!["new", "reviewed"].includes(status)) {
    throw new HttpError(400, "status must be 'new' or 'reviewed'");
  }
  const feedbackRef = collections.feedback.doc(c.req.param("id"));
  const existing = serializeDoc(await feedbackRef.get());
  if (!existing) {
    throw new HttpError(404, "Feedback not found");
  }
  await feedbackRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
  return c.json({ success: true, feedback: serializeDoc(await feedbackRef.get()) });
};