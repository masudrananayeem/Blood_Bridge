import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRegister, handleValidation } from "../middlewares/validators.js";

const router = express.Router();

// Tighter limit than the global API limiter — auth endpoints are the
// most common target for brute-force / account-creation abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});

router.post("/register", authLimiter, validateRegister, handleValidation, register);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);

export default router;
