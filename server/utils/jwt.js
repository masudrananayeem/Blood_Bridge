// Signs/verifies the app's own backend JWTs (issued after Firebase login sync)
// with HS256 via `jose` — WebCrypto based, so it runs on Node and Workers.
import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "../config/env.js";

const secretKey = () => new TextEncoder().encode(getEnv("JWT_SECRET"));

export const createAppToken = async ({ uid, role }) =>
  new SignJWT({ uid, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getEnv("JWT_EXPIRES_IN", "7d"))
    .sign(secretKey());

export const verifyAppToken = async (token) => {
  const { payload } = await jwtVerify(token, secretKey());
  return payload;
};

export default { createAppToken, verifyAppToken };