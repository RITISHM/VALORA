# API Integration & Mock Data Audit

## 1. Executive Summary

This repository contains a full-stack ERP application (Valora) divided into a React/Vite frontend (`client`) and an Express/Node.js backend (`server`). The core structure for API integrations exists via a centralized `api/index.js` file and backend routes. However, significant portions of the application—especially critical dashboards, ID generation, and payment processing—rely on mock data, static UI, client-side random generation, or `localStorage` fallbacks. 

The most critical blocker is the complete absence of the Razorpay SDK in the frontend, despite the backend having the necessary infrastructure (`razorpay` package installed and endpoints configured). The payment flow in the UI is currently simulated using `setTimeout`. Additionally, the administrative dashboards contain completely hardcoded metrics and transactions, while order and invoice numbers rely on insecure frontend `Math.random()` generation.

## 2. Repository Areas Reviewed

The following major repository areas were exhaustively inspected:
- **Client Root:** `client/src`
- **API Layer:** `client/src/api/index.js`, `client/src/api/mockData.js`
- **Pages (UI/Consumer):** `client/src/pages/*` (including `Dashboard.jsx`, `Notifications.jsx`, `portal/*`, `sales/*`, `purchase/*`, `masters/*`)
- **State Management:** `client/src/store/*` (Zustand)
- **Backend Routes:** `server/src/routes/*` (Sales, Purchases, Portal, Auth, etc.)
- **Configuration & Env:** `.env` files for both frontend and backend.
- **Dependencies:** `client/package.json` and `server/package.json`

## 3. Mock / Dummy / Static Data Inventory

| # | File | Line/Location | Data | Classification | Consumer | Replacement | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `client/src/pages/Dashboard.jsx` | 154-207 | Vendor Bills, Customer Invoices, Journal Entries | SIMULATED / STATIC UI | AdminDashboard | Real API for Recent Transactions | P1 |
| 2 | `client/src/pages/Dashboard.jsx` | 213-229 | Calendar events and active days | STATIC UI | AdminDashboard | Real API for Events/Tasks | P3 |
| 3 | `client/src/pages/Dashboard.jsx` | 233-264 | Schedule / Upcoming Vendor Payments | STATIC UI | AdminDashboard | Real API for Scheduled Tasks | P2 |
| 4 | `client/src/pages/Dashboard.jsx` | 268-288 | Cash Flow Chart & ₹ 1.2M Total | STATIC UI | AdminDashboard | Real Analytics API | P1 |
| 5 | `client/src/pages/Dashboard.jsx` | 842-897 | Operating Cash, Net Income, Pending Approvals | STATIC UI | AccountantDashboard | Real Financial Analytics API | P1 |
| 6 | `client/src/pages/Dashboard.jsx` | 902-935 | Recent Activity Audit Log | STATIC UI | AccountantDashboard | Real Audit/Activity API | P2 |
| 7 | `client/src/pages/portal/CustomerMarketplace.jsx` | 32-37 | Fallback Ergonomic Chair, Standing Desk array | MOCKED | CustomerMarketplace UI | Must ensure `/products` API succeeds | P2 |
| 8 | `client/src/pages/sales/SalesOrders.jsx` | 22, 155 | `orderNumber: SO${Math.random()}` | SIMULATED | SalesOrder Form | Backend DB Sequence Generation | P0 |
| 9 | `client/src/pages/sales/CustomerInvoices.jsx` | 31, 153 | `invoiceNumber: INV/2026/${Math.random()}` | SIMULATED | CustomerInvoice Form | Backend DB Sequence Generation | P0 |
| 10 | `client/src/pages/purchase/VendorBills.jsx` | 32, 164 | `billNumber: Bill/2026/${Math.random()}` | SIMULATED | VendorBill Form | Backend DB Sequence Generation | P0 |
| 11 | `client/src/pages/purchase/PurchaseOrders.jsx` | 23, 157, 187| `orderNumber: PO${Math.random()}` | SIMULATED | PurchaseOrder Form | Backend DB Sequence Generation | P0 |
| 12 | `client/src/pages/portal/InvoiceDetail.jsx` | 34-55 | `setTimeout` payment simulation | SIMULATED | Payment Modal | Razorpay SDK Integration | P0 |
| 13 | `client/src/pages/portal/CartCheckout.jsx` | 40-42 | `setTimeout` to navigate after fake checkout | SIMULATED | Checkout Page | Razorpay Checkout SDK Flow | P0 |
| 14 | `client/src/pages/Dashboard.jsx` | 369-376 | `localStorage` fallback for Outstanding/Invoices | SIMULATED PERSISTENCE | UserDashboard | Reliable API Error Handling | P2 |
| 15 | `client/src/pages/Notifications.jsx` | 27-41 | Alert notifications (Bill Due, Budget, System) | STATIC UI | Notifications Page | Real-time Notification API | P2 |

## 4. Existing API Integrations

| API/Service | Purpose | Files | Endpoint/SDK | Status | Authentication | Credential | Notes |
|---|---|---|---|---|---|---|---|
| Valora Backend API | CRUD Operations (Users, Contacts, Products, Accounts, Invoices, etc.) | `client/src/api/index.js` | REST (e.g. `/products`, `/contacts`) | WORKING / CONFIGURED | Bearer JWT Token | `VITE_BACKEND_URL` | Appears fully implemented on backend. |
| Auth API | Registration & Login | `login.jsx`, `signup.jsx`, `AdminCreateUser.jsx` | REST (`/auth/login`, `/auth/signup`) | WORKING / CONFIGURED | None required to login | `VITE_BACKEND_URL` | Issues JWT Token on success. |
| Portal API | Invoices, Outstanding & Checkout | `Dashboard.jsx`, `InvoiceDetail.jsx`, `CartCheckout.jsx` | REST (`/portal/invoices`, `/portal/outstanding`) | INTEGRATED BUT POTENTIALLY BROKEN | Bearer JWT Token | `VITE_BACKEND_URL` | Has heavy offline/cache fallbacks masking instability. |
| Razorpay (Backend) | Order Generation | `portal.routes.js`, `portal.service.js` | SDK (`razorpay` package) | INTEGRATED BUT MISSING CREDENTIALS | Native SDK Auth | `RAZORPAY_KEY_ID`, `SECRET` | Keys not present in `.env`. |

## 5. APIs Still Required

| API/Service | Purpose | Feature | Existing? | Integration Needed | Credential | Backend Work | Frontend Work | Priority |
|---|---|---|---|---|---|---|---|---|
| Razorpay Checkout (Frontend) | Process Payments | Invoice Payment / Cart Checkout | No | SDK Integration (`window.Razorpay`) | Publishable Key | None | Implement Razorpay JS SDK script and handler | P0 |
| Dashboard Analytics | Fetch Admin/Accountant stats | Admin/Accountant Dashboard | UNKNOWN — REQUIRES VERIFICATION | Create endpoints for UI cards | None | Create `/analytics/dashboard` endpoint | Connect UI to fetch | P1 |
| Sequence Generator | Generate SO/INV/PO IDs | Sales/Purchase Forms | UNKNOWN — REQUIRES VERIFICATION | Update POST endpoints to auto-generate IDs | None | Remove required ID fields, generate in DB | Remove `Math.random` from UI | P0 |
| Notifications / Alerts | Real-time system updates | Notifications Page | No | WebSocket or Polling endpoint | None | Create `/notifications` | Connect UI to fetch/subscribe | P3 |
| Recent Activity Audit | Show user actions log | AccountantDashboard | UNKNOWN — REQUIRES VERIFICATION | Fetch logs | None | Create `/audit-logs` endpoint | Connect UI to fetch | P2 |

## 6. API Keys & Credentials Required

| Service | Credential | Environment Variable | Present? | Used Where | Client/Server | Action | Priority |
|---|---|---|---|---|---|---|---|
| Razorpay | API Key ID | `RAZORPAY_KEY_ID` | No | `server/src/services/portal.service.js` | Server | Obtain from Razorpay Dashboard and add to backend `.env` | P0 |
| Razorpay | API Secret | `RAZORPAY_KEY_SECRET` | No | `server/src/services/portal.service.js` | Server | Obtain from Razorpay Dashboard and add to backend `.env` | P0 |
| Razorpay | Publishable Key | `VITE_RAZORPAY_KEY_ID` | No | `client` | Client | Expose public key to Vite for frontend Checkout flow | P0 |
| Supabase | Database URL | `DATABASE_URL` | Yes | `server/.env` | Server | Configured. Change password before production! | P2 |
| Supabase | Direct URL | `DIRECT_URL` | Yes | `server/.env` | Server | Configured. | P2 |
| JWTAuth | JWT Secret | `JWT_SECRET` | Yes (Hardcoded generic) | `server/.env` | Server | Change to a strong random string | P1 |

## 7. Environment Variables Audit

| Variable | Used Where | Defined Where | Required | Sensitive | Client/Server | Status |
|---|---|---|---|---|---|---|
| `VITE_BACKEND_URL` | `api/index.js`, `login.jsx`, `signup.jsx` | `client/.env` | Yes | No | Client | Defined correctly. |
| `PORT` | `server/src/server.js` | `server/.env` | Yes | No | Server | Defined. |
| `DATABASE_URL` | Prisma Schema | `server/.env` | Yes | Yes | Server | Defined. |
| `DIRECT_URL` | Prisma Schema | `server/.env` | Yes | Yes | Server | Defined. |
| `JWT_SECRET` | Auth Middleware/Service | `server/.env` | Yes | Yes | Server | Defined, but uses weak placeholder. |
| `RAZORPAY_KEY_ID` | `portal.service.js` | Expected | Yes | Partially | Server | Missing. |
| `RAZORPAY_KEY_SECRET`| `portal.service.js` | Expected | Yes | Yes | Server | Missing. |

## 8. Backend Requirements

1. **Auto-Sequencing for Documents:** Ensure that `/sales-orders`, `/purchase-orders`, `/customer-invoices`, and `/vendor-bills` POST routes auto-generate their document numbers (e.g., `SO-2026-0001`) via database sequence or Prisma middleware, instead of trusting the frontend payload.
2. **Dashboard Analytics Endpoints:** Create `GET /analytics/admin` and `GET /analytics/accountant` to serve the exact metrics required by the dashboard UI (Operating Cash, Net Income, Cash Flow arrays, Recent Activity).
3. **Razorpay Error Handling:** Validate that `/invoices/:id/razorpay-order` returns proper standard error codes if the API keys are missing, rather than crashing.

## 9. Frontend Integration Requirements

1. **Remove Math.random() Identifiers:**
   - Modify `SalesOrders.jsx`, `PurchaseOrders.jsx`, `CustomerInvoices.jsx`, and `VendorBills.jsx`.
   - The initial `formData` state should leave document IDs empty or label them "Auto-Generated".
2. **Implement Razorpay SDK:**
   - In `InvoiceDetail.jsx` and `CartCheckout.jsx`, remove the `setTimeout` fake success.
   - Fetch the Razorpay Order ID from the backend using `/invoices/:id/razorpay-order`.
   - Load the Razorpay Checkout script and initialize `new window.Razorpay(options)` using `VITE_RAZORPAY_KEY_ID`.
   - Handle the `handler` callback for successful payment verification.
3. **Connect Dashboard Analytics:**
   - In `Dashboard.jsx`, refactor `AdminDashboard` and `AccountantDashboard` to use `useEffect` and fetch data from the new backend analytics endpoints instead of using hardcoded HTML blocks.
4. **Remove Dead Code:**
   - Remove `client/src/api/mockData.js` entirely. It injects a `valora_data` object into `localStorage` which is never actually consumed by the UI components (verified via sweep).
5. **Clean up Offline Cash-Storage Hacks:**
   - The UI heavily relies on `localStorage.setItem('offlinePaidInvoices')` to fake a "PAID" status if the backend fails. This needs to be replaced with a robust retry mechanism or proper offline sync queue.

## 10. Data Contract Risks

- **Mock Dashboard Data vs API:** The static UI in `AdminDashboard` expects specific complex objects (e.g. `card-badges`, `bg-purple` colors). Once mapped to a real API, the API must either return UI-friendly metadata or the frontend needs a strict transformer function.
- **Portal Fallback Products:** The `CustomerMarketplace.jsx` expects `id`, `name`, `category_id`, `sales_price`, `description`, `image`. Ensure the backend `/products` endpoint returns this exact schema to avoid `undefined` rendering.

## 11. Error Handling Gaps

- **Silent Catch Returns:** In `UserDashboard`, if `fetchData()` fails, it silently falls back to `localStorage` without alerting the user that they are viewing stale cache data.
- **Fire-And-Forget Payments:** In `InvoiceDetail.jsx` and `Dashboard.jsx`, the actual `POST` request to pay the invoice has a `.catch(err => console.warn(...))` but completely ignores the error and shows a "Success" UI anyway. This is extremely dangerous for a financial app.

## 12. Security Findings

- **Frontend ID Generation:** The client generates primary identifiers (`Math.random()`) for financial documents. This allows users to forge or duplicate Invoice/Order IDs.
- **Weak JWT Secret:** The `.env` file uses `"your_jwt_secret_key"`.
- **Database Credentials Exposed:** The `server/.env` contains the Supabase Postgres password (`123VALORA123`). This must be rotated.

## 13. Dead / Unused Integration Code

- `client/src/api/mockData.js`: Defines `initialData` and seeds `localStorage` with `valora_data`, but no application code actually queries `localStorage.getItem('valora_data')`.

## 14. Complete Implementation Checklist

### Phase 1 — Critical Blockers
- [ ] Move document number generation (SO/PO/INV/BILL) to backend sequences.
- [ ] Remove `Math.random()` from `SalesOrders`, `PurchaseOrders`, `CustomerInvoices`, `VendorBills`.
- [ ] Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to backend `.env`.

### Phase 2 — API Setup
- [ ] Add `VITE_RAZORPAY_KEY_ID` to frontend `.env`.
- [ ] Create `GET /analytics/dashboard` endpoint in backend.
- [ ] Create `GET /notifications` endpoint in backend.

### Phase 3 — Backend Integration
- [ ] Test `/razorpay-order` creation endpoint functionality.
- [ ] Ensure backend validates and sanitizes all incoming payments.

### Phase 4 — Frontend Integration
- [ ] Integrate Razorpay JS SDK in `InvoiceDetail.jsx`.
- [ ] Integrate Razorpay JS SDK in `CartCheckout.jsx`.
- [ ] Connect `AdminDashboard` and `AccountantDashboard` to `/analytics/dashboard`.
- [ ] Connect `Notifications.jsx` to backend alerts.

### Phase 5 — Mock Data Removal
- [ ] Delete `client/src/api/mockData.js`.
- [ ] Remove fallback `localStorage` arrays from `CustomerMarketplace.jsx`.
- [ ] Remove static HTML cards from `Dashboard.jsx`.

### Phase 6 — Error Handling
- [ ] Add visible error toasts for failed API requests instead of silent catches.
- [ ] Implement loading skeletons while fetching real dashboard data.
- [ ] Ensure payment failures halt the UI success animation.

### Phase 7 — Security
- [ ] Rotate Supabase database password.
- [ ] Generate secure, random `JWT_SECRET`.

### Phase 8 — Production Readiness
- [ ] Test end-to-end payment flow with test credit cards.
- [ ] Verify all role permissions (Admin, Accountant, Contact) enforce API security.

## 15. Recommended Implementation Order

1. **Security Fixes:** Rotate DB passwords, JWT secrets, and generate Razorpay API keys.
2. **Remove Frontend Generation:** Strip `Math.random()` ID logic and implement backend sequencing immediately (P0).
3. **Payment Integration:** Implement the Razorpay SDK on the frontend to replace the simulated `setTimeout` payments (P0).
4. **Analytics API:** Build the backend endpoints required to populate the administrative dashboards (P1).
5. **Dashboard Refactor:** Connect the frontend static dashboards to the new analytics APIs (P1).
6. **Error Handling & UX:** Fix the silent fail catches and offline cache hacks (P2).
7. **Cleanup:** Remove `mockData.js` and final static remnants (P3).

## 16. Final Blockers

- Lack of Razorpay developer keys (requires signing up on Razorpay and fetching keys).
- Requirement to design the exact database sequencing schema for Invoice/Order IDs.
- Potential backend schema updates needed to support the specific analytics required by the static UI design.
