// Centralized error handling for the Hono app. Controllers throw HttpError to
// carry an HTTP status; `onError` shapes the JSON response (same envelope the
// app returned before). Mirrors the previous errorHandler behaviour.
import { getEnv } from "../config/env.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const onError = (err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      {
        success: false,
        message: err.message,
        stack: getEnv("NODE_ENV") === "production" ? undefined : err.stack,
      },
      err.status
    );
  }

  const status =
    Number.isInteger(err?.status)
      ? err.status
      : Number.isInteger(err?.statusCode)
      ? err.statusCode
      : 500;
  return c.json(
    {
      success: false,
      message: err?.message || "Server Error",
      stack: getEnv("NODE_ENV") === "production" ? undefined : err?.stack,
    },
    status
  );
};

export const notFound = (c) =>
  c.json({ success: false, message: `Not Found - ${c.req.path}` }, 404);

export default { HttpError, onError, notFound };