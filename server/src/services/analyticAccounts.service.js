const prisma = require('../prisma');

class AnalyticAccountsService {
  async create({ name, type }) {
    const trimmedName = name.trim();
    const upperType = type.toUpperCase();

    return await prisma.analyticAccount.create({
      data: {
        name: trimmedName,
        type: upperType,
      },
    });
  }

  async getAll() {
    return await prisma.analyticAccount.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getById(id) {
    return await prisma.analyticAccount.findUnique({
      where: { id },
    });
  }

  async update(id, { name, type }) {
    const existing = await prisma.analyticAccount.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Analytic account not found');
      error.statusCode = 404;
      throw error;
    }

    const trimmedName = name.trim();
    const upperType = type.toUpperCase();

    return await prisma.analyticAccount.update({
      where: { id },
      data: {
        name: trimmedName,
        type: upperType,
      },
    });
  }

  async delete(id) {
    const existing = await prisma.analyticAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            budget_lines: true,
            purchase_order_lines: true,
            vendor_bill_lines: true,
            sales_order_lines: true,
            customer_invoice_lines: true,
          },
        },
      },
    });

    if (!existing) {
      const error = new Error('Analytic account not found');
      error.statusCode = 404;
      throw error;
    }

    const counts = existing._count || {};
    const totalReferences =
      (counts.budget_lines || 0) +
      (counts.purchase_order_lines || 0) +
      (counts.vendor_bill_lines || 0) +
      (counts.sales_order_lines || 0) +
      (counts.customer_invoice_lines || 0);

    if (totalReferences > 0) {
      const error = new Error(
        'Cannot delete analytic account as it is referenced in transactions or budgets'
      );
      error.statusCode = 400;
      throw error;
    }

    return await prisma.analyticAccount.delete({
      where: { id },
    });
  }
}

module.exports = new AnalyticAccountsService();
