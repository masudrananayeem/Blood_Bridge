# BloodBridge — Changes in this update

## Backend: now runs on Cloudflare Workers (and Node) — single codebase

The Express + `firebase-admin` backend was replaced with a **single Hono app**
that runs identically on **Node/Render** (`server.js`, same routes/port/JSON)
and **Cloudflare Workers** (`worker.js`, `npx wrangler deploy`). No behavior
changes to any API response.

Why: the official `firebase-admin` SDK depends on gRPC + Node crypto and cannot
run on Cloudflare Workers, so the data/auth layer was moved to Web-standard
`fetch` + `crypto.subtle` bridge `jose`.

Changed:
- **Framework**: Express → Hono (`@hono/node-server` for the Node entry).
- **Firestore**: `firebase-admin` → a thin runtime-agnostic **Firestore REST
  client** (`utils/firestoreClient.js`) mirroring the exact API surface used
  (`collection/doc/add/get/set/update/delete`, `where/limit`, `batch`,
  `FieldValue.serverTimestamp`). Custom encoder/decoder, OAuth2 service-account
  token minting via WebCrypto.
- **Auth**: Firebase `verifyIdToken`/`deleteUser` over REST + Google JWKS
  (`utils/auth.js`). ID-token verification checks `iss`/`aud`/`exp` like the
  Admin SDK.
- **JWT**: `jsonwebtoken` → `jose` (HS256), identical tokens.
- **Rate limiting**: `express-rate-limit` → cross-runtime limiter
  (`utils`/`middlewares/ratelimit.js`) — in-process on Node, Cloudflare **KV**
  backed when a `RATE_LIMITER` namespace is bound.
- **Security headers**: `helmet` → tiny `middlewares/security.js`; `cors`,
  `express-validator`, `morgan` dropped (manual validators, no-op logging).
- **Cloudinary**: SDK → REST delete helper (`utils/cloudinary.js`, SHA1-signed).
- Removed unused deps (`multer`, `bcryptjs`), cut the worker bundle to ~45 KB
  gzipped.
- CLI scripts (make/remove/list-admin, cleanup-orphans) rewritten on the same
  runtime-agnostic modules; `dotenv` kept only for Node/script env loading.

Env: `server/.env.example` now supports either the legacy base64 service-account
or a raw JSON string; on Workers secrets go through `wrangler secret put`.

## Bug fix (affected almost every screen)
The frontend everywhere read `record._id`, but the backend (Firestore) actually
returns `record.id`. This silently broke: donor search cards, saved donors,
incoming/nearby requests, my-requests/history, notifications, and both admin
tables (users & requests). Fixed across all of them.

Also fixed mismatched nested fields the frontend expected but the backend
never sent (`r.seeker.fullName`, `r.acceptedDonor.phone`, etc.) — the backend
sends flat fields (`seekerName`, `acceptedDonorName`, `acceptedDonorPhone`...),
so the UI now reads those directly.

## 1. Profile update
Already existed (`PUT /users/profile`) — now also **requires** `district`
and `address` (present address) to be non-empty on every update, both on the
server and in the Profile form UI.

## 2 & 3. Donor availability + direct requests with a message
- Turning "Availability" OFF already removed a donor from seeker search and
  from broadcast/emergency matching — unchanged, confirmed working.
- **New:** from Search Donor (or Saved Donors), a seeker can tap **Request**
  on any specific donor to open a modal — fill in hospital, units, urgency,
  needed-by date, and an optional personal **message** — and send a request
  directly to that one donor (`targetDonorUid` + `message` on the request).

## 4. Contact masking + reveal-on-accept
- `GET /users/search-donors` and `GET /users/saved-donors` now always return
  **masked** phone/email (`01843******`, `adm****@**.com`) — added
  `server/utils/mask.js`.
- Full contact is only ever written onto the request document itself
  (`acceptedDonorPhone`/`acceptedDonorEmail`) once that donor **accepts**,
  and only the seeker who owns that request sees it, on their My Requests /
  History pages. The donor still sees the seeker's real phone in Incoming
  Requests (the seeker initiated contact), unchanged.
- Both seeker and donor get notifications at every step: new request →
  donor; accepted/rejected → seeker; and now: if one donor accepts a
  broadcast/emergency/target request, every other notified donor gets a
  "this request has been filled" notification too.

## 5. Search Donor — IDs, filters, "Near Me"
- Default view (no filters) now lists every currently-Active donor, sorted
  nearest-first to the seeker's own present-address district.
  Distance is computed with a lightweight haversine calculation over a
  district-centroid lookup table (`server/utils/districtCoords.js`) — no
  external geocoding API/key required.
- Each donor card now shows a short donor ID, blood group, upazila/district,
  masked contact, and (when known) an approximate distance badge.
- Blood group / district / upazila filters still work as before; a new
  **Near Me** toggle re-sorts by proximity to the seeker.

## 6. Emergency — nearest 5 donors only
The Emergency Request form now sends `isEmergency: true` whenever Urgency is
set to **High**. The backend then notifies **only the 5 closest available
donors** with a matching blood group (ranked by district-distance), instead
of broadcasting to everyone. Medium/Low requests keep the previous
same-blood-group + same-district broadcast behaviour.

## 7. Request history
"My Requests" (pending/accepted) and "Request History" (completed/cancelled)
were already wired to real endpoints; the `_id` bug above was the main thing
breaking them. Cards now also show the request's message and whether it was
a Direct or Emergency request.

## 8. Present address required + proximity
- Registration already required `address`; the Profile update form now also
  enforces it (client + server), and is explicitly labelled **Present
  Address** with a note that it drives Near Me / Emergency matching.
- Distance between any two users/requests is derived from their district's
  centroid — same approach used throughout points 5 and 6 above.

## Also added
- **Delete Account** (Account Settings) is now fully functional — it calls a
  new `DELETE /api/users/me` endpoint that cascades the deletion across
  requests, donation history, notifications, the Firestore profile, and the
  Firebase Auth account (same logic the admin "delete user" action uses,
  now shared via `server/utils/deleteUserData.js`).

---

# Round 2 — bug fixes + new features

## Bug: "ghost" donors in seeker search
Some Firestore `users` documents no longer correspond to a real, usable
account — most often because the matching Firebase Auth user was deleted
directly from the Firebase console (bypassing the app), leaving the profile
document behind. These fixes:
- `searchDonors` and `getSavedDonors` now filter out any profile missing
  required fields (`fullName`, `bloodGroup`, `district`, `phone`,
  `firebaseUid`) — `isCompleteProfile()` guard in `userController.js`.
- New `server/scripts/cleanupOrphanedUsers.js` — cross-checks every
  Firestore profile against Firebase Auth and removes any that no longer
  have a matching Auth account (dry-run by default, `--apply` to delete):
  ```
  node scripts/cleanupOrphanedUsers.js
  node scripts/cleanupOrphanedUsers.js --apply
  ```
- `deleteUserCascade` now tolerates an Auth user that's already gone
  (`auth/user-not-found`) instead of throwing, so both the cleanup script
  and the normal admin/self delete flows are robust either way.

## Feature: 120-day post-donation cooldown
- `server/utils/donationEligibility.js` (`DONATION_COOLDOWN_DAYS = 120`) +
  a matching `client/src/utils/donationEligibility.js` for the UI.
- New donor action — **"আজকে রক্ত দিয়েছি" ("I donated today")** on the
  Availability page (`POST /users/record-donation`): logs a donation-history
  entry, sets `lastDonationDate`, and automatically flips the donor to
  Unavailable.
- `toggleAvailability` now rejects turning Availability back ON while still
  inside the 120-day window (server + client both block it), with the
  donor's own page showing "আরও N দিন পর আবার Available" and the exact date.
- Every donor card sent to a seeker (Search Donor, Saved Donors) now
  includes `daysUntilEligible` / `nextEligibleDate`; Saved Donors (which
  isn't filtered by availability) shows a day-count badge and disables the
  "Request" button while a saved donor is cooling down.
- Admin marking a request "completed" also now flips that donor to
  Unavailable (previously only set `lastDonationDate`, so this was
  inconsistent with the self-service flow).

## Bug: clicking the "BloodBridge" logo felt like it logged you out
`Logo.jsx` always linked to `/` (the public landing page), which only shows
a "Login" button — so clicking it while signed in looked like an instant
logout even though the session was still active. It now checks auth state
and links to `/dashboard` (or `/admin` for admins) when already logged in.

## Feature: clearer "check your email" verification notice
Registration already sent a Firebase verification email, but it only
surfaced as a toast that disappeared in a couple of seconds. Now, after
signup, the user lands on a persistent confirmation screen that explicitly
tells them to check their **Spam/Junk folder**, plus a "resend email"
button (`resendVerificationEmail` in `AuthContext`).

## Feature: notification bell → dropdown → notifications page
The bell in the dashboard Topbar previously navigated straight to the
Notifications page. It's now a proper dropdown: shows the 5 most recent
notifications inline, clicking one marks it read and takes you to the full
Notifications page, plus a "সব নোটিফিকেশন দেখুন" footer link.

## Feature: clearer request details for donors
Incoming Requests cards (donor side) now show the seeker's request details
as clearly labeled rows — **Blood Group:**, **Units Needed:**, **Hospital
Name:**, **Place:**, **Needed By:** — instead of a single run-together line.


---

# Round 3 — bilingual UI, profile polish, organizations directory, visual redesign

## 1. Bangla / English language toggle
- `LanguageContext` + `i18n/translations.js` — persisted to localStorage, no reload needed.
- EN/বাং toggle button in both the dashboard Topbar and the public Navbar.
- Wired into: Sidebar (donor/seeker), AdminSidebar, Topbar, Navbar, Hero.
- Infrastructure is app-wide and reusable — more page content can be added
  to `translations.js` incrementally using the same `t("section.key")` pattern.

## 2 & 3. Profile photo replacement + age
- Confirmed/completed: replacing a profile photo deletes the old Cloudinary
  image automatically (`utils/cloudinaryHelpers.js`).
- Fixed a field-name bug: registration saved the date of birth as `dob`,
  while the rest of the app expected `dateOfBirth` — unified to `dateOfBirth`
  everywhere (server + client).
- Age is now shown on the profile form (with a live preview as you edit the
  date), and on donor cards seekers see (Search Donor, Saved Donors).

## 7. Blood Donor Organizations directory
- New `organizations` Firestore collection + full CRUD API
  (`/api/organizations`) — any logged-in user can browse, only admins can
  add/edit/verify/delete.
- New "Organizations" page in both the donor and seeker sidebars — search by
  name, filter by district/type (Voluntary Group / NGO / Blood Bank /
  Hospital), shows contact info, logo, verified badge.
- New Admin → Organizations page: add/edit (with logo upload), verify,
  delete.

## 4 & 6. Visual polish
- Rebuilt the landing page Hero: dark professional gradient background, an
  abstract Bangladesh-map silhouette and dot-grid texture (drawn in SVG/CSS
  — no external stock photos, to avoid any copyright/real-person issues),
  live stats row, bilingual copy.
- Rebuilt Admin Overview to match the polish of the donor/seeker dashboards:
  a welcome banner (dark-themed, distinct from the donor/seeker red
  gradient), a blood-group distribution chart, an organizations summary
  card, and quick-action cards (Manage Users, Approve Requests,
  Organizations, Analytics).
- Donor/Seeker overview dashboards already had a solid gradient-banner +
  stat-card + quick-links layout from earlier work — left as-is since they
  already matched the target quality.

## Verification
Every backend `.js` file and every frontend `.jsx`/`.js` file in the project
was syntax-checked (`node --check` / `esbuild`) after these changes — all
pass clean.

---

# Round 4 — Google sign-in (done properly), i18n expansion, dark-mode fix hardened

## Google Sign-In — now fully functional
Previously removed because it was broken (Google never gives blood group /
phone / district / DOB, so the backend just returned "no profile found").
Rebuilt properly this time:
- New `POST /api/auth/google` endpoint — logs in an existing Google user
  normally; for a brand-new Google user, auto-creates a minimal profile with
  `profileComplete: false` and `isAvailable: false` (so they're invisible to
  seekers until they finish setting up).
- New `/complete-profile` page — collects blood group, phone, district,
  upazila, address, and date of birth. `PrivateRoute` now redirects any
  logged-in user with `profileComplete: false` here automatically, from
  anywhere in the app, until they finish.
- Once they submit, `updateProfile` recomputes `profileComplete` from the
  merged fields and flips them back to `isAvailable: true` — same as a
  normal signup.
- "Sign up with Google" button added to the Register page; "Login with
  Google" restored on the Login page — both route correctly based on
  `profileComplete`.

## Dark-mode dropdown fix, hardened
The earlier `color-scheme` fix was set on `html.dark` only. Some browsers
only pick the right theme for a `<select>`'s *open* popup list when
`color-scheme` is set on the `<select>` element itself — added that
explicitly (`select { color-scheme: light } html.dark select { color-scheme: dark }`).

## i18n expansion
Wired `useLanguage()` / `t()` into: `RoleSwitch` (the "Current Mode: Blood
Donor/Seeker" dropdown — was hardcoded English before, showing English even
in Bangla mode), and the public `Footer`.
