import admin from "../config/firebaseAdmin.js";
import { collections, serializeDoc, serializeDocs, FieldValue } from "../utils/firestore.js";
import { maskDonorContact } from "../utils/mask.js";
import { distanceBetweenDistricts } from "../utils/districtCoords.js";
import { deleteUserCascade } from "../utils/deleteUserData.js";

const loadUsers = async () => serializeDocs(await collections.users.get());

const sortByDateDesc = (items, field = "createdAt") =>
  [...items].sort((left, right) => new Date(right[field] || 0) - new Date(left[field] || 0));

// @route  PUT /api/users/profile
// @desc   Update editable profile fields
export const updateProfile = async (req, res, next) => {
  try {
    const editable = [
      "fullName",
      "phone",
      "bloodGroup",
      "district",
      "upazila",
      "address",
      "photoURL",
    ];
    const updates = { updatedAt: FieldValue.serverTimestamp() };
    editable.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Present address is mandatory — every donor/seeker match, "near me"
    // search, and emergency broadcast depends on it, so it can never be
    // cleared out via a profile update.
    if (updates.address !== undefined && !String(updates.address).trim()) {
      res.status(400);
      throw new Error("Present address is required");
    }
    if (updates.district !== undefined && !String(updates.district).trim()) {
      res.status(400);
      throw new Error("District is required");
    }

    await collections.users.doc(req.user.id).update(updates);
    const user = serializeDoc(await collections.users.doc(req.user.id).get());
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/users/availability
// @desc   Toggle the donor's Available / Unavailable status. Turning this
//         off immediately removes the donor from seeker search results and
//         from any new broadcast/emergency request matching.
export const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    await collections.users.doc(req.user.id).update({
      isAvailable: !!isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const user = serializeDoc(await collections.users.doc(req.user.id).get());
    res.json({ success: true, isAvailable: user.isAvailable });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/users/mode
// @desc   Switch the single account between Donor and Seeker mode
export const switchMode = async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!["donor", "seeker"].includes(mode)) {
      res.status(400);
      throw new Error("mode must be 'donor' or 'seeker'");
    }

    await collections.users.doc(req.user.id).update({
      activeMode: mode,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const user = serializeDoc(await collections.users.doc(req.user.id).get());
    res.json({ success: true, activeMode: user.activeMode });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/users/donation-history
// @desc   Return the logged-in donor's donation history
export const getDonationHistory = async (req, res, next) => {
  try {
    const history = serializeDocs(await collections.donationHistory.where("donorUid", "==", req.user.id).get());
    res.json({ success: true, history: sortByDateDesc(history, "donationDate") });
  } catch (err) {
    next(err);
  }
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

const toPublicDonor = (user) =>
  Object.fromEntries(PUBLIC_DONOR_FIELDS.filter((field) => field in user).map((field) => [field, user[field]]));

// @route  GET /api/users/search-donors
// @desc   Search for available donors by blood group / location. Only
//         donors who currently have "active" (isAvailable) status show up
//         here at all — turning availability off hides a donor from every
//         seeker immediately. Contact info (phone/email) is always masked;
//         it is only revealed on a request once that donor accepts it.
export const searchDonors = async (req, res, next) => {
  try {
    const { bloodGroup, district, upazila, verifiedOnly, nearMe } = req.query;
    const users = await loadUsers();
    const seekerDistrict = req.user.district;

    let donors = users
      .filter((user) => user.role !== "admin" && user.activeMode === "donor" && user.isAvailable)
      .filter((user) => !bloodGroup || user.bloodGroup === bloodGroup)
      .filter((user) => !district || user.district === district)
      .filter((user) => !upazila || user.upazila?.toLowerCase().includes(upazila.toLowerCase()))
      .filter((user) => verifiedOnly !== "true" || user.isVerified)
      .filter((user) => user.id !== req.user.id)
      .map((user) => {
        const distanceKm = distanceBetweenDistricts(seekerDistrict, user.district);
        return { ...toPublicDonor(user), distanceKm };
      });

    // "Near me" (or the default view with no district filter): closest
    // donors to the seeker's own present-address district first.
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

    res.json({
      success: true,
      donors: donors.slice(0, 50).map(maskDonorContact),
    });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/users/saved-donors/:donorId
// @desc   Add/remove a donor from the logged-in seeker's saved list
export const toggleSavedDonor = async (req, res, next) => {
  try {
    const { donorId } = req.params;
    const userSnap = await collections.users.doc(req.user.id).get();
    const currentUser = serializeDoc(userSnap);
    const savedDonors = Array.isArray(currentUser.savedDonors) ? [...currentUser.savedDonors] : [];
    const already = savedDonors.includes(donorId);

    const nextSavedDonors = already
      ? savedDonors.filter((savedId) => savedId !== donorId)
      : [...savedDonors, donorId];

    await collections.users.doc(req.user.id).update({
      savedDonors: nextSavedDonors,
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.json({ success: true, savedDonors: nextSavedDonors, saved: !already });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/users/saved-donors
export const getSavedDonors = async (req, res, next) => {
  try {
    const currentUser = serializeDoc(await collections.users.doc(req.user.id).get());
    const savedDonors = Array.isArray(currentUser.savedDonors) ? currentUser.savedDonors : [];

    const donors = (
      await Promise.all(savedDonors.map(async (donorId) => serializeDoc(await collections.users.doc(donorId).get())))
    ).filter(Boolean);

    res.json({
      success: true,
      donors: donors.map((donor) => {
        const distanceKm = distanceBetweenDistricts(currentUser.district, donor.district);
        return maskDonorContact({ ...toPublicDonor(donor), distanceKm });
      }),
    });
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/users/me
// @desc   Self-service permanent account deletion (Account Settings page)
export const deleteMyAccount = async (req, res, next) => {
  try {
    await deleteUserCascade(admin, req.user);
    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};
