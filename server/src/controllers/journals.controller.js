const accountingService = require('../services/accounting.service');

class JournalsController {
  async getJournals(req, res, next) {
    try {
      const journals = await accountingService.getJournals();
      return res.status(200).json(journals);
    } catch (err) {
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
