const prisma = require('../prisma');

class SalesService {
  async generateSONumber() {
    const count = await prisma.salesOrder.count();
    const num = (count + 1).toString().padStart(5, '0');
    return `S${num}`;
  }

  async create({ customer_id, so_date = new Date(), lines = [] }) {
    if (!customer_id) {
      const error = new Error('customer_id is required');
      error.statusCode = 400;
      throw error;
    }

    const so_number = await this.generateSONumber();

    const formattedLines = lines.map((line) => {
      const qty = parseFloat(line.qty) || 1.0;
      const unit_price = parseFloat(line.unit_price) || 0.0;
      const total = Math.round(qty * unit_price * 100) / 100;

      return {
        product_id: line.product_id,
        analytic_account_id: line.analytic_account_id || null,
        qty,
        unit_price,
        total,
      };
    });

    return await prisma.salesOrder.create({
      data: {
        so_number,
        customer_id,
        so_date: new Date(so_date),
        status: 'DRAFT',
        lines: {
          create: formattedLines,
        },
      },
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }

  async getAll() {
    return await prisma.salesOrder.findMany({
      orderBy: {
        so_date: 'desc',
      },
      include: {
        customer: true,
        customer_invoices: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }

  async getById(id) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        customer_invoices: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });

    if (!so) {
      const error = new Error('Sales Order not found');
      error.statusCode = 404;
      throw error;
    }

    return so;
  }

  async confirm(id) {
    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Sales Order not found');
      error.statusCode = 404;
      throw error;
    }

    return await prisma.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }
}

module.exports = new SalesService();
