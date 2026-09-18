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

Current Phase: PHASE 9A — ADMIN FOUNDATION

### Admin routes (lazy)
- `/admin` — dashboard (permission-gated sections)
- `/admin/catalog/products` | `.../new` | `.../:id`
- `/admin/catalog/categories`
- `/admin/catalog/application-areas`
- `/admin/users`
- `/admin/access/roles` | `/admin/access/permissions`
- `/admin/access-denied`

### Permission strategy (UX only; API authoritative)
- `AuthService.can` / `canAny` / `canAll`
- `permissionGuard` / `anyPermissionGuard` / `adminAreaGuard`
- Sidebar + dashboard sections filtered by permissions
- Unauthenticated → `/account/login`
- Authenticated without permission → `/admin/access-denied`

### Phase 9A UI scope
- Real admin shell (sidebar / header / content)
- No fake KPIs, charts, users, orders, or activity
- Catalog/Users/Access pages are intentional placeholders until 9B/9D

### Backend gaps → Phase 9B (catalog CRUD UI)
Existing admin catalog API:
- `POST/PUT/DELETE /api/admin/products` (create/update/deactivate)
- `POST/PUT /api/admin/categories`
Missing for full admin catalog UI:
- Admin product list / get-by-id (incl. inactive/drafts)
- Admin category list (incl. inactive)
- Application-area admin create/update/deactivate
- Standalone variant / specification / media admin endpoints (today only nested in product create/update payload)
- Optional: category soft-deactivate endpoint

### Backend gaps → Phase 9D (users / access)
Existing:
- Auth: register/login/google/refresh/logout/me/profile
- Roles/permissions seeded in DB; JWT includes permission claims
Missing:
- User list / user detail
- Assign/remove roles on a user
- Role list / permission list
- Role↔permission management APIs

### Still deferred
- Phase 9B catalog CRUD screens
- Phase 9D user/access APIs + UI
- Orders / Payment / Shipping
- Object storage upload
- WhatsApp / cart merge / server-side cart

### Build / test (Phase 9A)
- `npm run build` — pass
- `dotnet test` — 20 tests pass

See also: `GOOGLE_AUTH_SETUP.md`, `backend/README.md`
