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
- Angular `googleClientId` + backend `Google:ClientId` (same Web Client ID)
- External identity: `ExternalLogin(Provider=GOOGLE, ProviderSubject=sub)`
- Missing phone → `profileComplete=false` → `/account/complete-profile`

## Phase 8 — Production Catalog Backend + Media Foundation
Status: Complete

### Runtime verified
- PostgreSQL connection (UTF8 DB)
- EF migrations (`InitialIdentity`, `CatalogFoundation`)
- CatalogSeed (12 DEV products)
- `GET /api/products` (+ filters/pagination)
- Angular → API via `/api` proxy → `http://localhost:5223`
- Google authentication end-to-end

### Notes
- Seeded products are DEV/TEST data, not official customer catalogue
- Media: path/URL metadata only (no binaries in PostgreSQL)
- Price/stock on storefront are display-only; Orders must re-resolve server-side

## Phase 9A — Admin Panel Foundation + Access Control
Status: Complete

### Admin shell
- `/admin` dashboard, sidebar, permission-gated nav
- `permissionGuard` / `adminAreaGuard` / access-denied
- Users / Access pages remain placeholders until Phase 9D

## Phase 9B — Catalog Management
Status: Complete

Current Phase: PHASE 9B — CATALOG MANAGEMENT

### Admin API endpoints
| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/admin/products` | `PRODUCT_VIEW` |
| GET | `/api/admin/products/{id}` | `PRODUCT_VIEW` |
| POST | `/api/admin/products` | `PRODUCT_CREATE` |
| PUT | `/api/admin/products/{id}` | `PRODUCT_UPDATE` |
| DELETE | `/api/admin/products/{id}` | `PRODUCT_UPDATE` (soft deactivate) |
| GET | `/api/admin/categories` | `PRODUCT_VIEW` |
| POST | `/api/admin/categories` | `PRODUCT_CREATE` |
| PUT | `/api/admin/categories/{id}` | `PRODUCT_UPDATE` |
| GET | `/api/admin/application-areas` | `PRODUCT_VIEW` |
| POST | `/api/admin/application-areas` | `PRODUCT_CREATE` |
| PUT | `/api/admin/application-areas/{id}` | `PRODUCT_UPDATE` |

Admin product list supports server-side `search`, `category`, `isActive`, `sort`, `page`, `pageSize`. Drafts/inactive are included.

### Admin screens
- `/admin/catalog/products` — real list (search/filter/pagination)
- `/admin/catalog/products/new` | `/:id` — reactive product editor (variants, specs, application areas)
- `/admin/catalog/categories` — list/create/edit/active
- `/admin/catalog/application-areas` — list/create/edit/active
- Unsaved-changes guard on product editor

### Publication behavior
- `Product.IsActive = true` → visible on public `GET /api/products`, detail, related
- `Product.IsActive = false` → admin-only; excluded from public catalog APIs
- No second publication model

### Validation / integrity (backend authoritative)
- Unique product / category / application-area slugs (409)
- Unique SKU (409)
- Invalid category / application-area IDs rejected
- Price ≥ 0, stock ≥ 0; at least one variant
- Category cannot be deactivated while active products reference it (409)
- Application areas unique by slug or name

### Permissions
- Angular checks = UX only
- ASP.NET `RequirePermission` = authoritative

### Media boundary (Phase 9C)
See Phase 9C below.

### Angular architecture
- `AdminCatalogService` + admin DTOs (separate from public `ProductCatalogService`)

### Tests
- `AdminCatalogServiceTests`: inactive visibility, create, duplicate slug, invalid category, variant validation, application-area persistence, update/activate, deactivate, category/area rules
- Existing `CatalogServiceTests` retained

## Phase 9C — Product Media Upload + Storage Abstraction
Status: Complete

Current Phase: PHASE 9C — MEDIA UPLOAD

### Storage abstraction
- `IMediaStorage` → `LocalMediaStorage` (dev)
- Future: S3-compatible adapter without changing catalog/domain
- `IMediaPathResolver` → `ConfiguredMediaPathResolver` (`/media/...` + legacy `/assets/...`)

### Configuration (`Media` section)
- `Provider`: Local
- `LocalRoot`: `App_Data/media` (relative to API content root; not machine-specific)
- `PublicBasePath`: `/media`
- `MaxImageBytes`: 5242880 (5 MB)

### Admin media endpoints
| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/admin/products/{id}/media` | PRODUCT_UPDATE (multipart) |
| PUT | `/api/admin/products/{id}/media/{mediaId}` | PRODUCT_UPDATE |
| DELETE | `/api/admin/products/{id}/media/{mediaId}` | PRODUCT_UPDATE |

### Validation
- JPEG / PNG / WebP only (extension + MIME + magic bytes)
- Empty / oversized rejected
- Path traversal blocked; unique generated filenames
- No Base64 / no binaries in PostgreSQL

### Public delivery
- Files served at `http://localhost:5223/media/...`
- Angular proxy forwards `/media` → API
- ProductMedia.Path stores storage-relative key; DTOs expose resolved URL

### Admin editor
- Create product first → then upload
- Type / alt / sort / thumbnail / delete
- LIGHT_ON + LIGHT_OFF are distinct assets (no CSS fake OFF)

### Storefront
- DEFAULT → card primary; GALLERY → detail gallery
- LightComparison unlocks only for genuine distinct LIGHT_OFF + LIGHT_ON pairs (`/media/products/...` or official `/assets/images/products/.../light-*.{ext}`)

### Tests
- `AdminProductMediaServiceTests` (temp storage directory)

### Still deferred
- S3/R2 object storage adapter
- Phase 9D user/access APIs + UI
- DOCUMENT/VIDEO upload
- Orders / Payment / Shipping
- WhatsApp / cart merge / server-side cart

### Build / test (Phase 9C)
- `npm run build` — pass
- `dotnet test` — 38 tests pass

See also: `GOOGLE_AUTH_SETUP.md`, `backend/README.md`
