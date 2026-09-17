# Google Sign-In Setup (TeknomLed)

Google Identity Services requires a real **OAuth 2.0 Web Client ID**.
Cursor cannot invent one. Complete these steps manually.

## 1. Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project for TeknomLed.

## 2. OAuth consent

1. Configure the OAuth consent screen / branding as required by Google.
2. Add any test users needed while the app is in testing mode.

## 3. Create Web client

1. APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Application type: **Web application**.
3. Name example: `TeknomLed Storefront`.

## 4. Authorized JavaScript origins

Add local development origins, for example:

- `http://localhost:4200`

Later add production:

- `https://your-storefront-domain.com`

## 5. Copy Client ID

Copy the **Client ID** (ends with `.apps.googleusercontent.com`).

You do **not** need a Client Secret for the GIS ID-token / credential button flow used here.

## 6. Configure TeknomLed

### Angular (`storefront`)

`src/environments/environment.development.ts`

```ts
googleClientId: 'YOUR_REAL_CLIENT_ID.apps.googleusercontent.com'
```

`src/environments/environment.ts` (production)

```ts
googleClientId: 'YOUR_REAL_CLIENT_ID.apps.googleusercontent.com'
```

### Backend (`backend`)

`Google__ClientId` / `appsettings.*.json`:

```json
"Google": {
  "ClientId": "YOUR_REAL_CLIENT_ID.apps.googleusercontent.com"
}
```

Backend and frontend **must** use the same Web Client ID.
ASP.NET validates Google credentials with `Google.Apis.Auth` against this audience.

## 7. Verify

1. Start API + Angular.
2. Open Login / Register.
3. Click **Google ile devam et**.
4. Successful Google credential → `POST /api/auth/google` → TeknomLed session.
5. If phone is missing → `/account/complete-profile`.

## Security reminders

- Do not trust email/name from the frontend.
- Only trust claims after backend Google token verification.
- Identify Google accounts by `ProviderSubject`, not email alone.
