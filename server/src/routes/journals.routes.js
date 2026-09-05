const express = require('express');
const router = express.Router();
const controller = require('../controllers/journals.controller');

router.get('/journals', (req, res, next) => controller.getJournals(req, res, next));
router.get('/journal-entries', (req, res, next) => controller.getJournalEntries(req, res, next));
router.get('/journal-entries/:id', (req, res, next) => controller.getJournalEntryById(req, res, next));
router.post('/journal-entries', (req, res, next) => controller.createJournalEntry(req, res, next));

module.exports = router;
