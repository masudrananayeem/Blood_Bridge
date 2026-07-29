import cloudinary from "../config/cloudinary.js";

// Cloudinary secure_urls look like:
//   https://res.cloudinary.com/<cloud>/image/upload/v1234567890/bloodbridge/profiles/abc123.jpg
// The "public_id" cloudinary needs to delete it is the path after the
// version segment, without the file extension: bloodbridge/profiles/abc123
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

// Best-effort delete — never throws, so a Cloudinary hiccup never blocks a
// profile update or account deletion. Skips anything that isn't a
// Cloudinary URL (e.g. a Google profile photo) since we don't own those.
export const deleteCloudinaryImage = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`Could not delete old Cloudinary image (${publicId}):`, err.message);
  }
};

export default { getPublicIdFromUrl, deleteCloudinaryImage };
