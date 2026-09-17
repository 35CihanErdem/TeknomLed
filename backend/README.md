# TeknomLed Backend

ASP.NET Core 8 Web API — identity & authentication foundation (Phase 7).

## Structure

```
backend/
  TeknomLed.sln
  src/
    TeknomLed.Api/
    TeknomLed.Application/
    TeknomLed.Domain/
    TeknomLed.Infrastructure/
  tests/
    TeknomLed.Tests/
```

## Prerequisites

- .NET 8 SDK
- PostgreSQL

## Configuration

Set via `appsettings.Development.json`, user-secrets, or environment variables:

| Key | Purpose |
|-----|---------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL |
| `Jwt__Issuer` | Access token issuer |
| `Jwt__Audience` | Access token audience |
| `Jwt__SigningKey` | HMAC key (min 32 chars) |
| `Jwt__AccessTokenMinutes` | Short-lived access JWT (default 15) |
| `Jwt__RefreshTokenDays` | Refresh session lifetime |
| `Google__ClientId` | Google Web Client ID (audience) |
| `Cors__AllowedOrigins__0` | Allowed SPA origin |

**Do not commit production secrets.**

## Session architecture

1. Short-lived **JWT access token** returned in JSON body (Angular keeps it in memory only).
2. **Refresh token** stored as **HttpOnly cookie** (`teknomled_refresh`, path `/api/auth`).
3. Server stores only **SHA-256 hash** of refresh tokens in `RefreshSessions`.
4. Refresh rotates sessions; logout revokes the current session.
5. Google ID token proves identity; TeknomLed issues its own session afterward.

Frontend permission checks are UX only. **Backend authorization is authoritative.**

## Run

```bash
# from backend/
dotnet ef database update --project src/TeknomLed.Infrastructure --startup-project src/TeknomLed.Api
dotnet run --project src/TeknomLed.Api --launch-profile http
```

API default (http profile): `http://localhost:5223`  
Swagger (Development): `/swagger`

Angular storefront proxies `/api` → `http://localhost:5223` in development.

## Auth endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/google` | Public |
| POST | `/api/auth/refresh` | Cookie |
| POST | `/api/auth/logout` | Cookie |
| GET | `/api/auth/me` | Bearer |
| PUT | `/api/auth/profile` | Bearer |

## Tests

```bash
dotnet test
```

## Account linking note

If a password account already exists for the **verified** Google email and has no Google `ExternalLogin`, the first Google sign-in attaches `ProviderSubject` to that user. Linking only happens after Google credential verification.
