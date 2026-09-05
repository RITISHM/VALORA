const express = require('express');
const router = express.Router();
const controller = require('../controllers/vendorBills.controller');

router.post('/', (req, res, next) => controller.create(req, res, next));
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));
router.post('/:id/confirm', (req, res, next) => controller.confirm(req, res, next));
router.post('/:id/pay', (req, res, next) => controller.pay(req, res, next));

module.exports = router;
