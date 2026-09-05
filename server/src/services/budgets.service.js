const prisma = require('../prisma');

class BudgetsService {
  formatBudget(budget) {
    if (!budget) return null;

    const formattedLines = (budget.budget_lines || []).map((line) => {
      const committed = line.committed_amount || 0;
      const allowed = line.allowed_amount || 0;
      const allowed_pct = committed > 0 ? Math.round((allowed / committed) * 10000) / 100 : 0;
      const amount_to_attain = Math.round((committed - allowed) * 100) / 100;

      return {
        ...line,
        allowed_pct,
        amount_to_attain,
      };
    });

    return {
      ...budget,
      budget_lines: formattedLines,
    };
  }

  async create({ name, period_start, period_end, responsible_contact_id, lines = [] }) {
    if (!name || !period_start || !period_end || !responsible_contact_id) {
      const error = new Error('Name, period_start, period_end, and responsible_contact_id are required');
      error.statusCode = 400;
      throw error;
    }

    const created = await prisma.budget.create({
      data: {
        name: name.trim(),
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        responsible_contact_id,
        status: 'DRAFT',
        budget_lines: {
          create: lines.map((line) => ({
            analytic_account_id: line.analytic_account_id,
            type: line.type || 'EXPENSE',
            committed_amount: parseFloat(line.committed_amount) || 0,
            allowed_amount: parseFloat(line.allowed_amount) || 0,
          })),
        },
      },
      include: {
        responsible_contact: true,
        budget_lines: {
          include: {
            analytic_account: true,
          },
        },
      },
    });

    return this.formatBudget(created);
  }

  async getAll() {
    const budgets = await prisma.budget.findMany({
      orderBy: {
        period_start: 'desc',
      },
      include: {
        responsible_contact: true,
        revised_from: true,
        budget_lines: {
          include: {
            analytic_account: true,
          },
        },
      },
    });

    return budgets.map((b) => this.formatBudget(b));
  }

  async getById(id) {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        responsible_contact: true,
        revised_from: true,
        revisions: true,
        budget_lines: {
          include: {
            analytic_account: true,
          },
        },
      },
    });

    if (!budget) {
      const error = new Error('Budget not found');
      error.statusCode = 404;
      throw error;
    }

    return this.formatBudget(budget);
  }

  async update(id, { name, period_start, period_end, responsible_contact_id, lines }) {
    const existing = await prisma.budget.findUnique({ where: { id } });

    if (!existing) {
      const error = new Error('Budget not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status === 'REVISED' || existing.status === 'CANCELLED') {
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
                type: line.type || 'EXPENSE',
                committed_amount: parseFloat(line.committed_amount) || 0,
                allowed_amount: parseFloat(line.allowed_amount) || 0,
              })),
            },
          }),
        },
        include: {
          responsible_contact: true,
          budget_lines: {
            include: {
              analytic_account: true,
            },
          },
        },
      });

      return this.formatBudget(updated);
    });
  }

  async confirm(id) {
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Budget not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        responsible_contact: true,
        budget_lines: {
          include: {
            analytic_account: true,
          },
        },
      },
    });

    return this.formatBudget(updated);
  }

  async revise(id, { name, lines }) {
    const original = await prisma.budget.findUnique({
      where: { id },
      include: { budget_lines: true },
    });

    if (!original) {
      const error = new Error('Budget not found');
      error.statusCode = 404;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      // Mark original as REVISED
      await tx.budget.update({
        where: { id },
        data: { status: 'REVISED' },
      });

      // Create new revised budget record referencing original
      const revisedLines = lines || original.budget_lines.map(l => ({
        analytic_account_id: l.analytic_account_id,
        type: l.type,
        committed_amount: l.committed_amount,
        allowed_amount: l.allowed_amount,
      }));

      const newBudget = await tx.budget.create({
        data: {
          name: name ? name.trim() : `${original.name} (Revised)`,
          period_start: original.period_start,
          period_end: original.period_end,
          responsible_contact_id: original.responsible_contact_id,
          status: 'DRAFT',
          revised_from_id: original.id,
          budget_lines: {
            create: revisedLines.map((line) => ({
              analytic_account_id: line.analytic_account_id,
              type: line.type || 'EXPENSE',
              committed_amount: parseFloat(line.committed_amount) || 0,
              allowed_amount: parseFloat(line.allowed_amount) || 0,
            })),
          },
        },
        include: {
          responsible_contact: true,
          revised_from: true,
          budget_lines: {
            include: {
              analytic_account: true,
            },
          },
        },
      });

      return this.formatBudget(newBudget);
    });
  }

  async cancel(id) {
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Budget not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        responsible_contact: true,
        budget_lines: {
          include: {
            analytic_account: true,
          },
        },
      },
    });

    return this.formatBudget(updated);
  }
}

module.exports = new BudgetsService();
