import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import { maskDonorContact } from "../utils/mask.js";
import { distanceBetweenDistricts } from "../utils/districtCoords.js";
import { deleteUserCascade } from "../utils/deleteUserData.js";
import { deleteCloudinaryImage } from "../utils/cloudinary.js";
import { getDaysUntilEligible, getNextEligibleDate, isInCooldown, DONATION_COOLDOWN_DAYS } from "../utils/donationEligibility.js";
import { readBody } from "../utils/request.js";
import { HttpError } from "../middlewares/errorHandler.js";

const loadUsers = async () => serializeDocs(await collections.users.get());

// Guards against "ghost" entries showing up to seekers — e.g. a Firestore
// profile left behind after its Firebase Auth account was removed outside
// the app, or a registration that never finished writing all required fields.
const isCompleteProfile = (user) =>
  Boolean(user?.firebaseUid && user?.fullName?.trim() && user?.bloodGroup && user?.district && user?.phone);

const sortByDateDesc = (items, field = "createdAt") =>
  [...items].sort((left, right) => new Date(right[field] || 0) - new Date(left[field] || 0));

// Whole years old, from a "YYYY-MM-DD" date of birth. Returns null if
// missing/invalid — age is optional, not every donor has entered it.
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
};

// @route  PUT /api/users/profile
// @desc   Update editable profile fields
export const updateProfile = async (c) => {
  const body = await readBody(c);
  const editable = [
    "fullName",
    "phone",
    "bloodGroup",
    "district",
    "upazila",
    "address",
    "dateOfBirth",
    "photoURL",
    "preferredLanguage",
  ];
  const updates = { updatedAt: FieldValue.serverTimestamp() };
  editable.forEach((field) => {
    if (body[field] !== undefined) updates[field] = body[field];
  });

  // Present address is mandatory — every donor/seeker match, "near me"
  // search, and emergency broadcast depends on it, so it can never be
  // cleared out via a profile update.
  if (updates.address !== undefined && !String(updates.address).trim()) {
    throw new HttpError(400, "Present address is required");
  }
  if (updates.district !== undefined && !String(updates.district).trim()) {
    throw new HttpError(400, "District is required");
  }

  const user = c.get("user");
  // Recompute completeness against the merged (existing + new) fields — this
  // is what flips a Google sign-up's profile from incomplete to complete once
  // they've filled in blood group / district / phone / etc.
  const merged = { ...user, ...updates };
  updates.profileComplete = isCompleteProfile(merged);
  // The moment an incomplete (Google) profile becomes complete for the first
  // time, make them Available by default — same as a normal signup.
  if (updates.profileComplete && !user.profileComplete) {
    updates.isAvailable = true;
  }

  // Replacing the profile photo? Delete the old one from Cloudinary so
  // storage doesn't fill up with orphaned images. Runs after the doc update
  // succeeds so a slow/failed delete never blocks the response.
  const previousPhotoURL = user.photoURL;
  const photoChanged = updates.photoURL !== undefined && updates.photoURL !== previousPhotoURL;

  await collections.users.doc(user.id).update(updates);

  if (photoChanged && previousPhotoURL) {
    deleteCloudinaryImage(previousPhotoURL);
  }

  const updatedUser = serializeDoc(await collections.users.doc(user.id).get());
  return c.json({ success: true, user: updatedUser });
};

// @route  PATCH /api/users/availability
// @desc   Toggle the donor's Available / Unavailable status. Turning it back
//         ON is blocked while the donor is still inside the 120-day
//         post-donation cooldown window.
export const toggleAvailability = async (c) => {
  const body = await readBody(c);
  const user = c.get("user");
  const currentUser = serializeDoc(await collections.users.doc(user.id).get());

  if (body.isAvailable && isInCooldown(currentUser.lastDonationDate)) {
    const daysLeft = getDaysUntilEligible(currentUser.lastDonationDate);
    throw new HttpError(
      409,
      `আপনি সম্প্রতি রক্ত দিয়েছেন — নিরাপত্তার জন্য আরও ${daysLeft} দিন পর আবার Available হতে পারবেন।`
    );
  }

  await collections.users.doc(user.id).update({
    isAvailable: !!body.isAvailable,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const updatedUser = serializeDoc(await collections.users.doc(user.id).get());
  return c.json({ success: true, isAvailable: updatedUser.isAvailable });
};

// @route  PATCH /api/users/mode
// @desc   Switch the single account between Donor and Seeker mode
export const switchMode = async (c) => {
  const body = await readBody(c);
  if (!["donor", "seeker"].includes(body.mode)) {
    throw new HttpError(400, "mode must be 'donor' or 'seeker'");
  }

  const user = c.get("user");
  await collections.users.doc(user.id).update({
    activeMode: body.mode,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updatedUser = serializeDoc(await collections.users.doc(user.id).get());
  return c.json({ success: true, activeMode: updatedUser.activeMode });
};

// @route  GET /api/users/donation-history
// @desc   Return the logged-in donor's donation history
export const getDonationHistory = async (c) => {
  const user = c.get("user");
  const history = serializeDocs(await collections.donationHistory.where("donorUid", "==", user.id).get());
  return c.json({ success: true, history: sortByDateDesc(history, "donationDate") });
};

// @route  POST /api/users/record-donation
// @desc   Donor self-reports "I donated blood today" — logs it to their
//         donation history, starts the 120-day cooldown (lastDonationDate),
//         and automatically switches them to Unavailable until eligible again.
export const recordDonation = async (c) => {
  const user = c.get("user");
  if (isInCooldown(user.lastDonationDate)) {
    throw new HttpError(
      409,
      `এই তথ্য অনুযায়ী আপনি ইতিমধ্যে সম্প্রতি রক্ত দিয়েছেন — আরও ${getDaysUntilEligible(
        user.lastDonationDate
      )} দিন পর আবার donate করতে পারবেন।`
    );
  }

  const body = await readBody(c);
  const donationDate = FieldValue.serverTimestamp();

  const historyRef = await collections.donationHistory.add({
    donorUid: user.id,
    donorName: user.fullName,
    bloodGroup: user.bloodGroup,
    units: body.units || 1,
    hospital: body.hospital || "স্ব-প্রতিবেদিত রক্তদান",
    district: body.district || user.district,
    donationDate,
    requestId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await collections.users.doc(user.id).update({
    lastDonationDate: donationDate,
    isAvailable: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updatedUser = serializeDoc(await collections.users.doc(user.id).get());
  return c.json({
    success: true,
    user: updatedUser,
    historyId: historyRef.id,
    cooldownDays: DONATION_COOLDOWN_DAYS,
  }, 201);
};

const PUBLIC_DONOR_FIELDS = [
  "fullName",
  "bloodGroup",
  "district",
  "upazila",
  "address",
  "photoURL",
  "isVerified",
  "isAvailable",
  "lastDonationDate",
  "phone",
  "email",
  "createdAt",
  "id",
];

const toPublicDonor = (user) => ({
  ...Object.fromEntries(PUBLIC_DONOR_FIELDS.filter((field) => field in user).map((field) => [field, user[field]])),
  age: calculateAge(user.dateOfBirth),
  daysUntilEligible: getDaysUntilEligible(user.lastDonationDate),
  nextEligibleDate: getNextEligibleDate(user.lastDonationDate),
});

// @route  GET /api/users/search-donors
// @desc   Search for available donors by blood group / location. Only donors
//         with "active" (isAvailable) status show up; contact info is always
//         masked — it is only revealed on a request once that donor accepts it.
export const searchDonors = async (c) => {
  const query = c.req.query();
  const { bloodGroup, district, upazila, verifiedOnly, nearMe } = query;
  const user = c.get("user");
  const users = await loadUsers();
  const seekerDistrict = user.district;

  let donors = users
    .filter(isCompleteProfile)
    .filter((candidate) => candidate.role !== "admin" && candidate.activeMode === "donor" && candidate.isAvailable)
    .filter((candidate) => !bloodGroup || candidate.bloodGroup === bloodGroup)
    .filter((candidate) => !district || candidate.district === district)
    .filter((candidate) => !upazila || candidate.upazila?.toLowerCase().includes(upazila.toLowerCase()))
    .filter((candidate) => verifiedOnly !== "true" || candidate.isVerified)
    .filter((candidate) => candidate.id !== user.id)
    .map((candidate) => {
      const distanceKm = distanceBetweenDistricts(seekerDistrict, candidate.district);
      return { ...toPublicDonor(candidate), distanceKm };
    });

  // "Near me" (or the default view with no district filter): closest donors
  // to the seeker's own present-address district first.
  if (nearMe === "true" || !district) {
    donors = donors.sort((left, right) => {
      const leftDist = left.distanceKm ?? Number.POSITIVE_INFINITY;
      const rightDist = right.distanceKm ?? Number.POSITIVE_INFINITY;
      if (leftDist !== rightDist) return leftDist - rightDist;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  } else {
    donors = sortByDateDesc(donors);
  }

  return c.json({
    success: true,
    donors: donors.slice(0, 50).map(maskDonorContact),
  });
};

// @route  PATCH /api/users/saved-donors/:donorId
// @desc   Add/remove a donor from the logged-in seeker's saved list
export const toggleSavedDonor = async (c) => {
  const user = c.get("user");
  const donorId = c.req.param("donorId");
  const currentUser = serializeDoc(await collections.users.doc(user.id).get());
  const savedDonors = Array.isArray(currentUser.savedDonors) ? [...currentUser.savedDonors] : [];
  const already = savedDonors.includes(donorId);

  const nextSavedDonors = already
    ? savedDonors.filter((savedId) => savedId !== donorId)
    : [...savedDonors, donorId];

  await collections.users.doc(user.id).update({
    savedDonors: nextSavedDonors,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return c.json({ success: true, savedDonors: nextSavedDonors, saved: !already });
};

// @route  GET /api/users/saved-donors
export const getSavedDonors = async (c) => {
  const user = c.get("user");
  const currentUser = serializeDoc(await collections.users.doc(user.id).get());
  const savedDonors = Array.isArray(currentUser.savedDonors) ? currentUser.savedDonors : [];

  const donors = (
    await Promise.all(savedDonors.map(async (donorId) => serializeDoc(await collections.users.doc(donorId).get())))
  ).filter(Boolean).filter(isCompleteProfile);

  return c.json({
    success: true,
    donors: donors.map((donor) => {
      const distanceKm = distanceBetweenDistricts(currentUser.district, donor.district);
      return maskDonorContact({ ...toPublicDonor(donor), distanceKm });
    }),
  });
};

// @route  DELETE /api/users/me
// @desc   Self-service permanent account deletion (Account Settings page)
export const deleteMyAccount = async (c) => {
  const user = c.get("user");
  await deleteUserCascade(user);
  return c.json({ success: true, message: "Account deleted" });
};