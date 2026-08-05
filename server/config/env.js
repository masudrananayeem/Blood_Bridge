// Runtime-agnostic environment access.
//
// Cloudflare Workers exposes env vars/bindings per-request on `c.env`, while
// Node reads from `process.env`. This module unifies the two: anything set on
// the request context wins; otherwise we fall back to Node's process.env.
// `setEnv()` is called at the top of the request pipeline so bindings are
// available to pure utility modules (Firestore, JWT, Cloudinary, ...) that
// have no Hono context of their own.

let runtimeEnv = {};

export const setEnv = (env) => {
  runtimeEnv = env || {};
};

export const getEnv = (key, fallback) => {
  const nodeEnv = typeof process !== "undefined" && process.env ? process.env : {};
  const hasRuntime = Object.prototype.hasOwnProperty.call(runtimeEnv, key);
  const value = hasRuntime && runtimeEnv[key] !== null && runtimeEnv[key] !== undefined ? runtimeEnv[key] : nodeEnv[key];
  return value === undefined || value === null ? fallback : value;
};

export const isProduction = () => getEnv("NODE_ENV") === "production";

export default { setEnv, getEnv, isProduction };