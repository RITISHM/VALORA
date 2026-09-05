const prisma = require("../prisma");

class BudgetsService {
  /**
   * Compute live committed and achieved amounts for each budget line.
   * - committed_amount: stored value (set when line is saved, represents the monetary plan)
   * - allowed_amount: the cap/budget limit set by user
   * - achieved_amount: actual spend from confirmed/paid vendor bills + customer invoices
   *   tagged to this analytic account within the budget period.
   * - allowed_pct: (achieved_amount / committed_amount) * 100  [per spec]
   * - amount_to_attain: committed_amount - achieved_amount  [per spec]
   */
  async enrichBudgetLines(budget) {
    if (!budget) return null;

    const start = new Date(budget.period_start);
    const end = new Date(budget.period_end);

    const enrichedLines = await Promise.all(
      (budget.budget_lines || []).map(async (line) => {
        const analyticId = line.analytic_account_id;

        // Achieved = sum of vendor bill lines (confirmed/paid) within period for this analytic account
        const [vendorBillAchieved, invoiceAchieved] = await Promise.all([
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

        const achieved_amount =
          Math.round(
            ((vendorBillAchieved._sum.total || 0) +
              (invoiceAchieved._sum.total || 0)) *
              100,
          ) / 100;

        const committed = line.committed_amount || 0;
        const allowed = line.allowed_amount || 0;

        // Per spec: Allowed % = (Achieved Amount / Committed Amount) * 100
        const allowed_pct =
          committed > 0
            ? Math.round((achieved_amount / committed) * 10000) / 100
            : 0;

        // Per spec: Amount to Attain = Committed Amount - Achieved Amount
        const amount_to_attain =
          Math.round((committed - achieved_amount) * 100) / 100;

        return {
          ...line,
          achieved_amount,
          allowed_pct,
          amount_to_attain,
          is_over_budget: achieved_amount > allowed,
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
            committed_amount: parseFloat(line.committed_amount) || 0,
            allowed_amount: parseFloat(line.allowed_amount) || 0,
          })),
        },
      },
      include: {
        responsible_contact: true,
        budget_lines: {
          include: { analytic_account: true },
        },
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
        budget_lines: {
          include: { analytic_account: true },
        },
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
        revisions: true,
        budget_lines: {
          include: { analytic_account: true },
        },
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

    if (existing.status === "REVISED" || existing.status === "CANCELLED") {
      const error = new Error(`Cannot modify budget with status ${existing.status}`);
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
                committed_amount: parseFloat(line.committed_amount) || 0,
                allowed_amount: parseFloat(line.allowed_amount) || 0,
              })),
            },
          }),
        },
        include: {
          responsible_contact: true,
          budget_lines: {
            include: { analytic_account: true },
          },
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
        budget_lines: { include: { analytic_account: true } },
      },
    });

    return this.enrichBudgetLines(updated);
  }

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
      // Mark original as REVISED (read-only going forward)
      await tx.budget.update({
        where: { id },
        data: { status: "REVISED" },
      });

      // Copy original lines unless new lines are provided
      const revisedLines =
        lines ||
        original.budget_lines.map((l) => ({
          analytic_account_id: l.analytic_account_id,
          type: l.type,
          committed_amount: l.committed_amount,
          allowed_amount: l.allowed_amount,
        }));

      const newBudget = await tx.budget.create({
        data: {
          // Per spec: keep original name, append " Revised"
          name: name ? name.trim() : `${original.name} Revised`,
          period_start: original.period_start,
          period_end: original.period_end,
          responsible_contact_id: original.responsible_contact_id,
          status: "CONFIRMED",
          revised_from_id: original.id,
          budget_lines: {
            create: revisedLines.map((line) => ({
              analytic_account_id: line.analytic_account_id,
              type: line.type || "EXPENSE",
              committed_amount: parseFloat(line.committed_amount) || 0,
              allowed_amount: parseFloat(line.allowed_amount) || 0,
            })),
          },
        },
        include: {
          responsible_contact: true,
          revised_from: true,
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
        budget_lines: { include: { analytic_account: true } },
      },
    });

    return this.enrichBudgetLines(updated);
  }
}

module.exports = new BudgetsService();
