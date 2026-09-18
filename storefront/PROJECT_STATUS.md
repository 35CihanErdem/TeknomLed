# TeknomLed Storefront — Project Status

## Phase 1 — Storefront Foundation
Status: Complete

## Phase 2 — Premium Home Page
Status: Complete

## Phase 3 — Products Catalog
Status: Complete

## Phase 3.1 — Product Catalog Visual Correction
Status: Complete

## Phase 4 — Product Detail Experience
Status: Complete

## Phase 5 — Cart Experience
Status: Complete

## Phase 6 — Checkout Foundation
Status: Complete

## Phase 7 — Backend Foundation + Authentication
Status: Complete

### Google Sign-In (local)
- GIS ID-token flow wired end-to-end (no Client Secret / no OAuth redirect code flow)
- Angular `googleClientId` in `environment.development.ts` / `environment.ts`
- Backend audience: `Google:ClientId` in `appsettings.Development.json` / `appsettings.json`
- Same Web Client ID on both sides; Authorized JS origin: `http://localhost:4200`
- Backend validates signature/audience/issuer/expiry via `Google.Apis.Auth`
- External identity: `ExternalLogin(Provider=GOOGLE, ProviderSubject=sub)`
- New Google users → CUSTOMER; missing phone → `profileComplete=false` → `/account/complete-profile`

## Phase 8 — Production Catalog Backend + Media Foundation
Status: Complete

Current Phase: PHASE 8 — PRODUCTION CATALOG BACKEND + MEDIA FOUNDATION

### Migration
- `20260917195403_CatalogFoundation` (after `InitialIdentity`)

### Database entities
- Category, Product, ProductVariant, ApplicationArea
- ProductApplicationArea, ProductSpecification, ProductMedia
- Money: `ProductVariant.Price` as `decimal(18,2)` — never float
- **IsActive on Product** = public visibility (draft/hidden vs published). No separate CMS workflow.
- Media stores **path/URL + metadata only** — no binaries/base64 in PostgreSQL

### Public API
| Method | Path |
|--------|------|
| GET | `/api/products` (paginated + filters) |
| GET | `/api/products/{slug}` |
| GET | `/api/products/{slug}/related` |
| POST | `/api/products/batch` |
| GET | `/api/categories` |
| GET | `/api/application-areas` |

Filters (PostgreSQL): category, applicationArea[], kelvin[], powerRanges[], ip[], priceRanges[], min/maxPrice, featured, sort, page, pageSize (max 48).

### Admin API foundation (no Admin UI)
| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/admin/products` | PRODUCT_CREATE |
| PUT | `/api/admin/products/{id}` | PRODUCT_UPDATE |
| DELETE | `/api/admin/products/{id}` | PRODUCT_UPDATE (soft deactivate) |
| POST | `/api/admin/categories` | PRODUCT_CREATE |
| PUT | `/api/admin/categories/{id}` | PRODUCT_UPDATE |

JWT now includes `permission` claims so `[RequirePermission]` works.

### Angular
- `ProductCatalogService` — centralized HttpClient catalog access + product cache
- Migrated: `/products`, `/products/:slug`, Home featured, related products, Cart resolve
- Cart still stores `{ productId, variantId, quantity }` in localStorage; display data resolved async from API
- Stale/missing/inactive product or variant lines are pruned after hydration (no crash)

### Media strategy
- `IMediaPathResolver` boundary (current: passthrough local/asset paths)
- Future: S3 / Cloudflare R2 / CDN without changing Product domain
- LIGHT_ON/OFF comparison still requires genuine pair under official `/assets/images/products/.../light-off|on.*` paths; otherwise reserved placeholder (no CSS fake OFF)

### Dev seed
- 12 development products adapted from former Angular mocks
- **NOT** official customer catalog
- Reuses existing `/assets/images/home/...` paths only

### Price / stock rule
- Storefront displays backend values only
- Orders (future) must re-resolve product, variant, price, stock on the server
- Frontend never decides payment success

### Still pending / deferred
- Admin UI (Phase 9)
- Object storage upload pipeline
- Official customer catalogue & final photography
- Orders / Payment / Shipping
- Admin / Worker UI (beyond API foundation)
- WhatsApp
- Cart sync / merge after login
- Server-side cart

### Build / test (Phase 8)
- `dotnet build` — pass
- `dotnet test` — 20 tests pass
- `npm run build` (storefront) — pass (verify after docs)

### Manual setup
1. PostgreSQL running with configured `DefaultConnection`
2. Start API (`dotnet run --project src/TeknomLed.Api --launch-profile http`) — migrates + seeds catalog
3. Start storefront (`npm start`) — proxy `/api` → `:5223`
4. Google login: open `/account/login` — GIS button uses configured Web Client ID (see `GOOGLE_AUTH_SETUP.md`)

See also: `GOOGLE_AUTH_SETUP.md`, `backend/README.md`
