import { Hono } from "hono";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getAnalytics,
  getAllUsers,
  toggleVerifyUser,
  deleteUser,
  getAllRequests,
  updateRequestStatus,
} from "../controllers/adminController.js";

const router = new Hono();

router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/analytics", getAnalytics);

router.get("/users", getAllUsers);
router.patch("/users/:id/verify", toggleVerifyUser);
router.delete("/users/:id", deleteUser);

router.get("/requests", getAllRequests);
router.patch("/requests/:id/status", updateRequestStatus);

export default router;