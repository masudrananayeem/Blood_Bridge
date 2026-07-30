import admin from "../config/firebaseAdmin.js";
import generateToken from "../utils/generateToken.js";
import { collections, serializeDoc, FieldValue, toTimestamp } from "../utils/firestore.js";

// @route  POST /api/auth/register
// @desc   Verify the Firebase ID token, then create the matching Firestore
//         profile with the extra fields collected on the registration form.
export const register = async (req, res, next) => {
  try {
    const {
      idToken,
      fullName,
      email,
      phone,
      bloodGroup,
      gender,
      dateOfBirth,
      district,
      upazila,
      address,
      photoURL,
    } = req.body;

    if (!idToken) {
      res.status(400);
      throw new Error("Missing Firebase ID token");
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const userRef = collections.users.doc(decoded.uid);
    const existing = await userRef.get();

    if (existing.exists) {
      res.status(409);
      throw new Error("This account is already registered");
    }

    await userRef.set({
      firebaseUid: decoded.uid,
      fullName,
      email: email || decoded.email || "",
      phone,
      bloodGroup,
      gender,
      dateOfBirth: toTimestamp(dateOfBirth),
      district,
      upazila,
      address,
      photoURL: photoURL || "",
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
    const token = generateToken(user.id, user.role);

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/login
// @desc   Verify the Firebase ID token (from email/password or Google
//         sign-in) and exchange it for our own backend JWT + Firestore profile.
export const login = async (req, res, next) => {
  try {
    const { firebaseIdToken } = req.body;
    if (!firebaseIdToken) {
      res.status(400);
      throw new Error("Missing Firebase ID token");
    }

    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
    const user = serializeDoc(await collections.users.doc(decoded.uid).get());

    if (!user) {
      res.status(404);
      throw new Error("No profile found for this account — please register first");
    }

    const token = generateToken(user.id, user.role);

    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/google
// @desc   Sign in (or sign up) with Google. Unlike email/password
//         registration, Google only ever gives us a name/email/photo — never
//         blood group, phone, district, or date of birth, which this app
//         genuinely can't function without. So a brand-new Google user gets
//         a minimal profile with `profileComplete: false`; the frontend
//         then routes them to a "Complete Your Profile" step before they can
//         use the rest of the app. An existing Google user just logs in
//         normally, same as `login` above.
export const googleAuth = async (req, res, next) => {
  try {
    const { firebaseIdToken } = req.body;
    if (!firebaseIdToken) {
      res.status(400);
      throw new Error("Missing Firebase ID token");
    }

    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
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
        isAvailable: false, // stays hidden from seekers until the profile is actually complete
        isVerified: false,
        profileComplete: false,
        lastDonationDate: null,
        savedDonors: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const user = serializeDoc(await userRef.get());
    const token = generateToken(user.id, user.role);

    res.json({ success: true, token, user, isNewUser: !existing.exists });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/auth/me
// @desc   Return the logged-in user's profile (req.user set by `protect`)
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
