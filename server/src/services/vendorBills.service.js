const prisma = require("../prisma");
const accountingService = require("./accounting.service");

class VendorBillsService {
  async generateBillNumber() {
    const count = await prisma.vendorBill.count();
    const year = new Date().getFullYear();
    const num = (count + 1).toString().padStart(5, "0");
    return `BILL/${year}/${num}`;
  }

  /**
   * Create a vendor bill.
   * @param vendor_id        - Required: the vendor contact ID
   * @param bill_reference   - Optional: user-provided external reference (e.g. vendor's own invoice number)
   * @param bill_date        - Bill date
   * @param due_date         - Payment due date
   * @param po_id            - Optional: linked Purchase Order ID
   * @param lines            - Bill line items
   */
  async create({ vendor_id, po_id, bill_date = new Date(), due_date, bill_reference: userRef, lines = [] }) {
    if (!vendor_id) {
      const error = new Error("vendor_id is required");
      error.statusCode = 400;
      throw error;
    }

    // Auto-generate the internal bill number; user's external reference stored separately
    const autoNumber = await this.generateBillNumber();
    // bill_reference in the schema stores the auto number; user ref is prefixed if provided
    const bill_reference = userRef ? `${userRef} (${autoNumber})` : autoNumber;

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

    return await prisma.vendorBill.create({
      data: {
        // bill_reference in schema = user's external reference (or auto-number if not provided)
        bill_reference,
        po_id: po_id || null,
        vendor_id,
        bill_date: new Date(bill_date),
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
        vendor: true,
        po: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }

  /**
   * Return the internal bill number for a bill.
   * Since the schema only has bill_reference, we generate a display-safe
   * bill number from the creation index.
   */
  getBillDisplayNumber(bill) {
    // If bill_reference looks like our auto format (BILL/YYYY/NNNNN), use it as the bill number
    // Otherwise use it as the external reference and generate a positional ID
    return bill.bill_reference || bill.id.slice(0, 8).toUpperCase();
  }

  async getAll() {
    return await prisma.vendorBill.findMany({
      orderBy: { bill_date: "desc" },
      include: { vendor: true, po: true }
    });
  }

  async getById(id) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: {
        vendor: true,
        po: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });

    if (!bill) {
      const error = new Error("Vendor Bill not found");
      error.statusCode = 404;
      throw error;
    }

    return bill;
  }

  async confirm(id) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: {
        vendor: true,
        lines: {
          include: { product: true },
        },
      },
    });

    if (!bill) {
      const error = new Error("Vendor Bill not found");
      error.statusCode = 404;
      throw error;
    }

    if (bill.status === "CONFIRMED" || bill.status === "PAID") {
      const error = new Error(`Vendor Bill is already ${bill.status}`);
      error.statusCode = 400;
      throw error;
    }

    // 1. Transactionally update status to CONFIRMED and add PURCHASE stock movements for GOODS
    await prisma.$transaction(async (tx) => {
      await tx.vendorBill.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });

      // Batch create stock movements for GOODS products
      const stockMovements = bill.lines
        .filter((line) => line.product && line.product.type === "GOODS")
        .map((line) => ({
          product_id: line.product_id,
          quantity: line.qty,
          type: "PURCHASE",
          reference: bill.bill_reference || bill.id,
        }));

      if (stockMovements.length > 0) {
        await tx.stockMovement.createMany({ data: stockMovements });
      }
    });

    // 2. Post double-entry Journal Entry: Dr Purchase Expense, Dr Input Tax, Cr Creditors (parallel lookups)
    const [purchaseJournal, purchaseExpenseAccount, creditorsAccount, inputTaxAccount] = await Promise.all([
      prisma.journal.findFirst({ where: { type: "PURCHASE" } }),
      prisma.account.findFirst({ where: { name: "Purchase Expense A/c" } }),
      prisma.account.findFirst({ where: { name: "Creditors A/c" } }),
      prisma.account.findFirst({ where: { name: "Input Tax A/c" } }),
    ]);

    if (!purchaseJournal || !purchaseExpenseAccount || !creditorsAccount) {
      const error = new Error(
        "Required accounts (Purchase Expense A/c, Creditors A/c) or Purchase Journal missing",
      );
      error.statusCode = 400;
      throw error;
    }

    const journalLines = [
      {
        accountId: purchaseExpenseAccount.id,
        partnerId: null,
        debit: bill.subtotal,
        credit: 0,
      },
      {
        accountId: creditorsAccount.id,
        partnerId: bill.vendor_id,
        debit: 0,
        credit: bill.total,
      },
    ];

    if (bill.tax_amount > 0 && inputTaxAccount) {
      journalLines.push({
        accountId: inputTaxAccount.id,
        partnerId: null,
        debit: bill.tax_amount,
        credit: 0,
      });
    }

    await accountingService.postJournalEntry({
      journalId: purchaseJournal.id,
      reference: `Vendor Bill ${bill.bill_reference}`,
      entryDate: bill.bill_date,
      lines: journalLines,
    });

    return await this.getById(id);
  }

  async pay(id, { method = "BANK", amount }) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!bill) {
      const error = new Error("Vendor Bill not found");
      error.statusCode = 404;
      throw error;
    }

    const payAmount = parseFloat(amount) || bill.total;
    const paymentMethod = method.toUpperCase() === "CASH" ? "CASH" : "BANK";

    const journalType = paymentMethod === "CASH" ? "CASH" : "BANK";
    const journal = await prisma.journal.findFirst({ where: { type: journalType } });
    const cashOrBankAccount = await prisma.account.findFirst({
      where: { name: paymentMethod === "CASH" ? "Cash A/c" : "Bank A/c" },
    });
    const creditorsAccount = await prisma.account.findFirst({ where: { name: "Creditors A/c" } });

    if (!journal || !cashOrBankAccount || !creditorsAccount) {
      const error = new Error("Required payment accounts missing");
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          type: "SEND",
          partner_id: bill.vendor_id,
          amount: payAmount,
          method: paymentMethod,
          against_type: "BILL",
          against_id: bill.id,
          status: "CONFIRMED",
        },
        include: { partner: true },
      });

      await tx.vendorBill.update({
        where: { id },
        data: { status: "PAID" },
      });

      // Journal entry: Dr Creditors (amount), Cr Cash/Bank (amount)
      await accountingService.postJournalEntry({
        journalId: journal.id,
        reference: `Payment for Vendor Bill ${bill.bill_reference}`,
        entryDate: new Date(),
        lines: [
          {
            accountId: creditorsAccount.id,
            partnerId: bill.vendor_id,
            debit: payAmount,
            credit: 0,
          },
          {
            accountId: cashOrBankAccount.id,
            partnerId: null,
            debit: 0,
            credit: payAmount,
          },
        ],
      });

      return payment;
    });
  }
}

module.exports = new VendorBillsService();
