import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import notify from "../utils/notify.js";

const sortByNewest = (items) =>
  [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

// @route  POST /api/feedback
// @desc   Logged-in user submits feedback/a message that goes to admins
export const createFeedback = async (req, res, next) => {
  try {
    const { message, category } = req.body;
    if (!message || !message.trim()) {
      res.status(400);
      throw new Error("Feedback message is required");
    }

    const feedbackRef = await collections.feedback.add({
      userUid: req.user.id,
      userName: req.user.fullName,
      userEmail: req.user.email,
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
        notify(admin.id, "feedback", `${req.user.fullName} নতুন একটি feedback পাঠিয়েছেন।`, feedbackRef.id)
      )
    );

    const feedback = serializeDoc(await feedbackRef.get());
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/feedback/my
// @desc   The logged-in user's own submitted feedback (so they can see it landed)
export const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = serializeDocs(await collections.feedback.where("userUid", "==", req.user.id).get());
    res.json({ success: true, feedback: sortByNewest(feedback) });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/feedback  (admin only)
export const getAllFeedback = async (req, res, next) => {
  try {
    const { status } = req.query;
    let feedback = serializeDocs(await collections.feedback.get());
    if (status) feedback = feedback.filter((item) => item.status === status);
    res.json({ success: true, feedback: sortByNewest(feedback) });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/feedback/:id/status  (admin only)
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["new", "reviewed"].includes(status)) {
      res.status(400);
      throw new Error("status must be 'new' or 'reviewed'");
    }
    const feedbackRef = collections.feedback.doc(req.params.id);
    const existing = serializeDoc(await feedbackRef.get());
    if (!existing) {
      res.status(404);
      throw new Error("Feedback not found");
    }
    await feedbackRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
    res.json({ success: true, feedback: serializeDoc(await feedbackRef.get()) });
  } catch (err) {
    next(err);
  }
};
