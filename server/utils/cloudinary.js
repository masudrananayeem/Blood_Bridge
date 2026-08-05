// Cloudinary image deletion via its REST API (the `cloudinary` npm SDK relies
// on Node-only crypto/http and cannot run on Cloudflare Workers). Only the
// `destroy` operation is used anywhere in this app, and the admin/upload side
// already happens directly from the browser through an unsigned upload preset.
import { getEnv } from "../config/env.js";

// secure_urls look like:
//   https://res.cloudinary.com/<cloud>/image/upload/v1234567890/bloodbridge/profiles/abc123.jpg
// The public_id Cloudinary needs to delete it is the path after the version
// segment, without the file extension.
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

const sha1Hex = async (text) => {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Best-effort delete — never throws, so a Cloudinary hiccup never blocks a
// profile update or account deletion. Skips anything that isn't a Cloudinary
// URL (e.g. a Google profile photo) since we don't own those.
export const deleteCloudinaryImage = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;

  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const apiSecret = getEnv("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) return;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await sha1Hex(`timestamp=${timestamp}public_id=${publicId}${apiSecret}`);
  const form = new URLSearchParams({
    public_id: publicId,
    timestamp,
    api_key: apiKey,
    signature,
  });

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      console.warn(`Could not delete Cloudinary image (${publicId}): HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`Could not delete Cloudinary image (${publicId}):`, err?.message);
  }
};

export default { getPublicIdFromUrl, deleteCloudinaryImage };