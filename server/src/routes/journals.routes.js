const express = require('express');
const router = express.Router();
const controller = require('../controllers/journals.controller');

router.get('/', (req, res, next) => controller.getJournals(req, res, next));
if (controller.getJournalById) {
  router.get('/:id', (req, res, next) => controller.getJournalById(req, res, next));
}
if (controller.createJournal) {
  router.post('/', (req, res, next) => controller.createJournal(req, res, next));
}
if (controller.updateJournal) {
  router.put('/:id', (req, res, next) => controller.updateJournal(req, res, next));
}

module.exports = router;
