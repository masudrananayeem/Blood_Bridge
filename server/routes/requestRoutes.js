import { Hono } from "hono";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validators.js";
import {
  createRequest,
  getMyRequests,
  cancelRequest,
  getIncomingRequests,
  getNearbyRequests,
  respondToRequest,
} from "../controllers/requestController.js";

const router = new Hono();

router.use(protect);

router.post("/", validateRequest, createRequest);
router.get("/my-requests", getMyRequests);
router.get("/incoming", getIncomingRequests);
router.get("/nearby", getNearbyRequests);
router.patch("/:id/cancel", cancelRequest);
router.patch("/:id/respond", respondToRequest);

export default router;