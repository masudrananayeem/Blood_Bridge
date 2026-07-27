import jwt from "jsonwebtoken";
import { db } from "../config/firebaseAdmin.js";
import { serializeDoc } from "../utils/firestore.js";

// Verifies our own backend JWT (issued after Firebase login sync)
// and attaches the Firestore user document to req.user
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const user = serializeDoc(userSnap);
    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(new Error("Not authorized, token invalid or expired"));
  }
};

// Restricts a route to specific role(s), e.g. authorize("admin")
export const authorize =
  (...roles) =>
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        res.status(403);
        return next(new Error("Forbidden — insufficient permissions"));
      }
      next();
    };
