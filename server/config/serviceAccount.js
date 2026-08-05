// Service-account credentials for the Google APIs (Firestore, Auth, ...),
// loaded lazily so we never block a request that doesn't touch Google.
//
// Supported env vars (first match wins):
//   1. FIREBASE_SERVICE_ACCOUNT_BASE64  — the legacy single-line base64 JSON
//      (kept for compatibility with existing .env / Render setups)
//   2. FIREBASE_SERVICE_ACCOUNT          — raw service-account JSON string
//   3. GOOGLE_SERVICE_ACCOUNT_JSON       — raw service-account JSON string
//
// Only Web-standard APIs are used (atob / TextDecoder), so this runs on
// Node.js, Cloudflare Workers, and any other Web runtime.
import { getEnv } from "./env.js";

let cached = null;

const decodeBase64 = (base64) => {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const getServiceAccount = () => {
  if (cached) return cached;

  const base64 = getEnv("FIREBASE_SERVICE_ACCOUNT_BASE64");
  const raw = base64 ? null : getEnv("FIREBASE_SERVICE_ACCOUNT") || getEnv("GOOGLE_SERVICE_ACCOUNT_JSON");

  if (base64) {
    cached = JSON.parse(decodeBase64(base64));
  } else if (raw) {
    cached = JSON.parse(raw);
  } else {
    return null;
  }
  return cached;
};

export const getProjectId = () =>
  getServiceAccount()?.project_id || getEnv("FIREBASE_PROJECT_ID") || "";

export default { getServiceAccount, getProjectId };