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

**Hosting:** Frontend → Cloudflare Pages · Backend → Cloudflare Workers (same code, also runs on Node) · Database → Firebase Firestore · Images → Cloudinary

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

Everything runs on Cloudflare: **frontend on Cloudflare Pages**, **backend on Cloudflare Workers**. The frontend calls the same-origin `/api/*`, which a Pages Function proxies to the Worker — so the backend URL is **never exposed to the browser**.

### Backend → Cloudflare Workers

The `server/` folder is a single Hono app with two entry points (`server.js` for Node, `worker.js` for Workers). From `server/`:

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

`wrangler.toml` is preconfigured: worker `blood-bridge-server`, `main = "worker.js"`,
`[vars] CLIENT_URL`, `[observability] enabled`, and `preview_urls = false`.
Set `CLIENT_URL` to your frontend origin, then deploy:

```bash
npx wrangler deploy
```

Deployed URL: `https://blood-bridge-server.<your-account-subdomain>.workers.dev`.

Notes:
- Firestore/Auth use Google REST (OAuth2 service-account tokens) — no extra bindings needed.
- For durable, cross-edge rate limiting, `npx wrangler kv namespace create RATE_LIMITER`
  and uncomment `[[kv_namespaces]]` in `wrangler.toml`. Without KV, the limiter is in-process.
- Local `npm run dev` / `npm start` behave the same (same routes, port `5000`).

### Frontend → Cloudflare Pages

1. Push the `client/` folder to a GitHub repo (e.g. `Blood_Bridge-Client`).
2. In Cloudflare Pages: **Create project → connect the repo**.
3. Build settings: build command `npm run build`, output directory `dist`.
4. Add environment variables (Production):

   ```
   VITE_API_URL=/api                          # same-origin base — never a full URL
   API_ORIGIN=https://blood-bridge-server.<account>.workers.dev   # server-side proxy target
   VITE_FIREBASE_API_KEY=...                  # Firebase web config
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_CLOUDINARY_CLOUD_NAME=...
   VITE_CLOUDINARY_UPLOAD_PRESET=...
   ```

5. Deploy.

How the proxy works:
- `client/functions/api/[[path]].js` forwards any `/api/*` request to `API_ORIGIN` (a server-side Pages variable, never shipped to the browser).
- `client/public/_redirects` (`/* /index.html 200`) enables SPA deep links.
- In local dev, `client/vite.config.js` proxies `/api` to `API_PROXY_ORIGIN` (set in `client/.env.local`), so the backend URL stays hidden in dev too.

### Database

Firebase Firestore — enable Authentication (Email/Password + Google) and create the required collections in your Firebase project. The service-account secret above must belong to the same project as the frontend's Firebase config.

---



## 📸 Screenshots

_Add screenshots of the landing page, dashboards, and admin panel here once deployed._

---

## 📄 License

This project is provided as a starter/reference implementation. Add your preferred license (MIT recommended) before publishing.
