// Verifies the app's own backend JWT (issued after Firebase login sync) and
// attaches the Firestore user document to the context as `user`.
import { verifyAppToken } from "../utils/jwt.js";
import { collections } from "../utils/firestore.js";
import { HttpError } from "./errorHandler.js";

export const protect = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Not authorized, no token");
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyAppToken(token);

    const userSnap = await collections.users.doc(decoded.uid).get();
    if (!userSnap.exists) {
      throw new HttpError(401, "Not authorized, user not found");
    }

    c.set("user", { id: userSnap.id, ...userSnap.data() });
    await next();
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Not authorized, token invalid or expired");
  }
};

// Restricts a route to specific role(s), e.g. authorize("admin")
export const authorize = (...roles) => async (c, next) => {
  const user = c.get("user");
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden — insufficient permissions");
  }
  await next();
};

export default { protect, authorize };