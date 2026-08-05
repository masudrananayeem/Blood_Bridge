# 🩸 BloodBridge

A full-stack blood donation management platform that connects blood donors with people in need through one secure, single-account platform. Users register once and can switch between **Donor** and **Seeker** mode at any time.

---

## ✨ Features

- **Landing Page** — animated hero, stats, benefits, services, how-it-works, blood group directory, FAQ accordion, testimonials, CTA, footer (dark/light mode throughout)
- **Authentication** — Email/Password + Google login via Firebase, email verification, password reset
- **Single Account, Two Roles** — switch between Donor and Seeker mode without creating a second account
- **Donor Dashboard** — availability toggle, donation history, incoming requests (accept/reject), nearby requests, notifications
- **Seeker Dashboard** — donor search with filters, emergency blood request, my requests, saved donors, request history
- **Admin Dashboard** — platform-wide stats, manage/verify/delete users, approve/manage blood requests, analytics
- **Notifications** — real backend-driven notifications for new requests, accepted/rejected responses, and profile verification
- **Security** — JWT-protected APIs, Firebase-verified identity, rate limiting, input validation, Helmet, password hashing (Firebase-managed)

---

## 🛠 Tech Stack

**Frontend:** React (Vite), Tailwind CSS, Framer Motion, React Router DOM, Axios, React Hook Form, React Hot Toast, React Icons, Firebase Auth SDK

**Backend:** Hono (Web-standard HTTP, runs on Node **and** Cloudflare Workers), @hono/node-server (Node host), jose + WebCrypto (JWT), Firestore REST + Firebase Auth REST (no firebase-admin SDK needed), Cloudinary REST

**Hosting:** Frontend → Vercel · Backend → Render (Node) **or** Cloudflare Workers (same code) · Database → Firebase Firestore · Images → Cloudinary

> The backend is a single Hono app with two thin entry points — `server.js`
> (`@hono/node-server` for Node/Render) and `worker.js` (Cloudflare Workers).
> Routes, controllers, and data access are shared; nothing is duplicated.

---

## 📁 Project Structure

```
bloodbridge/
├── client/                      # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── common/          # Logo, ThemeToggle, Loader, PrivateRoute
│       │   ├── landing/         # Navbar, Hero, WhyDonate, Benefits, Services,
│       │   │                    #   HowItWorks, BloodGroups, FAQ, Testimonials,
│       │   │                    #   CTA, Footer
│       │   ├── auth/            # AuthLayout, FormInput
│       │   ├── dashboard/       # Sidebar, Topbar, RoleSwitch, StatCard,
│       │   │                    #   ProfileForm, Notifications, AccountSettings
│       │   ├── donor/           # AvailabilityToggle, DonationHistory,
│       │   │                    #   IncomingRequests, NearbyRequests
│       │   ├── seeker/          # SearchDonor, EmergencyRequestForm,
│       │   │                    #   RequestsList, SavedDonorsList
│       │   └── admin/           # AdminSidebar, AdminTopbar
│       ├── pages/                # Route-level pages (auth/, donor/, seeker/, admin/)
│       ├── layouts/              # DashboardLayout, AdminLayout
│       ├── context/               # ThemeContext, AuthContext
│       ├── services/              # axiosInstance + one file per API domain
│       ├── config/                 # firebase.js
│       └── utils/                  # districts.js, bloodGroups.js
│
├── server/                      # Hono backend (Node + Cloudflare Workers)
│   ├── app.js                   # single Hono app shared by both entry points
│   ├── server.js                # Node entry (@hono/node-server) — npm start
│   ├── worker.js                # Cloudflare Workers entry — npx wrangler deploy
│   ├── wrangler.toml            # Cloudflare Workers config
│   ├── controllers/             # auth, user, request, admin, notification, organization, feedback
│   ├── routes/                  # one Hono router per domain
│   ├── middlewares/             # auth, validators, rate limit, security headers, error handler
│   ├── config/                  # env + service-account access (runtime-agnostic)
│   ├── utils/                   # firestore REST client, auth REST, jwt, notify, cloudinary, districtCoords
│   └── scripts/                 # admin/cleanup CLI helpers (Node only)
│
└── .gitignore
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- A Firebase project (Authentication enabled: Email/Password + Google)
- A Cloudinary account (for profile image uploads)

### 1. Clone / extract the project
```bash
cd bloodbridge
```

### 2. Backend setup
```bash
cd server
npm install
cp .env.example .env
```
Fill in `server/.env`:
```
JWT_SECRET=a long random string
FIREBASE_SERVICE_ACCOUNT_BASE64=your service account JSON, base64-encoded
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

Generate the Firebase service account base64 value:
```bash
base64 -i serviceAccountKey.json | tr -d '\n'
```

Run the server:
```bash
npm run dev      # http://localhost:5000
```

### 3. Frontend setup
```bash
cd client
npm install
cp .env.example .env
```
Fill in `client/.env` with your Firebase web config and Cloudinary unsigned upload preset.

Run the client:
```bash
npm run dev       # http://localhost:5173
```

### 4. Create an admin account
Public registration always creates a `donor`/`seeker` account. To create an admin, register normally, then change that user's Firestore document in the `users` collection so `role` is `"admin"`.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create Firestore profile after Firebase signup |
| POST | `/api/auth/login` | Exchange Firebase token for backend JWT |
| GET | `/api/auth/me` | Get logged-in user's profile |
| PUT | `/api/users/profile` | Update profile |
| PATCH | `/api/users/availability` | Toggle donor availability |
| PATCH | `/api/users/mode` | Switch Donor ⇄ Seeker |
| GET | `/api/users/search-donors` | Search donors by group/location |
| GET/PATCH | `/api/users/saved-donors` | List / toggle saved donors |
| GET | `/api/users/donation-history` | Donor's donation history |
| POST | `/api/requests` | Create a blood request |
| GET | `/api/requests/my-requests` | Seeker's own requests |
| GET | `/api/requests/incoming` | Donor's matching request queue |
| GET | `/api/requests/nearby` | Donor's broader district queue |
| PATCH | `/api/requests/:id/respond` | Donor accepts/rejects a request |
| PATCH | `/api/requests/:id/cancel` | Seeker cancels a request |
| GET | `/api/notifications` | List notifications + unread count |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/admin/stats` | Dashboard stat cards |
| GET | `/api/admin/analytics` | Blood group / request distribution |
| GET/PATCH/DELETE | `/api/admin/users` | Manage users, verify, delete |
| GET/PATCH | `/api/admin/requests` | Manage & update request status |

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

---

## ☁️ Deployment

**Frontend (Vercel):**
1. Push the `client/` folder to a GitHub repo
2. Import it in Vercel → set root directory to `client`
3. Add the same variables from `client/.env` as Vercel environment variables
4. Deploy — Vercel auto-detects Vite

**Backend (Render):**
1. Push the `server/` folder to a GitHub repo (or the same repo, different root)
2. Create a new Web Service on Render → root directory `server`
3. Build command: `npm install` · Start command: `npm start`
4. Add all `server/.env` variables in Render's Environment tab
5. Update `CLIENT_URL` to your deployed Vercel URL, and update the frontend's `VITE_API_URL` to your Render URL

**Database:** Firebase Firestore — create the required collections in your Firebase project.

### ☁️ Cloudflare Workers (alternative backend host)

The **exact same code** runs on Cloudflare Workers — no fork, no rewrite. From `server/`:

```bash
cd server
npm install
npx wrangler login
```

Set the secrets (never put secrets in `wrangler.toml`):

```bash
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_BASE64   # paste value when prompted
npx wrangler secret put JWT_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

Then deploy:

```bash
npx wrangler deploy
```

Notes:
- Edit `server/wrangler.toml` → `[vars]` → set `CLIENT_URL` to your frontend and a
  `compatibility_date`. Entry is `worker.js` (already set).
- To get durable, cross-edge rate limiting, create a KV namespace
  (`npx wrangler kv namespace create RATE_LIMITER`) and uncomment the
  `[[kv_namespaces]]` block in `wrangler.toml`. Without KV, the limiter uses an
  in-process counter (fine for Node and small-scale Workers).
- The Firestore/Auth client talks to Google over HTTPS REST (OAuth2 service-account
  tokens), so it needs no extra bindings — just the service-account secret above.
- Local `npm run dev` / `npm start` behaviour is unchanged (same routes, same port).

---

## 📸 Screenshots

_Add screenshots of the landing page, dashboards, and admin panel here once deployed._

---

## 📄 License

This project is provided as a starter/reference implementation. Add your preferred license (MIT recommended) before publishing.
