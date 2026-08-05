import { Hono } from "hono";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { createFeedback, getMyFeedback, getAllFeedback, updateFeedbackStatus } from "../controllers/feedbackController.js";

const router = new Hono();

router.use(protect);

router.post("/", createFeedback);
router.get("/my", getMyFeedback);
router.get("/", authorize("admin"), getAllFeedback);
router.patch("/:id/status", authorize("admin"), updateFeedbackStatus);

export default router;