const prisma = require("../prisma");

/**
 * BUDGET LOGIC — as per spec (Urban_Furniture_Accounting_System_BuildPlan.md §2.7)
 *
 * Fields:
 *   allowed_amount  = Budget CAP set by user ("You are allowed ₹2,00,000 for this account")
 *   committed_amount = Auto-computed sum of all PO/Bill/Invoice lines tagged to this
 *                      analytic account within the budget period.
 *
 * Computed (read-only, returned in API):
 *   allowed_pct      = (Allowed Amount / Committed Amount) × 100
 *   amount_to_attain = Committed Amount − Allowed Amount
 *   is_over_budget   = committed_amount > allowed_amount
 *
 * Status lifecycle: DRAFT → CONFIRMED → REVISED → CANCELLED
 *   DRAFT     = user is filling in allowed amounts
 *   CONFIRMED = budget is locked and active; committed_amount is live-computed
 *   REVISED   = this budget has been superseded by a newer revision (read-only archive)
 *   CANCELLED = archived/cancelled
 *
 * Revise:
 *   When a CONFIRMED budget needs its allowed_amount cap changed mid-period:
 *   1. Original budget moves to REVISED status (read-only, for traceability)
 *   2. A new CONFIRMED budget is created as a copy, with revised_from_id → original
 *   3. User edits the allowed_amount values on the new budget
 *   The new budget name keeps the original name with " Revised" appended once.
 *
 * Every PO/Invoice line tagged with an Analytic Account rolls up into that
 * account's committed_amount automatically (live aggregation).
 */
class BudgetsService {
  /**
   * Live-compute committed_amount for each budget line by summing all
   * confirmed/paid vendor bill lines and customer invoice lines
   * tagged to the same analytic account within the budget period.
   * Then compute allowed_pct and amount_to_attain.
   */
  async enrichBudgetLines(budget) {
    if (!budget) return null;

    const start = new Date(budget.period_start);
    const end = new Date(budget.period_end);

    const enrichedLines = await Promise.all(
      (budget.budget_lines || []).map(async (line) => {
        const analyticId = line.analytic_account_id;

        // committed_amount = sum of all transactions in this analytic account in period
        const [vendorCommitted, invoiceCommitted] = await Promise.all([
          prisma.vendorBillLine.aggregate({
            _sum: { total: true },
            where: {
              analytic_account_id: analyticId,
              bill: {
                status: { in: ["CONFIRMED", "PAID"] },
                bill_date: { gte: start, lte: end },
              },
            },
          }),
          prisma.customerInvoiceLine.aggregate({
            _sum: { total: true },
            where: {
              analytic_account_id: analyticId,
              invoice: {
                status: { in: ["CONFIRMED", "PAID"] },
                invoice_date: { gte: start, lte: end },
              },
            },
          }),
        ]);

        // Also include PO lines (committed but not yet billed)
        const poCommitted = await prisma.purchaseOrderLine.aggregate({
          _sum: { total: true },
          where: {
            analytic_account_id: analyticId,
            po: {
              status: { in: ["CONFIRMED"] },
              po_date: { gte: start, lte: end },
            },
          },
        });

        const committed_amount =
          Math.round(
            ((vendorCommitted._sum.total || 0) +
              (invoiceCommitted._sum.total || 0) +
              (poCommitted._sum.total || 0)) *
              100,
          ) / 100;

        const allowed = line.allowed_amount || 0;

        // Allowed % = (Allowed Amount / Committed Amount) × 100
        // i.e. what fraction of the actual spend is covered by the cap
        const allowed_pct =
          committed_amount > 0
            ? Math.round((allowed / committed_amount) * 10000) / 100
            : 0;

        // Amount to Attain = Committed Amount − Allowed Amount
        // Positive = you're over budget (committed > cap)
        // Negative = under budget (buffer remaining)
        const amount_to_attain =
          Math.round((committed_amount - allowed) * 100) / 100;

        return {
          ...line,
          committed_amount, // live value, overrides stored 0
          allowed_pct,
          amount_to_attain,
          is_over_budget: committed_amount > allowed,
        };
      }),
    );

    return {
      ...budget,
      budget_lines: enrichedLines,
    };
  }

  async create({ name, period_start, period_end, responsible_contact_id, lines = [] }) {
    if (!name || !period_start || !period_end || !responsible_contact_id) {
      const error = new Error(
        "Name, period_start, period_end, and responsible_contact_id are required",
      );
      error.statusCode = 400;
      throw error;
    }

    const created = await prisma.budget.create({
      data: {
        name: name.trim(),
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        responsible_contact_id,
        status: "DRAFT",
        budget_lines: {
          create: lines.map((line) => ({
            analytic_account_id: line.analytic_account_id,
            type: line.type || "EXPENSE",
            // Only allowed_amount is user-set. committed_amount is live-computed.
            allowed_amount: parseFloat(line.allowed_amount) || 0,
            committed_amount: 0,
          })),
        },
      },
      include: {
        responsible_contact: true,
        budget_lines: { include: { analytic_account: true } },
      },
    });

    return this.enrichBudgetLines(created);
  }

  async getAll() {
    const budgets = await prisma.budget.findMany({
      orderBy: { period_start: "desc" },
      include: {
        responsible_contact: true,
        revised_from: true,
        budget_lines: { include: { analytic_account: true } },
      },
    });

    return Promise.all(budgets.map((b) => this.enrichBudgetLines(b)));
  }

  async getById(id) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        responsible_contact: true,
        revised_from: true,
        // Revisions (budgets that were created from this one)
        revisions: {
          include: { responsible_contact: true },
          orderBy: { period_start: "asc" },
        },
        budget_lines: { include: { analytic_account: true } },
      },
    });

    if (!budget) {
      const error = new Error("Budget not found");
      error.statusCode = 404;
      throw error;
    }

    return this.enrichBudgetLines(budget);
  }

  async update(id, { name, period_start, period_end, responsible_contact_id, lines }) {
    const existing = await prisma.budget.findUnique({ where: { id } });

    if (!existing) {
      const error = new Error("Budget not found");
      error.statusCode = 404;
      throw error;
    }

    // Only DRAFT budgets can be freely edited
    if (existing.status !== "DRAFT") {
      const error = new Error(
        `Cannot edit a budget with status ${existing.status}. Only DRAFT budgets can be edited.`,
      );
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      if (lines) {
        await tx.budgetLine.deleteMany({ where: { budget_id: id } });
      }

      const updated = await tx.budget.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(period_start && { period_start: new Date(period_start) }),
          ...(period_end && { period_end: new Date(period_end) }),
          ...(responsible_contact_id && { responsible_contact_id }),
          ...(lines && {
            budget_lines: {
              create: lines.map((line) => ({
                analytic_account_id: line.analytic_account_id,
                type: line.type || "EXPENSE",
                allowed_amount: parseFloat(line.allowed_amount) || 0,
                committed_amount: 0,
              })),
            },
          }),
        },
        include: {
          responsible_contact: true,
          budget_lines: { include: { analytic_account: true } },
        },
      });

      return this.enrichBudgetLines(updated);
    });
  }

  async confirm(id) {
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Budget not found");
      error.statusCode = 404;
      throw error;
    }
    if (existing.status !== "DRAFT") {
      const error = new Error("Only DRAFT budgets can be confirmed");
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: {
        responsible_contact: true,
        revised_from: true,
        revisions: true,
        budget_lines: { include: { analytic_account: true } },
      },
    });

    return this.enrichBudgetLines(updated);
  }

  /**
   * Revise a CONFIRMED budget:
   * 1. Mark the original as REVISED (read-only archive for traceability)
   * 2. Create a new CONFIRMED budget copied from the original,
   *    linking back via revised_from_id.
   * 3. User provides updated allowed_amount values for each line.
   *
   * Name rule: append " Revised" once (strip existing " Revised" suffix first).
   */
  async revise(id, { name, lines }) {
    const original = await prisma.budget.findUnique({
      where: { id },
      include: { budget_lines: true },
    });

    if (!original) {
      const error = new Error("Budget not found");
      error.statusCode = 404;
      throw error;
    }

    if (original.status !== "CONFIRMED") {
      const error = new Error("Only CONFIRMED budgets can be revised");
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      // Step 1: Archive original as REVISED (read-only from now on)
      await tx.budget.update({
        where: { id },
        data: { status: "REVISED" },
      });

      // Step 2: Build revised name — strip trailing " Revised" then add once
      const baseName = original.name.replace(/\s+Revised$/i, "").trim();
      const revisedName = name
        ? name.trim()
        : `${baseName} Revised`;

      // Step 3: Use provided lines (with new allowed_amounts) or copy from original
      const revisedLines =
        lines && lines.length > 0
          ? lines
          : original.budget_lines.map((l) => ({
              analytic_account_id: l.analytic_account_id,
              type: l.type,
              allowed_amount: l.allowed_amount,
            }));

      // Step 4: Create new CONFIRMED budget linked to original
      const newBudget = await tx.budget.create({
        data: {
          name: revisedName,
          period_start: original.period_start,
          period_end: original.period_end,
          responsible_contact_id: original.responsible_contact_id,
          status: "CONFIRMED", // Revised budget is immediately CONFIRMED per spec
          revised_from_id: original.id,
          budget_lines: {
            create: revisedLines.map((line) => ({
              analytic_account_id: line.analytic_account_id,
              type: line.type || "EXPENSE",
              allowed_amount: parseFloat(line.allowed_amount) || 0,
              committed_amount: 0, // will be live-computed
            })),
          },
        },
        include: {
          responsible_contact: true,
          revised_from: {
            select: { id: true, name: true, status: true },
          },
          revisions: true,
          budget_lines: { include: { analytic_account: true } },
        },
      });

      return this.enrichBudgetLines(newBudget);
    });
  }

  async cancel(id) {
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Budget not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        responsible_contact: true,
        revised_from: { select: { id: true, name: true, status: true } },
        revisions: true,
        budget_lines: { include: { analytic_account: true } },
      },
    });

    return this.enrichBudgetLines(updated);
  }
}

module.exports = new BudgetsService();
