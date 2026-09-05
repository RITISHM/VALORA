const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgets.controller');

router.post('/', (req, res, next) => controller.create(req, res, next));
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));
router.put('/:id', (req, res, next) => controller.update(req, res, next));
router.post('/:id/confirm', (req, res, next) => controller.confirm(req, res, next));
router.post('/:id/revise', (req, res, next) => controller.revise(req, res, next));
router.post('/:id/cancel', (req, res, next) => controller.cancel(req, res, next));

module.exports = router;
