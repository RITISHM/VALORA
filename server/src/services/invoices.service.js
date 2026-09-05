const prisma = require("../prisma");
const accountingService = require("./accounting.service");
const inventoryService = require("./inventory.service");

class InvoicesService {
  async generateInvoiceNumber() {
    const count = await prisma.customerInvoice.count();
    const num = (count + 1).toString().padStart(5, "0");
    return `INV${num}`;
  }

  async create({ customer_id, so_id, invoice_date = new Date(), due_date, lines = [] }) {
    if (!customer_id) {
      const error = new Error("customer_id is required");
      error.statusCode = 400;
      throw error;
    }

    const invoice_number = await this.generateInvoiceNumber();

    let docSubtotal = 0;
    let docTaxAmount = 0;

    const formattedLines = lines.map((line) => {
      const qty = parseFloat(line.qty) || 1.0;
      const unit_price = parseFloat(line.unit_price) || 0.0;
      const tax_rate = parseFloat(line.tax_rate) || 0.0;

      if (tax_rate < 0) {
        const error = new Error("Tax rate cannot be negative");
        error.statusCode = 400;
        throw error;
      }

      const lineSubtotal = Math.round(qty * unit_price * 100) / 100;
      const lineTax = Math.round(lineSubtotal * (tax_rate / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

      docSubtotal += lineSubtotal;
      docTaxAmount += lineTax;

      return {
        product_id: line.product_id,
        analytic_account_id: line.analytic_account_id || null,
        qty,
        unit_price,
        tax_rate,
        tax_amount: lineTax,
        total: lineTotal,
      };
    });

    docSubtotal = Math.round(docSubtotal * 100) / 100;
    docTaxAmount = Math.round(docTaxAmount * 100) / 100;
    const docTotal = Math.round((docSubtotal + docTaxAmount) * 100) / 100;

    return await prisma.customerInvoice.create({
      data: {
        invoice_number,
        so_id: so_id || null,
        customer_id,
        invoice_date: new Date(invoice_date),
        due_date: due_date ? new Date(due_date) : null,
        status: "DRAFT",
        subtotal: docSubtotal,
        tax_amount: docTaxAmount,
        total: docTotal,
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
      const error = new Error("Sales Order not found");
      error.statusCode = 404;
      throw error;
    }

    const lines = so.lines.map((l) => ({
      product_id: l.product_id,
      analytic_account_id: l.analytic_account_id,
      qty: l.qty,
      unit_price: l.unit_price,
      tax_rate: l.tax_rate || 0,
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
        invoice_date: "desc",
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
      const error = new Error("Customer Invoice not found");
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  }

  /**
   * Confirm Customer Invoice:
   * 1. Check stock availability for GOODS products.
   * 2. Transactionally update status to CONFIRMED and create SALE stock movements.
   * 3. Auto-posts Journal Entry (Dr Debtors / Cr Sales Income / Cr Tax Payable).
   * 4. Updates budget lines.
   */
  async confirm(id) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      const error = new Error("Customer Invoice not found");
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status === "CONFIRMED" || invoice.status === "PAID") {
      const error = new Error(`Invoice is already ${invoice.status}`);
      error.statusCode = 400;
      throw error;
    }

    // 1. Check stock availability for GOODS products before confirmation
    await inventoryService.checkStockAvailability(invoice.lines);

    // 2. Perform DB transaction for Status update & Stock movements
    await prisma.$transaction(
      async (tx) => {
        await tx.customerInvoice.update({
          where: { id },
          data: { status: "CONFIRMED" },
        });

        // Batch deduct stock for GOODS products
        const stockMovements = invoice.lines
          .filter((line) => line.product && line.product.type === "GOODS")
          .map((line) => ({
            product_id: line.product_id,
            quantity: line.qty,
            type: "SALE",
            reference: invoice.invoice_number,
          }));

        if (stockMovements.length > 0) {
          await tx.stockMovement.createMany({ data: stockMovements });
        }
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );

    // 3. Find or create Chart of Accounts & Sales Journal (in parallel)
    const [salesJournal, debtorsAccount, salesIncomeAccount, taxPayableAccountResult] =
      await Promise.all([
        prisma.journal.findFirst({ where: { type: "SALES" } }),
        prisma.account.findFirst({ where: { name: "Debtors" } }),
        prisma.account.findFirst({ where: { name: "Sales Income" } }),
        prisma.account.findFirst({ where: { name: "Tax Payable" } }),
      ]);

    let taxPayableAccount = taxPayableAccountResult;

    if (!taxPayableAccount && invoice.tax_amount > 0) {
      taxPayableAccount = await prisma.account.create({
        data: { name: "Tax Payable", type: "LIABILITY" },
      });
    }

    if (!salesJournal || !debtorsAccount || !salesIncomeAccount) {
      const error = new Error(
        "Required Chart of Accounts (Debtors, Sales Income) or Sales Journal missing",
      );
      error.statusCode = 400;
      throw error;
    }

    // Build Journal Items
    const journalLines = [
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
        credit: invoice.subtotal,
      },
    ];

    if (invoice.tax_amount > 0 && taxPayableAccount) {
      journalLines.push({
        accountId: taxPayableAccount.id,
        partnerId: null,
        debit: 0,
        credit: invoice.tax_amount,
      });
    }

    // Auto-post Journal Entry
    await accountingService.postJournalEntry({
      journalId: salesJournal.id,
      reference: `Invoice ${invoice.invoice_number}`,
      entryDate: invoice.invoice_date,
      lines: journalLines,
    });

    // 4. Update Budget lines rollup
    for (const line of invoice.lines) {
      if (line.analytic_account_id) {
        await prisma.budgetLine.updateMany({
          where: {
            analytic_account_id: line.analytic_account_id,
            budget: {
              status: { in: ["DRAFT", "CONFIRMED"] },
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

    return await this.getById(id);
  }

  /**
   * Register Payment for Customer Invoice
   * Updates status to PAID and creates payment journal entry
   */
  async pay(id, { method = "BANK", amount }) {
    const invoice = await this.getById(id);

    if (invoice.status === "PAID") {
      const error = new Error("Invoice is already paid");
      error.statusCode = 400;
      throw error;
    }

    if (invoice.status === "DRAFT") {
      // Auto-confirm if it was draft
      await this.confirm(id);
    }

    const payAmount = parseFloat(amount) || invoice.total;

    // Perform DB transaction for Status update
    await prisma.$transaction(
      async (tx) => {
        await tx.customerInvoice.update({
          where: { id },
          data: { status: "PAID" },
        });
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );

    // Auto-post Payment Journal Entry (parallel lookups)
    const [bankJournal, cashJournal, debtorsAccount, bankAccount] = await Promise.all([
      prisma.journal.findFirst({ where: { type: "BANK" } }),
      prisma.journal.findFirst({ where: { type: "CASH" } }),
      prisma.account.findFirst({ where: { name: "Debtors" } }),
      prisma.account.findFirst({ where: { name: "Bank/Cash" } }),
    ]);

    const journal = method === "CASH" ? cashJournal || bankJournal : bankJournal;

    if (journal && debtorsAccount && bankAccount) {
      await accountingService.postJournalEntry({
        journalId: journal.id,
        reference: `Payment for INV ${invoice.invoice_number}`,
        entryDate: new Date(),
        lines: [
          {
            accountId: bankAccount.id,
            partnerId: invoice.customer_id,
            debit: payAmount,
            credit: 0,
          },
          {
            accountId: debtorsAccount.id,
            partnerId: invoice.customer_id,
            debit: 0,
            credit: payAmount,
          },
        ],
      });
    }

    return await this.getById(id);
  }
}

module.exports = new InvoicesService();
