import { verifyIdToken } from "../utils/auth.js";
import { createAppToken } from "../utils/jwt.js";
import { collections, serializeDoc, FieldValue, toTimestamp } from "../utils/firestore.js";
import { readBody } from "../utils/request.js";
import { HttpError } from "../middlewares/errorHandler.js";

// @route  POST /api/auth/register
// @desc   Verify the Firebase ID token, then create the matching Firestore
//         profile with the extra fields collected on the registration form.
export const register = async (c) => {
  const body = await readBody(c);

  if (!body.idToken) {
    throw new HttpError(400, "Missing Firebase ID token");
  }

  const decoded = await verifyIdToken(body.idToken);
  const userRef = collections.users.doc(decoded.uid);
  const existing = await userRef.get();

  if (existing.exists) {
    throw new HttpError(409, "This account is already registered");
  }

  await userRef.set({
    firebaseUid: decoded.uid,
    fullName: body.fullName,
    email: body.email || decoded.email || "",
    phone: body.phone,
    bloodGroup: body.bloodGroup,
    gender: body.gender,
    dateOfBirth: toTimestamp(body.dateOfBirth),
    district: body.district,
    upazila: body.upazila,
    address: body.address,
    photoURL: body.photoURL || "",
    role: "donor",
    activeMode: "donor",
    isAvailable: true,
    isVerified: false,
    profileComplete: true,
    lastDonationDate: null,
    savedDonors: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const user = serializeDoc(await userRef.get());
  const token = await createAppToken({ uid: user.id, role: user.role });

  return c.json({ success: true, token, user }, 201);
};

// @route  POST /api/auth/login
// @desc   Verify the Firebase ID token (from email/password or Google
//         sign-in) and exchange it for our own backend JWT + Firestore profile.
export const login = async (c) => {
  const body = await readBody(c);
  if (!body.firebaseIdToken) {
    throw new HttpError(400, "Missing Firebase ID token");
  }

  const decoded = await verifyIdToken(body.firebaseIdToken);
  const userRef = collections.users.doc(decoded.uid);
  const existing = await userRef.get();
  let isNewUser = false;

  if (!existing.exists) {
    // Nothing in the main email/password registration request (phone, blood
    // group, district, ...) is available at plain sign-in time, so we create
    // a minimal profile and let the frontend route to "Complete your profile"
    // (mirrors Google sign-in). This makes login work for any valid Firebase
    // account that never finished a profile-creation step.
    await userRef.set({
      firebaseUid: decoded.uid,
      fullName: decoded.name || "",
      email: decoded.email || "",
      phone: "",
      bloodGroup: "",
      gender: "",
      dateOfBirth: null,
      district: "",
      upazila: "",
      address: "",
      photoURL: decoded.picture || "",
      role: "donor",
      activeMode: "donor",
      isAvailable: false,
      isVerified: false,
      profileComplete: false,
      lastDonationDate: null,
      savedDonors: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    isNewUser = true;
  }

  const user = serializeDoc(await userRef.get());
  const token = await createAppToken({ uid: user.id, role: user.role });

  return c.json({ success: true, token, user, isNewUser });
};

// @route  POST /api/auth/google
// @desc   Sign in (or sign up) with Google. A brand-new Google user gets a
//         minimal profile with `profileComplete: false`; the frontend routes
//         them to a "Complete Your Profile" step before they can use the app.
//         An existing Google user just logs in normally, same as `login`.
export const googleAuth = async (c) => {
  const body = await readBody(c);
  if (!body.firebaseIdToken) {
    throw new HttpError(400, "Missing Firebase ID token");
  }

  const decoded = await verifyIdToken(body.firebaseIdToken);
  const userRef = collections.users.doc(decoded.uid);
  const existing = await userRef.get();

  if (!existing.exists) {
    await userRef.set({
      firebaseUid: decoded.uid,
      fullName: decoded.name || "",
      email: decoded.email || "",
      phone: "",
      bloodGroup: "",
      gender: "",
      dateOfBirth: null,
      district: "",
      upazila: "",
      address: "",
      photoURL: decoded.picture || "",
      role: "donor",
      activeMode: "donor",
      isAvailable: false,
      isVerified: false,
      profileComplete: false,
      lastDonationDate: null,
      savedDonors: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const user = serializeDoc(await userRef.get());
  const token = await createAppToken({ uid: user.id, role: user.role });

  return c.json({ success: true, token, user, isNewUser: !existing.exists });
};

// @route  GET /api/auth/me
// @desc   Return the logged-in user's profile (set by `protect`)
export const getMe = async (c) => {
  return c.json({ success: true, user: c.get("user") });
};