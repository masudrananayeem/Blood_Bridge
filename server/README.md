# 🩸 BloodBridge — Backend API

Hono (Web-standard) backend for the BloodBridge blood-donation platform. The **exact same code** runs on **Node.js** (Render/local) and **Cloudflare Workers** — no fork, no rewrite. It uses a wrapped Firestore REST client + Firebase Auth REST, so it needs **no firebase-admin SDK** and no Cloudflare bindings beyond plain secrets.

---

## 🧱 Tech Stack

- **Hono** — Web-standard HTTP framework (Request/Response, `c.env`, WebCrypto)
- **@hono/node-server** — Node host for local/Render (`server.js`)
- **Cloudflare Workers** — host for the deployed API (`worker.js`)
- **jose + WebCrypto** — JWT verification/signing (service-account + app tokens)
- **Firestore REST + Firebase Auth REST** — data & identity (OAuth2 service-account tokens over HTTPS)
- **Cloudinary REST** — profile image uploads (server-side signing)

> One Hono app (`app.js`) with **two thin entry points**:
> - `server.js` → `@hono/node-server` (`npm start` / `npm run dev`)
> - `worker.js` → Cloudflare Workers (`npx wrangler deploy`)
>
> Routes, controllers, and data access are shared — nothing is duplicated.

---

## 📂 Structure

```
server/
├── app.js               # single Hono app (middleware + route mounting) — source of truth
├── server.js            # Node entry (@hono/node-server)
├── worker.js            # Cloudflare Workers entry (bundled)
├── wrangler.toml        # Workers config ([vars], KV, ...)
├── .env.example         # local Node config
├── controllers/         # auth, user, request, admin, notification, organization, feedback
├── routes/              # one Hono router per domain (validators + authorizers)
├── middlewares/         # auth, validators, ratelimit, security headers, error handler
├── config/              # env.js (runtime-agnostic env access) + serviceAccount.js
├── utils/               # firestoreClient, auth, jwt, notify, cloudinary, districtCoords
└── scripts/             # admin CLI helpers (makeAdmin, listAdmins, cleanup — Node only)
```

`config/env.js` unifies env access for **both** runtimes:

- On **Workers** each request sets `c.env` on the context — bindings are available to the pure utility modules (Firestore, JWT, Cloudinary) that have no Hono context.
- On **Node**, it falls back to `process.env`.
- Everything else just calls `getEnv("KEY")`.

---

## ⚙️ Environment

| Variable | Required | Runtime | Purpose |
|---|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | yes (or `FIREBASE_SERVICE_ACCOUNT` / `GOOGLE_SERVICE_ACCOUNT_JSON`) | secret | base64 of the Firebase service-account JSON (Firestore + Auth) |
| `JWT_SECRET` | yes | secret | signs the app's own access tokens |
| `CLIENT_URL` | yes | var | allowed CORS origin (your frontend) |
| `CLOUDINARY_CLOUD_NAME` | yes | secret | Cloudinary account |
| `CLOUDINARY_API_KEY` | yes | secret | Cloudinary key |
| `CLOUDINARY_API_SECRET` | yes | secret | Cloudinary secret |
| `NODE_ENV` | no | var | `production` strips error `stack`s from responses |
| `PORT` | no | var | Node listen port (default `5000`) |
| `JWT_EXPIRES_IN` | no | var | access-token lifetime (default `7d`) |
| `RATE_LIMITER` | no | binding | optional Workers KV for durable rate limiting |

Service-account resolution (first match wins): `FIREBASE_SERVICE_ACCOUNT_BASE64` → `FIREBASE_SERVICE_ACCOUNT` → `GOOGLE_SERVICE_ACCOUNT_JSON`.

---

## 🚀 Local (Node)

```bash
cd server
npm install
cp .env.example .env       # add your Firebase service-account + JWT secret
npm run dev                # http://localhost:5000
```

## ☁️ Cloudflare Workers

```bash
cd server
npm install
npx wrangler login
```

Set secrets (never put secrets in `wrangler.toml`):

```bash
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_BASE64   # paste value when prompted
npx wrangler secret put JWT_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

Set the non-secret var in `wrangler.toml`:

```toml
name = "blood-bridge-server"      # deploy name → https://blood-bridge-server.<account>.workers.dev

[observability]                   # Live Logs + metrics in the dashboard
enabled = true
head_sampling_rate = 1

[vars]
CLIENT_URL = "https://your-frontend.example"   # must match your frontend origin
```

Deploy:

```bash
npx wrangler deploy        # or: npm run worker:deploy
```

### Workers notes

- **Rate limiting** is in-process by default (a `Map` in each isolate). For durable, cross-isolate/cross-edge limits, create a KV namespace and uncomment the bind in `wrangler.toml`:
  ```bash
  npx wrangler kv namespace create RATE_LIMITER
  ```
- Auth endpoints are capped at **1000 requests / 15 min / IP**; the global API limiter cap is set in `app.js`.
- `compatibility_date` and entry point (`main = "worker.js"`) are preconfigured in `wrangler.toml`.
- **Observability** is enabled (`[observability] enabled = true, head_sampling_rate = 1`) — after deploying, view request logs, metrics, and traces under **Workers → `blood-bridge-server` → Logs/Metrics** in the Cloudflare dashboard.
- Dashboard-set secrets/vars **override** `wrangler.toml` values on deploy; secrets live only in the dashboard.

---

## 🔌 API

Base: `/api`. All routes below except `POST /api/auth/register`, `POST /api/auth/login`, and `POST /api/auth/google` require `Authorization: Bearer <token>`.

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Liveness probe |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Verify Firebase token, create Firestore profile + app JWT |
| POST | `/api/auth/login` | Exchange Firebase token for app JWT; auto-creates a minimal profile if none exists (`isNewUser`) |
| POST | `/api/auth/google` | Google sign-in/up (auto-creates minimal profile) |
| GET | `/api/auth/me` | Current user profile |

### Users
| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/users/profile` | Update profile |
| PATCH | `/api/users/availability` | Toggle donor availability |
| PATCH | `/api/users/mode` | Switch Donor ⇄ Seeker |
| GET | `/api/users/donation-history` | Donor history |
| POST | `/api/users/record-donation` | Record a donation (admin/donor) |
| GET | `/api/users/search-donors` | Filter donors by group/location |
| GET | `/api/users/saved-donors` | List saved donors |
| PATCH | `/api/users/saved-donors/:donorId` | Toggle a saved donor |
| DELETE | `/api/users/me` | Delete own account |

### Requests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/requests` | Create a blood request |
| GET | `/api/requests/my-requests` | Seeker's requests |
| GET | `/api/requests/incoming` | Donor's matching queue |
| GET | `/api/requests/nearby` | Donor's broader-district queue |
| PATCH | `/api/requests/:id/cancel` | Seeker cancels |
| PATCH | `/api/requests/:id/respond` | Donor accepts/rejects |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List + unread count |
| PATCH | `/api/notifications/:id/read` | Mark one read |
| PATCH | `/api/notifications/read-all` | Mark all read |

### Organizations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/organizations` / `/api/organizations/:id` | List / detail |
| POST · PUT · PATCH · DELETE | `/api/organizations` (/`:id`/`/verify`) | Create / update / verify / delete (admin) |

### Feedback
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback/my` | Own feedback |
| GET / PATCH | `/api/feedback` (/`:id/status`) | Admin: list & moderate |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard stat cards |
| GET | `/api/admin/analytics` | Distribution analytics |
| GET / PATCH / DELETE | `/api/admin/users` (/:id/verify) | List, verify, delete users |
| GET / PATCH | `/api/admin/requests` (/:id/status) | List & update request status |

---

## 🛡 Security & Correctness Notes

- **Identity**: Firebase ID tokens verified with `jose` against Google's JWKS; the UID is read from the `sub`/`user_id` claim and normalized to a `uid`-compatible field (`payload.uid = payload.sub || payload.user_id`) so every controller can rely on it.
- **Firestore writes use resource names** (`projects/.../databases/(default)/documents/...`), not full URLs, and `updateMask` is placed at the Write level — the two pitfalls that break Firestore REST `commit`. Reads use URL forms.
- **App JWTs** are signed with `JWT_SECRET`; `Authorization` middleware (`protect`) resolves the user document.
- **Rate limiting** on auth (1000/15min) and a global cap; **input validation** runs per-route with cached parsed bodies + 400 on failure.
- **Security headers** (`secureHeaders`) and a central `onError` that honors `err.status` / `err.statusCode` and strips stacks in production.

---

## 📄 License

Provided as a starter/reference. Add your preferred license before publishing.