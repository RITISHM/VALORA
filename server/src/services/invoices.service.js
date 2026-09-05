const prisma = require('../prisma');
const accountingService = require('./accounting.service');

class InvoicesService {
  async generateInvoiceNumber() {
    const count = await prisma.customerInvoice.count();
    const num = (count + 1).toString().padStart(5, '0');
    return `INV${num}`;
  }

  async create({ customer_id, so_id, invoice_date = new Date(), due_date, lines = [] }) {
    if (!customer_id) {
      const error = new Error('customer_id is required');
      error.statusCode = 400;
      throw error;
    }

    const invoice_number = await this.generateInvoiceNumber();

    let grandTotal = 0;
    const formattedLines = lines.map((line) => {
      const qty = parseFloat(line.qty) || 1.0;
      const unit_price = parseFloat(line.unit_price) || 0.0;
      const total = Math.round(qty * unit_price * 100) / 100;
      grandTotal += total;

      return {
        product_id: line.product_id,
        analytic_account_id: line.analytic_account_id || null,
        qty,
        unit_price,
        total,
      };
    });

    grandTotal = Math.round(grandTotal * 100) / 100;

    return await prisma.customerInvoice.create({
      data: {
        invoice_number,
        so_id: so_id || null,
        customer_id,
        invoice_date: new Date(invoice_date),
        due_date: due_date ? new Date(due_date) : null,
        status: 'DRAFT',
        total: grandTotal,
        lines: {
          create: formattedLines,
        },
      },
      include: {
        customer: true,
        so: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }

  async createFromSO(soId) {
    const so = await prisma.salesOrder.findUnique({
      where: { id: soId },
      include: { lines: true },
    });

    if (!so) {
      const error = new Error('Sales Order not found');
      error.statusCode = 404;
      throw error;
    }

    const lines = so.lines.map((l) => ({
      product_id: l.product_id,
      analytic_account_id: l.analytic_account_id,
      qty: l.qty,
      unit_price: l.unit_price,
    }));

    return await this.create({
      customer_id: so.customer_id,
      so_id: so.id,
      invoice_date: new Date(),
      lines,
    });
  }

  async getAll() {
    return await prisma.customerInvoice.findMany({
      orderBy: {
        invoice_date: 'desc',
      },
      include: {
        customer: true,
        so: true,
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
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        so: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });

    if (!invoice) {
      const error = new Error('Customer Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  }

  /**
   * Confirm Customer Invoice:
   * 1. Status -> CONFIRMED
   * 2. Auto-posts Journal Entry (Dr Debtors / Cr Sales Income)
   * 3. Rolls up line amounts to tagged Analytic Accounts in active Budgets
   */
  async confirm(id) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (!invoice) {
      const error = new Error('Customer Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status === 'CONFIRMED' || invoice.status === 'PAID') {
      const error = new Error(`Invoice is already ${invoice.status}`);
      error.statusCode = 400;
      throw error;
    }

    // 1. Find or create Sales Journal & Accounts (Debtors, Sales Income)
    const salesJournal = await prisma.journal.findFirst({
      where: { type: 'SALES' },
    });
    const debtorsAccount = await prisma.account.findFirst({
      where: { name: 'Debtors' },
    });
    const salesIncomeAccount = await prisma.account.findFirst({
      where: { name: 'Sales Income' },
    });

    if (!salesJournal || !debtorsAccount || !salesIncomeAccount) {
      const error = new Error('Required Chart of Accounts (Debtors, Sales Income) or Sales Journal missing');
      error.statusCode = 400;
      throw error;
    }

    // 2. Post Journal Entry: Dr Debtors (invoice.total), Cr Sales Income (invoice.total)
    await accountingService.postJournalEntry({
      journalId: salesJournal.id,
      reference: `Invoice ${invoice.invoice_number}`,
      entryDate: invoice.invoice_date,
      lines: [
        {
          accountId: debtorsAccount.id,
          partnerId: invoice.customer_id,
          debit: invoice.total,
          credit: 0,
        },
        {
          accountId: salesIncomeAccount.id,
          partnerId: null,
          debit: 0,
          credit: invoice.total,
        },
      ],
    });

    // 3. Roll up amounts into tagged Analytic Account Budget Lines
    for (const line of invoice.lines) {
      if (line.analytic_account_id) {
        await prisma.budgetLine.updateMany({
          where: {
            analytic_account_id: line.analytic_account_id,
            budget: {
              status: { in: ['DRAFT', 'CONFIRMED'] },
            },
          },
          data: {
            committed_amount: {
              increment: line.total,
            },
          },
        });
      }
    }

    // 4. Update status to CONFIRMED
    return await prisma.customerInvoice.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        customer: true,
        so: true,
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

module.exports = new InvoicesService();
