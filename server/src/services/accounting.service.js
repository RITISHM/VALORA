const prisma = require('../prisma');

class AccountingService {
  /**
   * Auto-posts a double-entry Journal Entry.
   * Ensures sum(debit) === sum(credit).
   */
  async postJournalEntry({ journalId, reference, entryDate = new Date(), lines = [], status = 'POSTED' }) {
    if (!journalId) {
      const error = new Error('Journal ID is required');
      error.statusCode = 400;
      throw error;
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      const error = new Error('Journal entry must contain at least one line');
      error.statusCode = 400;
      throw error;
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const formattedLines = lines.map((line) => {
      const debit = Math.round((parseFloat(line.debit) || 0) * 100) / 100;
      const credit = Math.round((parseFloat(line.credit) || 0) * 100) / 100;

      totalDebit += debit;
      totalCredit += credit;

      return {
        account_id: line.accountId,
        partner_id: line.partnerId || null,
        debit,
        credit,
      };
    });

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    // Hard Rule: sum(debit) must equal sum(credit)
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      const error = new Error(
        `Double-entry imbalance: Total debit (${totalDebit}) must equal total credit (${totalCredit})`
      );
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          journal_id: journalId,
          reference,
          entry_date: new Date(entryDate),
          status,
          journal_items: {
            create: formattedLines,
          },
        },
        include: {
          journal: true,
          journal_items: {
            include: {
              account: true,
              partner: true,
            },
          },
        },
      });

      return entry;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  async getJournals() {
    return await prisma.journal.findMany({
      include: {
        default_account: true,
      },
    });
  }

  async getJournalById(id) {
    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { default_account: true },
    });
    if (!journal) {
      const error = new Error('Journal not found');
      error.statusCode = 404;
      throw error;
    }
    return journal;
  }

  async createJournal(data) {
    return await prisma.journal.create({ data });
  }

  async updateJournal(id, data) {
    try {
      return await prisma.journal.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2025') {
        const err = new Error('Journal not found');
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }
  }

  async getJournalEntries() {
    return await prisma.journalEntry.findMany({
      orderBy: {
        entry_date: 'desc',
      },
      include: {
        journal: true,
        journal_items: {
          include: {
            account: true,
            partner: true,
          },
        },
      },
    });
  }

  async getJournalEntryById(id) {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        journal: true,
        journal_items: {
          include: {
            account: true,
            partner: true,
          },
        },
      },
    });

    if (!entry) {
      const error = new Error('Journal entry not found');
      error.statusCode = 404;
      throw error;
    }

    return entry;
  }
}

module.exports = new AccountingService();
