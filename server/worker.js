// Cloudflare Workers entry point (module format).
// Re-uses the exact same Hono app as the Node server — zero duplication.
import { createApp } from "./app.js";

const app = createApp();

export default {
  fetch: app.fetch,
};

export { app };