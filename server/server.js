// Node.js entry point (local dev, Render, any Node host).
// Serves the exact same Hono app as the Cloudflare Worker.
import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const app = createApp();
const PORT = Number(process.env.PORT || 5000);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 BloodBridge server running on port ${PORT}`);
});