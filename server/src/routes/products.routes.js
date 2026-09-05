const express = require('express');
const router = express.Router();
const controller = require('../controllers/products.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res, next) => controller.getAllProducts(req, res, next));
router.get('/:id', (req, res, next) => controller.getProductById(req, res, next));
router.post('/', authorize(['ADMIN', 'ACCOUNTANT', 'CONTACT']), (req, res, next) => controller.createProduct(req, res, next));
router.put('/:id', authorize(['ADMIN', 'ACCOUNTANT', 'CONTACT']), (req, res, next) => controller.updateProduct(req, res, next));
router.delete('/:id', authorize(['ADMIN']), (req, res, next) => controller.deleteProduct(req, res, next));

module.exports = router;
