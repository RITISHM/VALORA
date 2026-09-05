const express = require('express');
const router = express.Router();
const controller = require('../controllers/reports.controller');

router.get('/balance-sheet', (req, res, next) => controller.getBalanceSheet(req, res, next));
router.get('/profit-and-loss', (req, res, next) => controller.getProfitAndLoss(req, res, next));
router.get('/budget', (req, res, next) => controller.getBudgetReport(req, res, next));

module.exports = router;
