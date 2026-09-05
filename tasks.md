# API Integration & Mock Data Cleanup Tasks

## 1. [DONE] Remove Frontend Random ID Generation (P0)
- **Objective:** Stop the frontend from generating `Math.random()` order and invoice numbers. Allow the backend sequence generators to assign these.
- **Files:**
  - `client/src/pages/sales/SalesOrders.jsx`
  - `client/src/pages/sales/CustomerInvoices.jsx`
  - `client/src/pages/purchase/PurchaseOrders.jsx`
  - `client/src/pages/purchase/VendorBills.jsx`
- **Action:** Update initial `formData` state to remove random strings. Display "Auto-Generated" or similar in the UI if needed, and rely on the created object's properties post-save.

## 2. [DONE] Setup Razorpay Credentials and SDK (P0)
- **Objective:** Enable real Razorpay payments instead of `setTimeout` fakes.
- **Backend:** 
  - Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `server/.env`.
  - Ensure `/razorpay-order` endpoint in `portal.service.js` is fully working.
- **Frontend:**
  - Add `VITE_RAZORPAY_KEY_ID` to `client/.env`.
  - Load the Razorpay SDK script.
  - In `InvoiceDetail.jsx` and `CartCheckout.jsx`, remove the `setTimeout` and instantiate `window.Razorpay` using the fetched order ID.

## 3. [DONE] Implement Dashboard Analytics API (P1)
- **Objective:** Replace static HTML cards with real data.
- **Backend:** Create `GET /analytics/dashboard` (or similar endpoints for admin/accountant stats).
- **Frontend:** Refactor `Dashboard.jsx` (Admin and Accountant views) to fetch and render this API data.

## 4. [DONE] Fix Error Handling & UX (P2)
- **Objective:** Remove silent catches and offline hacks.
- **Frontend:** 
  - Add toasts/alerts for failed API requests.
  - Remove `localStorage.setItem('offlinePaidInvoices')` hacks.
  - Stop success animations if payments fail.

## 5. [DONE] Security & Cleanup (P2/P3)
- **Backend:** Rotate `JWT_SECRET` in `.env` to a secure random string. (Skip DB password rotation unless instructed).
- **Frontend:** Delete `client/src/api/mockData.js` and remove any static HTML remnants or local arrays (like in `CustomerMarketplace.jsx`).
