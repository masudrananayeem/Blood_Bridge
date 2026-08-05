import { Hono } from "hono";
import { protect } from "../middlewares/authMiddleware.js";
import {
  updateProfile,
  toggleAvailability,
  switchMode,
  getDonationHistory,
  recordDonation,
  searchDonors,
  toggleSavedDonor,
  getSavedDonors,
  deleteMyAccount,
} from "../controllers/userController.js";

const router = new Hono();

router.use(protect); // every route below requires a logged-in user

router.put("/profile", updateProfile);
router.patch("/availability", toggleAvailability);
router.patch("/mode", switchMode);
router.get("/donation-history", getDonationHistory);
router.post("/record-donation", recordDonation);
router.get("/search-donors", searchDonors);
router.get("/saved-donors", getSavedDonors);
router.patch("/saved-donors/:donorId", toggleSavedDonor);
router.delete("/me", deleteMyAccount);

export default router;