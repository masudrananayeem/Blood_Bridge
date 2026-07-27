import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  updateProfile,
  toggleAvailability,
  switchMode,
  getDonationHistory,
  searchDonors,
  toggleSavedDonor,
  getSavedDonors,
  deleteMyAccount,
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect); // every route below requires a logged-in user

router.put("/profile", updateProfile);
router.patch("/availability", toggleAvailability);
router.patch("/mode", switchMode);
router.get("/donation-history", getDonationHistory);
router.get("/search-donors", searchDonors);
router.get("/saved-donors", getSavedDonors);
router.patch("/saved-donors/:donorId", toggleSavedDonor);
router.delete("/me", deleteMyAccount);

export default router;
