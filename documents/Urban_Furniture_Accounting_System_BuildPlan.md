# Urban Furniture — Accounting System
### Hackathon Build Plan (15 effective coding hours)
Stack: **React (frontend) + Express/Node (backend) + PostgreSQL (database)**

---

## 1. Problem Statement (as given)

Build an accounting system for **Urban Furniture** that supports:
- Core master data: Contacts, Products, Chart of Accounts (CoA), Budget, Journals
- Recording of Sales, Purchases, and Payments using that master data
- Auto-generated financial & stock reports: **Balance Sheet, Profit & Loss (P&L), Budget Report**
- Every transaction must post a **double-entry journal entry** automatically (debit = credit)

### Actors / Roles
| Role | Access |
|---|---|
| **Admin** (Business Owner) | Create/Modify/Archive master data, record transactions, view all reports — full access |
| **Invoicing User** (Accountant) | Create master data, record transactions, view reports, manage journal entries |
| **Contact User** (Customer/Vendor portal login)  |
| **System** | Validates data, computes taxes, updates ledgers, auto-generates journal entries & reports |

> Note: the mockup's "Create User" screen has a **User / Administrator** radio toggle — treat "User" as the Accountant role and "Administrator" as Admin for the login system. Contact-portal login is a separate, lighter-weight auth path scoped to one contact record.

---

## 2. Master Data Modules (from problem statement + mockup)

### 2.1 Contact Master
- Fields: `Name`, `Type` (Customer / Vendor / Both), `Email`, `Mobile`, `Address {City, State, Pincode}`, `Profile Image`
- List View + Kanban View (toggle icon top-right of list, per mockup) + Form View
- Example seed data: Vendor "Azure Furniture" / "Rahul Sharma", Customer "Nimesh Pathak"

### 2.2 Product Master
- Fields: `Product Name`, `Type` (Goods / Service / Combo), `Category` (free text, created on the fly), `Sales Price`, `Cost (Purchase Price)`, `Image`
- List View, Kanban View, Form View (New → fill → Confirm → Back)

### 2.3 Chart of Accounts (CoA)
- Fields: `Account Name`, `Type` (Asset, Liability, Income, Expense, Capital)
- **Must be pre-seeded** (per mockup note: "Chart of Accounts is assumed to be pre-configured") — don't force users to build it from zero in the demo.
- Seed set: Cash (Asset), Bank (Asset), Debtors (Asset), Creditors (Liability), Capital (Capital), Sales Income (Income), Purchase Expense (Expense), Other Expenses (Expense)

### 2.4 Journal (transaction "books")
- Fields: `Journal Name`, `Type` (Sales/Purchase/Bank/Cash), `Default Account` (FK → CoA, many-to-one)
- Seed: Sales → Sales Income A/c, Purchase → Purchase Expense A/c, Bank → Bank A/c, Cash → Cash A/c

### 2.5 Journal Entry (the ledger posting itself)
- Header: `Journal` (FK), `Accounting Date`, `Reference`, `Status` (Draft/Posted/Cancelled)
- Lines (Journal Items): `Account` (FK → CoA), `Partner` (FK → Contact, optional), `Debit`, `Credit`
- **Hard rule: sum(Debit) must equal sum(Credit) before a journal entry can be Posted** — block/warn otherwise (mockup explicitly calls this out).
- Created **automatically** by the system whenever a Vendor Bill or Customer Invoice is confirmed — user does not hand-enter these for normal sales/purchase flow, only views them.

### 2.6 Analytic Account
- Fields: `Name`, `Type` (Income / Expense)
- Used to tag PO/SO/Bill/Invoice lines to a project/department (e.g. "Project 1")

### 2.7 Budget
- Fields: `Budget Name` (e.g. "January 2026"), `Period {Start Date, End Date}`, `Responsible Person` (FK → Contact), Lines: `Analytic Account`, `Type`, `Committed Amount`, `Allowed Amount`
- Computed fields:
  - `Allowed %` = (Allowed Amount / Committed Amount) × 100
  - `Amount to Attain` = Committed Amount − (own) Allowed Amount
- Status lifecycle: **Draft → Confirmed → Revised → Cancelled**
  - Confirm = lock the plan numbers
  - Revise = create a linked "Revised Budget" record referencing the original (traceability), original becomes read-only
- Every Purchase/Sales line tagged with an Analytic Account rolls up into that account's Committed Amount automatically.

---

## 3. Transaction Flow

### 3.1 Purchase Flow
```
Purchase Order (PO) → [convert] → Vendor Bill → [confirm] → auto Journal Entry (Dr Purchase Expense / Cr Creditors)
                                              → Bill Payment (Cash/Bank) → auto Journal Entry (Dr Creditors / Cr Bank or Cash)
```
- PO fields: Vendor, PO Date, Lines {Product, Analytic Account, Qty, Unit Price, Total}, auto PO number (`P00001`, increments per last order)
- Vendor Bill: generated **from** the PO (carries vendor, product, price, qty forward), adds Bill Reference, Bill Date, Due Date, Status (Draft/Confirm/Cancel)
- **Budget guard-rail**: if a bill line's amount pushes past the confirmed budget for that analytic account, show a non-blocking warning ("exceeds the remaining amount for this budget line — consider adjusting the value or revise the budget")
- Payment: choose Bank or Cash, register against the bill → auto-creates the settling journal entry, bill status flips to Paid

### 3.2 Sales Flow
```
Sales Order (SO) → [Create Invoice] → Customer Invoice → [confirm] → auto Journal Entry (Dr Debtors / Cr Sales Income)
                                                        → Invoice Payment (Cash/Bank) → auto Journal Entry (Dr Bank/Cash / Cr Debtors)
```
- SO fields: Customer, SO Date, Lines {Product, Analytic Account, Qty, Unit Price, Total}, auto SO number (`S00001`)
- Customer Invoice generated from SO, same structure as Vendor Bill mirror-image
- Invoice Payment screen: Payment Type (Send/Receive), Partner, Amount, Payment Via (Cash/Bank), Status (Draft/Confirm/Cancelled)

### 3.3 Journal Entries (auto + manual view)
- List view: Date, Number, Partner, Journal, Total, Status
- Detail view: header + line grid (Account / Partner / Debit / Credit) with a **Post** button; blocking validation if totals mismatch

---

## 4. Reports

| Report | Logic |
|---|---|
| **Balance Sheet** | Two columns — Assets (Bank, Cash, Debtors, ...) vs Liabilities (Creditors, ...) + Capital. Total Assets must equal Total Liabilities+Capital. Pulled by summing CoA account balances as of a selected year/date. |
| **Profit & Loss** | Income (Sales) − Expenses (Purchase Expense + Other Expenses) = Net Income. Grouped by CoA `Type = Income` vs `Type = Expense`. |
| **Budget Report** | List + Kanban of all budgets for a period, drill into each to see Committed vs Allowed vs Allowed % vs Amount to Attain. |

All three reports: filter by year/period, `Print` action (can be a simple print-friendly view or PDF export if time allows).

---

## 5. Screen Inventory (from Excalidraw mockup)

1. **Create User** (login id 6–12 chars unique, email unique, password must have upper+lower+special char+length>8, Role = User/Administrator)
2. **Login Page** (Login ID + Password, "Forgot Password / Sign Up" links)
3. **Sign Up Page** (mirrors Create User)
4. **App Dashboard** — tabs: Sales | Purchase | Account | Report, each showing quick-counters (e.g. Sales: All / Confirmed / Draft cards) and a "New" quick-action, plus a left nav listing every module
5. **Master Data** section header, then for **each** master (Contact, Product, Chart of Accounts, Journal, Analytic Account, Budget):
   - **List View** (checkbox select, search bar, Back, list/kanban toggle icon)
   - **Kanban View** (card grid — used for Contact, Product, Analytic Account style masters)
   - **Form View** (New / Confirm / Archive / Back actions)
6. **Journals** list + **Journal Entries** list/detail with Post/Cancel/Reset-to-draft
7. **Budget** form (original) + **Budget (Revised)** form, **Budget Report** list + kanban
8. **Purchase Order → Vendor Bill → Bill Payment** linked form chain
9. **Sales Order → Customer Invoice → Invoice Payment** linked form chain
10. **Profit & Loss report**, **Balance Sheet report** (each: Print button, Year selector, Back)

This gives a clean **List → Form → (linked document) → Payment** pattern repeated across both Purchase and Sales — build one generic component set and reuse it.

---

## 6. Tech Stack & Architecture

```
Frontend:  React (Vite) + React Router + TanStack Query + a component lib (MUI or shadcn/ui) + Recharts (for report charts)
Backend:   Node.js + Express + JWT auth + Zod/Joi validation
Database:  PostgreSQL + Prisma ORM (fastest for hackathon: migrations + type-safe client)
Auth:      JWT stored in httpOnly cookie or localStorage; role middleware (admin/accountant/contact)
Deploy:    Local for hackathon demo; optional Render/Railway (Postgres) + Vercel (frontend) if time allows
```

### 6.1 Why Prisma
For a 15-hour build, Prisma gives you: schema-as-code → `prisma migrate dev` → instant Postgres tables + a typed client, which removes a lot of hand-written SQL/boilerplate. Use raw SQL only for report aggregation queries where needed.

### 6.2 Suggested folder structure
```
/server
  /prisma/schema.prisma
  /src
    /routes        (contacts.js, products.js, coa.js, journals.js, purchase.js, sales.js, payments.js, budgets.js, reports.js, auth.js)
    /controllers
    /services       (accounting.service.js -> postJournalEntry(), etc.)
    /middleware     (auth.js, role.js, validate.js)
    app.js / server.js
/client
  /src
    /pages          (Dashboard, Login, Signup, ContactList, ContactForm, ContactKanban, ProductList, ..., PurchaseOrder, VendorBill, BillPayment, SalesOrder, CustomerInvoice, InvoicePayment, Journals, JournalEntries, Budget, Reports/BalanceSheet, Reports/PnL, Reports/BudgetReport)
    /components     (DataTable, KanbanBoard, FormShell, StatusBadge, MoneyInput)
    /api            (axios client + one file per resource)
    /context        (AuthContext)
```

### 6.3 Core DB tables (simplified)
```
users            (id, name, login_id, email, password_hash, role[admin|accountant|contact], contact_id FK nullable)
contacts         (id, name, type[customer|vendor|both], email, mobile, city, state, pincode, image_url)
products         (id, name, type[goods|service|combo], category, sales_price, cost)
accounts         (id, name, type[asset|liability|income|expense|capital])
journals         (id, name, type[sales|purchase|bank|cash], default_account_id FK -> accounts)
journal_entries  (id, journal_id FK, entry_date, reference, status[draft|posted|cancelled])
journal_items    (id, journal_entry_id FK, account_id FK, partner_id FK nullable, debit, credit)
analytic_accounts(id, name, type[income|expense])
budgets          (id, name, period_start, period_end, responsible_contact_id FK, status[draft|confirmed|revised|cancelled], revised_from_id FK nullable)
budget_lines     (id, budget_id FK, analytic_account_id FK, type, committed_amount, allowed_amount)
purchase_orders  (id, po_number, vendor_id FK, po_date, status)
purchase_order_lines (id, po_id FK, product_id FK, analytic_account_id FK, qty, unit_price, total)
vendor_bills     (id, po_id FK nullable, bill_reference, vendor_id FK, bill_date, due_date, status, total)
vendor_bill_lines(mirrors PO lines)
sales_orders     (id, so_number, customer_id FK, so_date, status)
sales_order_lines(mirrors PO lines)
customer_invoices(id, so_id FK nullable, invoice_number, customer_id FK, invoice_date, due_date, status, total)
customer_invoice_lines (mirrors)
payments         (id, type[send|receive], partner_id FK, amount, method[cash|bank], against_type[bill|invoice], against_id, status)
```

### 6.4 Accounting engine (the one piece of business logic that matters most)
Write **one** shared service function, e.g. `postJournalEntry(journalId, lines[], reference, date)`, that:
1. Validates `sum(debit) === sum(credit)`
2. Inserts the `journal_entries` + `journal_items` rows in a DB transaction
3. Is called from exactly 4 places: Vendor Bill confirm, Customer Invoice confirm, Bill Payment confirm, Invoice Payment confirm

Doing this once and reusing it is the highest-leverage move for both correctness and time saved.

---

## 7. Minimum API Surface

```
POST   /auth/signup            POST /auth/login
CRUD   /contacts                CRUD /products               CRUD /accounts (CoA)
CRUD   /journals                GET  /journal-entries         GET /journal-entries/:id
CRUD   /analytic-accounts       CRUD /budgets

POST   /purchase-orders         POST /purchase-orders/:id/create-bill
CRUD   /vendor-bills            POST /vendor-bills/:id/confirm     POST /vendor-bills/:id/pay

POST   /sales-orders            POST /sales-orders/:id/create-invoice
CRUD   /customer-invoices       POST /customer-invoices/:id/confirm   POST /customer-invoices/:id/pay

GET    /reports/balance-sheet?year=
GET    /reports/profit-and-loss?year=
GET    /reports/budget?period=
```

---

## 8. 15-Hour Execution Plan — 3-Person Split (1 Frontend + 2 Backend)

**Split logic:** the two backend people each own a *vertical domain* (schema + business logic + API routes for that domain end-to-end), not "one does models, one does routes" — that avoids blocking each other. **Backend-1 owns Purchase + the shared Accounting Engine** (because Sales is a structural mirror of Purchase, Backend-2 can copy the pattern once it exists). **Backend-2 owns Sales + Budgets/Analytics + Reports.** **Frontend owns 100% of the React app** and works against a shared API contract (section 7) that's frozen in hour 1, using mock/stubbed JSON before real endpoints exist so they're never blocked.

Legend: **FE** = Frontend dev, **BE1** = Backend dev 1 (Purchase + Engine), **BE2** = Backend dev 2 (Sales + Budget + Reports)

| Hours | FE (Frontend) | BE1 (Purchase + Accounting Engine) | BE2 (Sales + Budget + Reports) |
|---|---|---|---|
| **0 – 1** | Vite/React scaffold, router, layout shell (nav + Dashboard skeleton), agree on API contract (§7) with both backend devs | Repo + Postgres + **Prisma schema for all tables** (§6.3) — commit this first, both backends build on it | Review/help finalize Prisma schema with BE1; set up Express skeleton + shared middleware (error handler, validate) |
| **1 – 2.5** | Login/Signup pages + AuthContext (JWT storage), Dashboard cards (static data for now) | **Auth routes** (signup/login/JWT/role middleware) + seed script (CoA, Journals, demo Contacts/Products) | CRUD scaffolding generator/pattern for masters (Contact, Product, Analytic Account) so both backends reuse the same controller shape |
| **2.5 – 5** | Master data List + Form views: Contact, Product, CoA (read-only), Journal — build once as a **generic DataTable + FormShell** component so every later screen reuses it | Finish Contact + Product + CoA + Journal CRUD routes | **Accounting Engine service** `postJournalEntry()` (§6.4) — this is the critical-path item, build & unit-test it now so BE1 can call it in the next block |
| **5 – 7** | Hook master data screens to real APIs; start Purchase Order form UI | **Purchase Order** CRUD + PO→Vendor Bill conversion route, wired to Accounting Engine on Bill confirm | **Analytic Account** CRUD + **Budget** CRUD (Draft/Confirm only), budget lines aggregate committed amount |
| **7 – 9** | Vendor Bill + Bill Payment screens; wire to BE1's endpoints | **Vendor Bill confirm → journal post**, **Bill Payment → journal post**; expose Journal Entries list/detail read routes | **Sales Order** CRUD + SO→Customer Invoice conversion route, calling BE1's `postJournalEntry()` on confirm (copy BE1's Vendor Bill pattern) |
| **9 – 11** | Sales Order + Customer Invoice + Invoice Payment screens; Journal Entries list/detail screen | Support/debug BE2 on reusing the accounting engine correctly; start **Balance Sheet** aggregate query | **Customer Invoice confirm → journal post**, **Invoice Payment → journal post** |
| **11 – 13** | Budget form UI (list/form, tag analytic account on PO/SO lines); start Reports pages (tables first, charts if time) | Finish **Balance Sheet** endpoint + **P&L** endpoint (aggregate by CoA type) | **Budget Report** endpoint (committed vs allowed vs %); help BE1 finish P&L if needed |
| **13 – 14** | Wire all 3 report pages to live endpoints; error/empty states across the app | Bug-fix pass on Purchase chain + engine edge cases (debit≠credit, cancel/re-post) | Bug-fix pass on Sales chain + Budget/Report edge cases |
| **14 – 15** | Full demo dry-run with both backends, polish UI, README screenshots | Joint: fix whatever breaks in the dry-run, prep seed/demo script | Joint: fix whatever breaks in the dry-run, prep seed/demo script |

### Sync checkpoints (don't skip these)
- **End of hour 1:** Prisma schema + API contract frozen — no more field-name/shape changes without telling the other two.
- **End of hour 5:** Accounting Engine (`postJournalEntry`) is done, tested with a dummy debit/credit pair, and BE1/BE2 both know its exact function signature before building Bill/Invoice confirm logic on top of it.
- **End of hour 9:** Both Purchase and Sales chains fully post journal entries end-to-end — this is the point to do a quick 3-way smoke test together.
- **End of hour 13:** All reports return real numbers — do a second 3-way check that Balance Sheet actually balances using the demo data.

### If a backend person finishes early
Have them jump to Journal Entries UI polish, PDF/print export for reports, or the Budget "Revise" workflow (§8 cut-list) rather than starting new scope — finishing the two chains cleanly matters more than breadth.

### Cut-list if you're behind schedule (in order of what to drop first)
1. Kanban views for masters (List view alone is enough)
2. Budget "Revise" workflow (keep just Draft → Confirm)
3. Contact self-service portal login (nice-to-have, judges usually care about Admin/Accountant flow)
4. Analytic account budget warning banners (keep the budget number, drop the live warning)
5. PDF export of reports (on-screen table is enough)

### Do-not-cut (these are what the problem statement is actually graded on)
- Double-entry correctness (debit = credit, auto-posted on confirm)
- PO→Bill→Payment and SO→Invoice→Payment full chains
- Balance Sheet & P&L pulling from real ledger data, not hardcoded numbers

---

## 9. Notes / Open Questions to settle as a team before coding
- Tax handling: problem statement mentions "Tax" on Sales Order line but doesn't define a tax master — simplest hackathon approach: a flat tax % field per line, added to total, posted to a single "Tax Payable" liability account if time allows, otherwise ignore and note it as a known simplification in the README.
- Stock/inventory tracking is referenced ("Stock reports") but no stock master is defined in the doc — treat as **out of scope** unless explicitly required by judges; mention as a stated limitation.
- Multi-currency, attachments, and audit trail are not mentioned — skip entirely.

---

**Mockup reference:** https://app.excalidraw.com/s/65VNwvy7c4X/6ofCsWuwhe
