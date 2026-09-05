const express = require('express');
const router = express.Router();
const controller = require('../controllers/journals.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res, next) => controller.getJournals(req, res, next));
router.get('/entries', (req, res, next) => controller.getJournalEntries(req, res, next));
router.get('/entries/:id', (req, res, next) => controller.getJournalEntryById(req, res, next));
router.post('/entries', (req, res, next) => controller.createJournalEntry(req, res, next));

router.get('/:id', (req, res, next) => controller.getJournalById(req, res, next));
router.post('/', authorize(['ADMIN']), (req, res, next) => controller.createJournal(req, res, next));
router.put('/:id', authorize(['ADMIN']), (req, res, next) => controller.updateJournal(req, res, next));

module.exports = router;
