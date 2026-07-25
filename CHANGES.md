# BloodBridge — Changes in this update

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
