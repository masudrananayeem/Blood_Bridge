import { Hono } from "hono";
import { protect } from "../middlewares/authMiddleware.js";
import { getMyNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";

const router = new Hono();

router.use(protect);

router.get("/", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;