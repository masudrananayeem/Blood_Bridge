// Firebase Authentication Admin operations over REST + WebCrypto, so they run
// on Node.js and Cloudflare Workers alike (the official firebase-admin SDK
// requires gRPC and cannot run on Workers).
//
//   verifyIdToken(idToken)  -> decoded claims (uid, email, name, ...)
//   deleteUser(uid)         -> permanently deletes a Firebase Auth account
//   getUserByUid(uid)       -> the Auth record for the given uid
//
// ID tokens are verified against Google's published JWKS (RS256), checking
// `iss`, `aud`, and `exp` like the Admin SDK does.
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getProjectId } from "../config/serviceAccount.js";
import { getServiceAccountToken, CLOUD_PLATFORM_SCOPE } from "./oauthToken.js";

const IDENTITY_TOOLKIT_BASE = "https://identitytoolkit.googleapis.com/v1";
const jwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const adminToken = () => getServiceAccountToken(CLOUD_PLATFORM_SCOPE);

// Verifies a Firebase ID token and returns its claims. Throws on invalid
// tokens (bad signature, wrong audience/issuer, expired, malformed).
export const verifyIdToken = async (idToken) => {
  const projectId = getProjectId();
  if (!projectId) throw new Error("Firebase project ID is not configured.");

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) throw new Error("Invalid ID token (missing subject).");
    // Firebase ID tokens expose the user id via `sub` (and `user_id`), not
    // `uid`. Normalize it so controllers can rely on `decoded.uid`.
    payload.uid = payload.sub || payload.user_id;
    return payload;
  } catch (err) {
    // A malformed/expired/mismatched token should surface as 401, not 500.
    const e = new Error(err?.message || "Invalid ID token");
    e.status = 401;
    throw e;
  }
};

// Deletes a user from Firebase Auth (used by admin delete + self delete).
export const deleteUser = async (uid) => {
  const res = await fetch(`${IDENTITY_TOOLKIT_BASE}/accounts:delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await adminToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ localId: uid }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const code = payload?.error?.message || "";
    // Mirrors the Admin SDK tolerance for already-deleted accounts.
    if (res.status === 400 && /USER_NOT_FOUND|NOT_FOUND/i.test(code)) return;
    throw new Error(code || `Failed to delete user (${res.status})`);
  }
};

// Returns the Firebase Auth record for a uid, or null if it doesn't exist.
export const getUserByUid = async (uid) => {
  const res = await fetch(`${IDENTITY_TOOLKIT_BASE}/accounts:lookup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await adminToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ localId: [uid] }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    if (res.status === 400 && /USER_NOT_FOUND|NOT_FOUND/i.test(payload?.error?.message || "")) return null;
    throw new Error(payload?.error?.message || `Failed to look up user (${res.status})`);
  }
  const payload = await res.json();
  return payload?.users?.[0] || null;
};

export default { verifyIdToken, deleteUser, getUserByUid };