// Short-lived Google OAuth2 access tokens minted from a service account,
// required to call the Firestore REST / Identity Toolkit REST APIs.
//
// The token is obtained by signing a JWT assertion with the service-account
// private key (WebCrypto via `jose`) and exchanging it at Google's token
// endpoint. Works on Node.js and Cloudflare Workers alike.
import { SignJWT, importPKCS8 } from "jose";
import { getServiceAccount } from "../config/serviceAccount.js";

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // refresh when under 5 min of life left
const cache = new Map(); // scope -> { token, expiresAt }

const assertJwt = async (account, scope) => {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(account.private_key, "RS256");
  return await new SignJWT({ scope })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(account.client_email)
    .setSubject(account.client_email)
    .setAudience(TOKEN_URI)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
};

// Returns a cached, unexpired access token for the given scope.
export const getServiceAccountToken = async (scope) => {
  const account = getServiceAccount();
  if (!account?.client_email || !account?.private_key) {
    throw new Error("Service account is not configured (check FIREBASE_SERVICE_ACCOUNT_*).");
  }

  const hit = cache.get(scope);
  if (hit && hit.expiresAt > Date.now() + REFRESH_BEFORE_MS) return hit.token;

  const assertion = await assertJwt(account, scope);
  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain Google OAuth2 token (${res.status}).`);
  }
  const payload = await res.json();
  const token = payload.access_token;
  cache.set(scope, { token, expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000 });
  return token;
};

export const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
export const CLOUD_PLATFORM_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform";

export default getServiceAccountToken;