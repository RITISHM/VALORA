const accountingService = require("../services/accounting.service");
const { z } = require("zod");

const journalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["SALES", "PURCHASE", "BANK", "CASH"]),
  default_account_id: z.string().uuid(),
});

class JournalsController {
  async getJournals(req, res, next) {
    try {
      const journals = await accountingService.getJournals();
      return res.status(200).json(journals);
    } catch (err) {
      next(err);
    }
  }

  async getJournalById(req, res, next) {
    try {
      const journal = await accountingService.getJournalById(req.params.id);
      return res.status(200).json(journal);
    } catch (err) {
      next(err);
    }
  }

  async createJournal(req, res, next) {
    try {
      const validatedData = journalSchema.parse(req.body);
      const journal = await accountingService.createJournal(validatedData);
      return res.status(201).json(journal);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
      next(err);
    }
  }

  async updateJournal(req, res, next) {
    try {
      const validatedData = journalSchema.parse(req.body);
      const journal = await accountingService.updateJournal(req.params.id, validatedData);
      return res.status(200).json(journal);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
      next(err);
    }
  }

  async getJournalEntries(req, res, next) {
    try {
      const entries = await accountingService.getJournalEntries();
      return res.status(200).json(entries);
    } catch (err) {
      next(err);
    }
  }

  async getJournalEntryById(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await accountingService.getJournalEntryById(id);
      return res.status(200).json(entry);
    } catch (err) {
      next(err);
    }
  }

  async createJournalEntry(req, res, next) {
    try {
      const { journalId, reference, entryDate, lines, status } = req.body;
      const entry = await accountingService.postJournalEntry({
        journalId,
        reference,
        entryDate,
        lines,
        status,
      });
      return res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new JournalsController();
