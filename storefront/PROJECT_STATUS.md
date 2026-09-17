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

Current Phase: PHASE 7 — BACKEND FOUNDATION + AUTHENTICATION

### Backend
- ASP.NET Core Web API (.NET 8)
- PostgreSQL + EF Core
- Projects: Api / Application / Domain / Infrastructure

### Authentication
- Email/password registration & login
- Google Identity Services (credential verified server-side)
- External identity: `ExternalLogin(Provider, ProviderSubject)` — not email alone
- Guest cart & guest checkout remain supported

### Authorization
- Roles: CUSTOMER, WORKER, MANAGER, ADMIN, SUPER_ADMIN
- Permissions foundation + RolePermission mappings (CUSTOMER has no staff permissions)
- Public registration always assigns CUSTOMER only
- Frontend permission checks are UX only; backend is authoritative

### Sessions
- Short-lived JWT access token (memory on Angular; Bearer header)
- Refresh token in HttpOnly cookie (`teknomled_refresh`), server stores hash only
- Refresh rotates sessions; logout revokes session
- Google credential is never the app session

### Profile
- Google users without phone: authenticated + `profileComplete = false`
- `/account/complete-profile` + `PUT /api/auth/profile`

### Architecture notes
- Frontend cart/checkout prices are display values only; backend will be the
  source of truth during order creation.
- Frontend will NEVER decide that an order is paid.

### Still pending
- Products API (catalogue remains mock)
- Orders
- Payment
- Shipping
- Admin / Worker UI
- WhatsApp
- Cart sync / merge after login

Official customer product catalogue and final photography remain pending.

See also: `GOOGLE_AUTH_SETUP.md`, `backend/README.md`
