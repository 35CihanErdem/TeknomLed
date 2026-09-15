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

Current Phase: PHASE 6 — CHECKOUT FOUNDATION

Implemented:
- Guest checkout on `/checkout` (no auth required)
- Angular Reactive Forms: contact, shipping address, invoice, shipment, payment
- Turkish-friendly required phone + required email
- Invoice: same-as-shipping toggle, bireysel / kurumsal fields, optional separate address
- Shipping placeholder (fee calculated later — not invented)
- Payment integration-ready placeholder (no card fields, no fake payment)
- Order summary derives live from CartService; total = subtotal
- Checkout draft persistence: `teknomled.storefront.checkout.v1` (debounced)
- Valid submit validates only and shows integration message — no order creation, cart unchanged
- Empty cart → intentional empty checkout state → `/products`

Architecture notes:
- Frontend cart/checkout prices are display values only; backend will be the
  source of truth during order creation.
- Frontend will NEVER decide that an order is paid. Future: Angular → ASP.NET Core
  → payment provider → webhook verification → PAID.
- Future order lifecycle (not implemented): PENDING → PAYMENT_PENDING → PAID →
  PREPARING → IN_PRODUCTION → READY_TO_SHIP → SHIPPED → DELIVERED
  (exceptional: CANCELLED, REFUNDED)

Official customer product catalogue and final photography are still pending.

## Phase 7+
Not started
