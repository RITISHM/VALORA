# Valora Backend – Performance Issues & Fixes Tracker

> Generated on: 2026-09-05  
> Total Issues Found: **14**

---

## 🔴 CRITICAL Issues

### Issue 1 — Missing Database Indexes on Foreign Keys
- **File:** `server/prisma/schema.prisma`
- **Problem:** No `@@index` directives on any foreign key columns. Every relational query (get invoice lines, orders by customer, journal items, stock movements) performs a full table scan instead of an instant index lookup.
- **Fix:** Add `@@index` to all foreign key fields across every model.
- **Status:** ✅ Fixed

---

### Issue 2 — Duplicate PrismaClient Instance in Auth Route
- **File:** `server/src/routes/auth.js` (Line 8)
- **Problem:** Creates `new PrismaClient()` instead of using the shared singleton from `../prisma.js`. This opens a separate database connection pool, wasting resources and bypassing any shared configuration.
- **Fix:** Replace `new PrismaClient()` with `require('../prisma')`.
- **Status:** ✅ Fixed

---

### Issue 3 — Redundant DB Check Before Signup
- **File:** `server/src/routes/auth.js` (Lines 29–37)
- **Problem:** Manually queries `prisma.user.findFirst()` to check for duplicate `login_id`/`email` before creating. The schema already has `@unique` on both fields. This wastes 1 DB round-trip per signup and has a TOCTOU race condition.
- **Fix:** Remove the `findFirst` check. Attempt `.create()` directly and catch Prisma error code `P2002` for unique constraint violations.
- **Status:** ✅ Fixed

---

### Issue 4 — N+1 Sequential Stock Movement Writes (Invoices)
- **File:** `server/src/services/invoices.service.js` (Lines 199–209)
- **Problem:** `for` loop with `await tx.stockMovement.create()` inside — each line item triggers a separate DB round-trip.
- **Fix:** Collect all stock movements into an array and use `tx.stockMovement.createMany()`.
- **Status:** ✅ Fixed

---

### Issue 5 — N+1 Sequential Stock Movement Writes (Vendor Bills)
- **File:** `server/src/services/vendorBills.service.js` (Lines 156–166)
- **Problem:** Same N+1 loop pattern as invoices.
- **Fix:** Batch with `tx.stockMovement.createMany()`.
- **Status:** ✅ Fixed

---

### Issue 6 — N+1 Sequential Account Seeding
- **File:** `server/src/services/accounts.service.js` (Lines 22–24)
- **Problem:** `for` loop with `await prisma.account.create()` for 8 default accounts — 8 separate DB round-trips.
- **Fix:** Replace with `prisma.account.createMany({ data: defaults })`.
- **Status:** ✅ Fixed

---

### Issue 7 — Sequential DB Reads That Should Be Parallel (Invoices confirm)
- **File:** `server/src/services/invoices.service.js` (Lines 219–231)
- **Problem:** 4 sequential `await prisma.findFirst()` calls for salesJournal, debtorsAccount, salesIncomeAccount, taxPayableAccount. They don't depend on each other but are awaited one after another.
- **Fix:** Use `Promise.all()` to run them concurrently.
- **Status:** ✅ Fixed

---

### Issue 8 — Sequential DB Reads That Should Be Parallel (Invoices pay)
- **File:** `server/src/services/invoices.service.js` (Lines 337–351)
- **Problem:** 3 sequential `findFirst` calls in `pay()`.
- **Fix:** Use `Promise.all()`.
- **Status:** ✅ Fixed

---

### Issue 9 — Sequential DB Reads That Should Be Parallel (Vendor Bills confirm)
- **File:** `server/src/services/vendorBills.service.js` (Lines 171–175)
- **Problem:** 3 sequential `findFirst` calls.
- **Fix:** Use `Promise.all()`.
- **Status:** ✅ Fixed

---

### Issue 10 — Sequential DB Reads That Should Be Parallel (Payments)
- **File:** `server/src/services/payments.service.js` (Lines 28–32)
- **Problem:** 3 sequential `findFirst` calls.
- **Fix:** Use `Promise.all()`.
- **Status:** ✅ Fixed

---

### Issue 11 — In-Memory Aggregation Instead of DB Aggregation (Portal)
- **File:** `server/src/services/portal.service.js` (Lines 139–166)
- **Problem:** `getOutstandingForContact()` fetches ALL unpaid invoices and bills into Node.js memory, then sums their totals with a `for` loop. This is a memory bomb as data grows.
- **Fix:** Replace with `prisma.customerInvoice.aggregate({ _sum: { total: true } })`.
- **Status:** ✅ Fixed

---

### Issue 12 — Redundant Read-Before-Write in Services
- **Files:**
  - `server/src/services/analyticAccounts.service.js` (Lines 31–39) — `update()`
  - `server/src/services/budgets.service.js` (Lines 160–165, 245–250) — `confirm()`, `cancel()`
  - `server/src/services/sales.service.js` (Lines 123–128) — `confirm()`
- **Problem:** These functions fetch the record with `findUnique` just to check it exists, then perform the `update`. That's 2 DB queries when 1 would do.
- **Fix:** Attempt the `update` directly and catch Prisma `P2025` error for "record not found".
- **Status:** ✅ Fixed

---

### Issue 13 — Redundant Body Validation in Controller
- **File:** `server/src/controllers/analyticAccounts.controller.js` (Lines 29–31, 87–89)
- **Problem:** Manual `!req.body || typeof req.body !== "object"` checks. Express JSON middleware + Zod already handle this.
- **Fix:** Remove the redundant checks.
- **Status:** ✅ Fixed

---

### Issue 14 — No Prisma Query Logging Configured
- **File:** `server/src/prisma.js`
- **Problem:** PrismaClient is instantiated with no logging. Impossible to debug slow queries.
- **Fix:** Add `log: ['warn', 'error']` (and `'query'` in development).
- **Status:** ✅ Fixed

---

## Progress

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Missing DB Indexes | 🔴 Critical | ✅ |
| 2 | Duplicate PrismaClient | 🔴 Critical | ✅ |
| 3 | Redundant Signup Check | 🟡 Medium | ✅ |
| 4 | N+1 Stock Writes (Invoices) | 🟠 High | ✅ |
| 5 | N+1 Stock Writes (Bills) | 🟠 High | ✅ |
| 6 | N+1 Account Seeding | 🟠 High | ✅ |
| 7 | Sequential Reads (Invoice confirm) | 🟠 High | ✅ |
| 8 | Sequential Reads (Invoice pay) | 🟠 High | ✅ |
| 9 | Sequential Reads (Bill confirm) | 🟠 High | ✅ |
| 10 | Sequential Reads (Payments) | 🟠 High | ✅ |
| 11 | In-Memory Aggregation (Portal) | 🟠 High | ✅ |
| 12 | Redundant Read-Before-Write | 🟡 Medium | ✅ |
| 13 | Redundant Body Validation | 🟢 Low | ✅ |
| 14 | No Prisma Logging | 🟢 Low | ✅ |
