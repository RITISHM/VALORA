# BE1 Task Tracker: Urban Furniture Accounting System

This document tracks the progress of the Backend 1 (BE1) developer across the 15-hour hackathon build plan. 
**Note:** This file is for local tracking only and will not be pushed to GitHub.

---

## ✅ Completed Tasks (Hours 0 - 2.5)

- [x] **Project Initialization:** Set up the Node/Express backend (`server/`), `package.json`, and installed dependencies (Prisma, Express, JWT, Zod, bcrypt, etc.).
- [x] **Database Schema:** Drafted the complete `prisma/schema.prisma` file containing all core tables (Contacts, Products, CoA, Journals, POs, Bills, etc.).
- [x] **Database Sync:** Configured `.env` with the Supabase connection pooler URL and successfully pushed the schema to the live PostgreSQL database (`npx prisma db push`).
- [x] **Authentication Core:** Built JWT and Role-checking middleware (`src/middleware/auth.js`).
- [x] **Auth API Routes:** Created `/auth/signup` and `/auth/login` endpoints with password hashing and validation (`src/routes/auth.js`).
- [x] **Data Seeding:** Wrote and executed `src/scripts/seed.js` to populate Supabase with essential demo data (Chart of Accounts, Journals, test contacts).
- [x] **GitHub Sync:** Pushed the baseline setup to GitHub so BE2 is unblocked and can begin their work.

---

## 🚀 Current & Upcoming Tasks

### Phase 1: Master Data CRUD (Hours 2.5 - 5)
- [x] **Contact Routes:** Build CRUD endpoints for `/contacts` (List, Create, Update, Delete).
- [x] **Product Routes:** Build CRUD endpoints for `/products`.
- [x] **Account Routes (CoA):** Build Read endpoints for `/accounts` to fetch the seeded Chart of Accounts.
- [x] **Journal Routes:** Build CRUD endpoints for `/journals`.

### Phase 2: Purchase Flow & Accounting (Hours 5 - 9)
- [ ] **Purchase Orders:** Build CRUD endpoints for `/purchase-orders`.
- [ ] **PO to Bill Conversion:** Build an endpoint to convert a Purchase Order into a Vendor Bill.
- [ ] **Vendor Bill Confirmation:** Build the endpoint to confirm a Vendor Bill, which must trigger the shared **Accounting Engine** to automatically post a Double-Entry Journal Entry.
- [ ] **Bill Payments:** Build the endpoint to register a payment against a Vendor Bill, triggering the Accounting Engine to post the payment Journal Entry.
- [ ] **Journal Entries API:** Build read-only endpoints to list and view details of generated Journal Entries (`/journal-entries`).

### Phase 3: Reports & Edge Cases (Hours 9 - 15)
- [ ] **Cross-team Support:** Assist BE2 in correctly utilizing the shared Accounting Engine for their Sales Flow.
- [ ] **Balance Sheet Report:** Build the API endpoint to calculate and return the Balance Sheet (Assets vs. Liabilities + Capital).
- [ ] **Profit & Loss Report:** Build the API endpoint to calculate and return Net Income (Income vs. Expenses).
- [ ] **Bug Fixes:** Perform a bug-fix pass on the entire Purchase chain and accounting edge cases (e.g., ensuring Debits always equal Credits).
- [ ] **Final Dry Run:** Participate in the full team demo dry-run.

---
*Last Updated: End of Hour 2.5*
