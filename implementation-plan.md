# Admin Panel Plan

## Goal

Build `restroadmin` as the restaurant staff and manager application. It manages table-to-QR mapping, menu/catalog data, customer and order catalogs, delivery operations, restaurant settings, and period-based reports. All operational views update live over Socket.IO, with REST snapshots for first load and recovery.

## Roles

- **Manager/admin:** full restaurant configuration, menu, tables/QR, staff, customers, reports, discounts/refunds/overrides, and audit history.
- **Waiter/floor staff:** table map, dine-in orders, waiter requests, served status, and bill collection/confirmation.
- **Kitchen staff:** station queues, order item preparation/ready controls, and prep-time visibility.
- **Delivery staff (optional role):** assigned deliveries and delivery status transitions only.

Enforce roles in the API. The UI hides unavailable actions but is not the security boundary.

## Main navigation and screens

1. **Login:** mobile/PIN or staff credentials, short-lived token handling, restaurant selection only for accounts authorized for multiple locations.
2. **Dashboard:** date-period selector (today, 7 days, month, custom), revenue/orders/AOV, dine-in vs delivery, delivery completion, popular items, chart trends, recent orders, open table requests, and kitchen/delivery alerts.
3. **Live orders:** filter by status, channel, station, and time; detailed order drawer; item notes/options; permitted status transitions; cancel with a reason.
4. **Kitchen display:** station queues (Tandoor/Curry/Drinks or configured stations), new/preparing/ready lanes, elapsed time colors, sound/visual alert, acknowledge and ready actions.
5. **Floor/table map:** live FREE/OCCUPIED/NEEDS_HELP/BILL_REQUESTED/CLEANING state; table detail with session, orders, requests, balance, seats, and floor position.
6. **Tables & QR:** create/edit/disable tables, assign QR tokens manually, bind each token to one table, preview/download/print QR labels, rotate compromised QR, record mapping changes.
7. **Menu and food catalog:** categories, dishes, images, veg/non-veg and spicy labels, size/spice/add-on options, price, prep time, stock/availability, and kitchen station.
8. **Customers catalog:** search mobile/name, order history, spend/frequency, loyalty balance when enabled, notes and account status. Restrict personal data to authorized staff.
9. **Delivery operations:** delivery orders, address/coverage, delivery fee, assignment, promised window, status timeline, failed-delivery notes, and contact shortcuts.
10. **Billing/payments:** bill review and split, demo payment labels/status, cash confirmation, refunds/voids only when supported, and complete audit trail.
11. **Reports:** date-filtered charts and tables for sales, order channels, menu performance, delivery, table turnover, prep time, payment method, and customer repeat rate.
12. **Settings/staff:** restaurant data, tax/service charge, delivery zones/fees, operating status, stations, staff roles, and credential reset.

## Realtime behavior

Open a staff-authenticated socket and join only rooms for the staff member's restaurant and permitted station/role. Handle order placed/updated, item status, waiter call/resolution, table change, payment update, delivery assignment/status, and low-rating events. Use event IDs or entity versions to deduplicate and recover from reconnects through REST.

## Build order

1. Auth shell, role-aware routes, shared API client, socket lifecycle, and shared table/order/status components.
2. Live orders and kitchen station display.
3. Table map, waiter requests, and table detail.
4. Table management and QR creation/mapping.
5. Menu/category/options/station catalog.
6. Customer catalog and delivery operations.
7. Dashboard and date-filtered statistics/recent orders.
8. Dummy payment/bill screens and settings/staff management.
9. Responsive/tablet usability, accessibility, empty/error/reconnect states, exports, and audit views.

## Acceptance criteria

- Admin can manually map, disable, and rotate a distinct QR for each table and verify the resulting table identity.
- Staff sees new orders, kitchen changes, waiter calls, table states, and delivery progress live without refreshing.
- Charts and recent-order lists reflect the selected date range and use server-derived totals.
- Menu, customer, order, and delivery catalogs support search/filter/detail and permission-appropriate actions.
- Demo payment is clearly labeled; manager-only operations are audited and blocked for other roles.
- A socket reconnect restores the same current view without duplicated orders or losing updates.
