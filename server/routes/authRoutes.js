import { Hono } from "hono";
import { rateLimit } from "../middlewares/ratelimit.js";
import { register, login, googleAuth, getMe } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRegister } from "../middlewares/validators.js";

const router = new Hono();

// Tighter limit than the global API limiter — auth endpoints are the most
// common target for brute-force / account-creation abuse.
const authLimiter = rateLimit({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many attempts, please try again later.",
});

router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.get("/me", protect, getMe);

export default router;