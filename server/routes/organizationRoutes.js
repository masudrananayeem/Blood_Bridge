import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  toggleVerifyOrganization,
  deleteOrganization,
} from "../controllers/organizationController.js";

const router = express.Router();

router.use(protect); // any logged-in donor/seeker/admin can browse

router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);

// Admin-only management
router.post("/", authorize("admin"), createOrganization);
router.put("/:id", authorize("admin"), updateOrganization);
router.patch("/:id/verify", authorize("admin"), toggleVerifyOrganization);
router.delete("/:id", authorize("admin"), deleteOrganization);

export default router;
