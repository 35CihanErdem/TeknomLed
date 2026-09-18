# TeknomLed Backend

ASP.NET Core 8 Web API — identity (Phase 7) + product catalog (Phase 8).

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
| `Media__Provider` | Storage provider (`Local`) |
| `Media__LocalRoot` | Local disk root (relative to content root) |
| `Media__PublicBasePath` | Public URL prefix (`/media`) |
| `Media__MaxImageBytes` | Max upload size (default 5 MB) |

**Do not commit production secrets.**

## Session architecture

1. Short-lived **JWT access token** returned in JSON body (Angular keeps it in memory only).
2. **Refresh token** stored as **HttpOnly cookie** (`teknomled_refresh`, path `/api/auth`).
3. Server stores only **SHA-256 hash** of refresh tokens in `RefreshSessions`.
4. Refresh rotates sessions; logout revokes the current session.
5. Google ID token proves identity; TeknomLed issues its own session afterward.
6. Access JWT includes **role** and **permission** claims for `[RequirePermission]`.

Frontend permission checks are UX only. **Backend authorization is authoritative.**

## Run

```bash
# from backend/
dotnet ef database update --project src/TeknomLed.Infrastructure --startup-project src/TeknomLed.Api
dotnet run --project src/TeknomLed.Api --launch-profile http
```

On startup the API applies migrations, seeds identity roles/permissions, then seeds **development catalog** products (idempotent).

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

## Catalog endpoints (Phase 8)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/products` | Public (paginated) |
| GET | `/api/products/{slug}` | Public |
| GET | `/api/products/{slug}/related` | Public |
| POST | `/api/products/batch` | Public (cart hydrate) |
| GET | `/api/categories` | Public |
| GET | `/api/application-areas` | Public |
| POST/PUT/DELETE | `/api/admin/products…` | PRODUCT_CREATE / PRODUCT_UPDATE |
| POST/PUT | `/api/admin/categories…` | PRODUCT_CREATE / PRODUCT_UPDATE |
| GET | `/api/admin/products` / `{id}` | PRODUCT_VIEW |
| GET/POST/PUT | `/api/admin/application-areas…` | PRODUCT_* |
| POST/PUT/DELETE | `/api/admin/products/{id}/media…` | PRODUCT_UPDATE |

**Semantics:** `Product.IsActive = false` means not publicly listed (draft/hidden). Soft-deactivate preferred over hard delete.

**Media (Phase 9C):**
- PostgreSQL stores `ProductMedia` metadata/path only (never binaries / Base64).
- `IMediaStorage` + `LocalMediaStorage` write files under `Media:LocalRoot` (default `App_Data/media`).
- Public URLs via `IMediaPathResolver` → `/media/...` (static files; no directory browsing).
- Allowed uploads: JPEG, PNG, WebP; max size `Media:MaxImageBytes` (default 5 MB).
- Angular proxies `/api` and `/media` to the API in development.
- Future S3-compatible provider plugs into `IMediaStorage` / resolver without changing catalog entities.

**Seeded products are DEV/TEST data**, not the official customer catalogue.

**Price/stock** returned by the API are for display; order acceptance must re-resolve them server-side (Orders phase).

## Migrations

1. `InitialIdentity`
2. `CatalogFoundation`

(Phase 9C: no new migration — existing `ProductMedia` schema reused.)

## Tests

```bash
dotnet test
```

## Notes

- Guest browse / guest cart / guest checkout remain supported.
- Phone profile completion flow from Phase 7 is unchanged.
- Orders, Payments, Shipping, WhatsApp are not implemented here.
- Production object storage (S3/R2) is deferred; local disk is the Phase 9C provider.