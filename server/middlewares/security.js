// Security headers equivalent of `helmet` for the Hono app. Pure Web-standard
// response-header writes, so it runs identically on Node and Cloudflare
// Workers. This is static — no per-request logic.

const SECURE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
};

export const secureHeaders = async (c, next) => {
  for (const [key, value] of Object.entries(SECURE_HEADERS)) {
    c.header(key, value);
  }
  await next();
};

export default secureHeaders;