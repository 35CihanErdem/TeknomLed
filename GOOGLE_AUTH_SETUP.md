# Google Sign-In Setup (TeknomLed)

Google Identity Services uses an **OAuth 2.0 Web Client ID** (no Client Secret).

## Local status

Configured for local development:

- Authorized JavaScript origin: `http://localhost:4200`
- Angular: `environment.development.ts` → `googleClientId`
- Backend: `Google:ClientId` in `appsettings.Development.json` / `appsettings.json`
- Frontend and backend **must** use the same Web Client ID (audience)

## Google Cloud checklist

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. OAuth consent screen configured; add test users while in Testing mode.
3. Credentials → OAuth client ID → **Web application**.
4. Authorized JavaScript origins include:
   - `http://localhost:4200`
   - production storefront origin when ready
5. Copy the **Client ID** (`.apps.googleusercontent.com`).
6. Do **not** put a Client Secret in this project — GIS ID-token button flow does not use it.

## Verify locally

1. Start API: `dotnet run --project src/TeknomLed.Api --launch-profile http` → `http://localhost:5223`
2. Start storefront: `npm start` → `http://localhost:4200` (proxy `/api` → `:5223`)
3. Open Login / Register → Google button
4. GIS credential → `POST /api/auth/google` → JWT + refresh cookie
5. Missing phone → `/account/complete-profile`

## Security reminders

- Do not trust email/name from the frontend.
- Only trust claims after backend Google token verification (`Google.Apis.Auth`).
- Identify Google accounts by `ProviderSubject` (`sub`), not email alone.
- Client Secret must never appear in frontend, source, or logs for this flow.
