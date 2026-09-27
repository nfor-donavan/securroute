# SecurRoute — MERN + Expo

## Backend (Render)
cd backend && npm install && cp .env.example .env
Fill MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, FRONTEND_URL, SMTP_USER, SMTP_PASS (see below).
npm run create-admin && npm start
Render: root dir `backend`, build `npm install`, start `npm start`, add the same env vars.

### Forgot-password email (Gmail SMTP, free)
1. Turn on 2-Step Verification on the Gmail account you'll send from.
2. Google Account -> Security -> App passwords -> create one for "Mail". Copy the 16-character code.
3. Set SMTP_USER to that Gmail address and SMTP_PASS to the app password (not your normal Gmail password).
4. Set FRONTEND_URL to your deployed web portal's URL, e.g. https://securroute-web.onrender.com
   The reset email links to `${FRONTEND_URL}/?reset=TOKEN`, which the portal reads automatically.
If SMTP_USER/SMTP_PASS aren't set, the API still works — it just logs the reset link to the server console instead of emailing it, handy for local testing.

## Web
cd web && npm install && cp .env.example .env (set VITE_API_URL) && npm run dev
Pages: Overview, Checks, Registry, Map, Reports, Agents, Audit (admin-only).
"Forgot password?" on the login screen sends a reset email; the link opens the reset form automatically.

## Mobile (OCR needs a development or preview build, not Expo Go)
cd mobile && npm install && edit config.js (API URL, checkpoints)
eas build --platform android --profile preview
Offline: the vehicle registry is cached on-device and refreshes automatically while online, retrying every 20s.
Checks made offline queue up, show a manual "Sync now" button, and auto-sync as soon as a connection returns.

## Sample data for a pitch
cd backend
npm run seed-demo   -> 60 sample vehicles + 1,600 checks over 14 days
npm run simulate    -> sends a live scan every few seconds
npm run clear-demo  -> removes all sample data before real use
