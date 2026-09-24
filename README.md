# SecurRoute — MERN + Expo
## Backend (Render)
cd backend && npm i && cp .env.example .env
Fill MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, then: npm run create-admin && npm start
Render: root dir `backend`, build `npm i`, start `npm start`, add the same env vars.
Sign in to the web portal with your admin, then add agents (Agents page) and vehicles (Registry page).
## Pitch data (so the dashboard is never empty)
npm run seed-demo   → 60 sample vehicles + 1,600 checks over 14 days (no accounts created)
npm run simulate    → live scans every few seconds; watch the portal's live feed + red alerts
npm run clear-demo  → removes all sample data before real use
## Web
cd web && npm i && cp .env.example .env (set VITE_API_URL) && npm run dev
## Mobile (OCR needs a development build, not Expo Go)
cd mobile && npm i && edit config.js (API URL, checkpoints)
npx eas build --profile development --platform android, install the APK, then npx expo start --dev-client
