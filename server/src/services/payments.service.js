const prisma = require("../prisma");
const accountingService = require("./accounting.service");

class PaymentsService {
  /**
   * Register Payment for Customer Invoice:
   * 1. Create Payment record
   * 2. Update Invoice status -> PAID
   * 3. Auto-posts Journal Entry (Dr Bank/Cash / Cr Debtors)
   */
  async payInvoice(invoiceId, { method = "BANK", amount, payment_date = new Date() }) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      const error = new Error("Customer Invoice not found");
      error.statusCode = 404;
      throw error;
    }

    const payAmount = parseFloat(amount) || invoice.total;
    const paymentMethod = method.toUpperCase() === "CASH" ? "CASH" : "BANK";

    // 1. Find Journals & Accounts (in parallel)
    const journalType = paymentMethod === "CASH" ? "CASH" : "BANK";
    const [journal, cashOrBankAccount, debtorsAccount] = await Promise.all([
      prisma.journal.findFirst({ where: { type: journalType } }),
      prisma.account.findFirst({
        where: { name: paymentMethod === "CASH" ? "Cash" : "Bank" },
      }),
      prisma.account.findFirst({ where: { name: "Debtors" } }),
    ]);

    if (!journal || !cashOrBankAccount || !debtorsAccount) {
      const error = new Error(`Required accounts/journals for ${paymentMethod} payment missing`);
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          type: "RECEIVE",
          partner_id: invoice.customer_id,
          amount: payAmount,
          method: paymentMethod,
          against_type: "INVOICE",
          against_id: invoice.id,
          status: "CONFIRMED",
        },
        include: {
          partner: true,
        },
      });

      // Update Invoice status -> PAID
      await tx.customerInvoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" },
      });

      // Auto-post Journal Entry: Dr Cash/Bank (amount), Cr Debtors (amount)
      await accountingService.postJournalEntry({
        journalId: journal.id,
        reference: `Payment for Invoice ${invoice.invoice_number}`,
        entryDate: payment_date,
        lines: [
          {
            accountId: cashOrBankAccount.id,
            partnerId: null,
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

      return payment;
    });
  }


  async createPayment({ payment_type, partner_id, payment_via, date, amount, note }) {
    if (!partner_id || !amount) {
      const error = new Error("Partner and amount are required");
      error.statusCode = 400;
      throw error;
    }

    const payAmount = parseFloat(amount);
    const paymentMethod = (payment_via || "BANK").toUpperCase();
    const type = (payment_type || "RECEIVE").toUpperCase();

    // 1. Find Journals & Accounts (in parallel)
    const journalType = paymentMethod === "CASH" ? "CASH" : "BANK";
    const [journal, cashOrBankAccount, partnerAccount] = await Promise.all([
      prisma.journal.findFirst({ where: { type: journalType } }),
      prisma.account.findFirst({
        where: { name: paymentMethod === "CASH" ? "Cash" : "Bank" },
      }),
      prisma.account.findFirst({ where: { name: type === "RECEIVE" ? "Debtors" : "Creditors" } }),
    ]);

    if (!journal || !cashOrBankAccount || !partnerAccount) {
      const error = new Error("Required accounts/journals missing");
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          type,
          partner_id,
          amount: payAmount,
          method: paymentMethod,
          status: "CONFIRMED",
        },
        include: {
          partner: true,
        },
      });

      const lines = type === "RECEIVE" ? [
        { accountId: cashOrBankAccount.id, partnerId: null, debit: payAmount, credit: 0 },
        { accountId: partnerAccount.id, partnerId, debit: 0, credit: payAmount },
      ] : [
        { accountId: partnerAccount.id, partnerId, debit: payAmount, credit: 0 },
        { accountId: cashOrBankAccount.id, partnerId: null, debit: 0, credit: payAmount },
      ];

      await accountingService.postJournalEntry({
        journalId: journal.id,
        reference: `Manual Payment ${note ? '- ' + note : ''}`.trim(),
        entryDate: date ? new Date(date) : new Date(),
        lines,
      });

      return payment;
    });
  }

  async getAll() {
    return await prisma.payment.findMany({
      orderBy: { id: "desc" },
      include: { partner: true },
    });
  }
}

module.exports = new PaymentsService();
