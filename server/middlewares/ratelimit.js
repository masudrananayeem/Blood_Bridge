// Rate limiting that works on Node and Cloudflare Workers.
//
// - On Workers, if a KV binding named RATE_LIMITER is provided, counters are
//   stored there (durable across isolates / edge nodes).
// - Otherwise an in-process Map is used (fine for the Node server and for a
//   single-isolate Worker; documented behaviour).
//
// Sliding fixed-window per client IP.
import { HttpError } from "./errorHandler.js";

const inMemory = new Map(); // key -> { count, resetAt }

const clientIp = (c) =>
  c.req.header("CF-Connecting-IP") ||
  (c.req.header("x-forwarded-for") || "").split(",")[0].trim() ||
  "unknown";

const storeKeys = (name, key) => ({ infoKey: `rl:${name}:${key}:info`, countKey: `rl:${name}:${key}:count` });

export const rateLimit = ({ name = "api", windowMs = 15 * 60 * 1000, max = 200, message }) => {
  const msg = message || "Too many requests, please try again later.";

  return async (c, next) => {
    const kv = c.env?.RATE_LIMITER;
    const key = clientIp(c);
    const now = Date.now();

    if (kv) {
      const { infoKey, countKey } = storeKeys(name, key);
      let [infoRaw, countRaw] = await Promise.all([kv.get(infoKey), kv.get(countKey)]);
      let resetAt = infoRaw ? Number(infoRaw) : now + windowMs;
      let count = countRaw ? Number(countRaw) : 0;

      if (resetAt <= now) {
        resetAt = now + windowMs;
        count = 0;
      }
      count += 1;

      if (count > max) {
        throw new HttpError(429, msg);
      }

      await Promise.all([kv.put(infoKey, String(resetAt), { expirationTtl: Math.ceil(windowMs / 1000) }), kv.put(countKey, String(count), { expirationTtl: Math.ceil(windowMs / 1000) })]);
      await next();
      return;
    }

    const entry = inMemory.get(key);
    if (!entry || entry.resetAt <= now) {
      inMemory.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
    }

    if (inMemory.get(key).count > max) {
      throw new HttpError(429, msg);
    }
    await next();
  };
};

export default rateLimit;