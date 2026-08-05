// Lightweight, dependency-free request validators (replaces express-validator,
// which is tied to Express). Each validator parses the JSON body once, caches
// it on the context, and short-circuits with a 400 on failure.
import { readBody } from "../utils/request.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const finish = async (c, body, errors) => {
  if (errors.length === 0) {
    c.set("parsedBody", body);
    return;
  }
  return c.json({ success: false, errors }, 400);
};

export const validateRegister = async (c, next) => {
  const body = await readBody(c);
  const errors = [];

  if (!body.idToken) errors.push({ param: "idToken", msg: "idToken is required", value: body.idToken });
  if (!String(body.fullName || "").trim()) errors.push({ param: "fullName", msg: "Full name is required", value: body.fullName });
  if (!/^01[3-9]\d{8}$/.test(body.phone || "")) errors.push({ param: "phone", msg: "Enter a valid Bangladeshi phone number", value: body.phone });
  if (!BLOOD_GROUPS.includes(body.bloodGroup)) errors.push({ param: "bloodGroup", msg: "Invalid blood group", value: body.bloodGroup });
  if (!["male", "female", "other"].includes(body.gender)) errors.push({ param: "gender", msg: "Invalid gender", value: body.gender });
  if (!/^\d{4}-\d{2}-\d{2}/.test(body.dateOfBirth || "")) errors.push({ param: "dateOfBirth", msg: "Invalid date of birth", value: body.dateOfBirth });
  if (!String(body.district || "").trim()) errors.push({ param: "district", msg: "District is required", value: body.district });
  if (!String(body.upazila || "").trim()) errors.push({ param: "upazila", msg: "Upazila is required", value: body.upazila });
  if (!String(body.address || "").trim()) errors.push({ param: "address", msg: "Address is required", value: body.address });

  const rejected = await finish(c, body, errors);
  if (rejected) return rejected;
  await next();
};

export const validateRequest = async (c, next) => {
  const body = await readBody(c);
  const errors = [];

  if (!BLOOD_GROUPS.includes(body.bloodGroup)) errors.push({ param: "bloodGroup", msg: "Invalid blood group", value: body.bloodGroup });
  if (!Number.isInteger(Number(body.units)) || Number(body.units) < 1) errors.push({ param: "units", msg: "Units must be at least 1", value: body.units });
  if (!String(body.hospital || "").trim()) errors.push({ param: "hospital", msg: "Hospital is required", value: body.hospital });
  if (!String(body.district || "").trim()) errors.push({ param: "district", msg: "District is required", value: body.district });
  if (!String(body.upazila || "").trim()) errors.push({ param: "upazila", msg: "Upazila is required", value: body.upazila });
  if (!["Low", "Medium", "High"].includes(body.urgency)) errors.push({ param: "urgency", msg: "Invalid urgency", value: body.urgency });
  if (!/^\d{4}-\d{2}-\d{2}/.test(body.neededByDate || "")) errors.push({ param: "neededByDate", msg: "Invalid date", value: body.neededByDate });
  if (body.message && !(typeof body.message === "string" && body.message.length <= 500)) errors.push({ param: "message", msg: "Message is too long", value: body.message });
  if (body.targetDonorUid !== undefined && body.targetDonorUid !== null && typeof body.targetDonorUid !== "string") errors.push({ param: "targetDonorUid", msg: "Invalid targetDonorUid", value: body.targetDonorUid });
  if (body.isEmergency !== undefined && typeof body.isEmergency !== "boolean") errors.push({ param: "isEmergency", msg: "isEmergency must be true/false", value: body.isEmergency });

  const rejected = await finish(c, body, errors);
  if (rejected) return rejected;
  await next();
};

export default { validateRegister, validateRequest };