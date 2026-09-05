const express = require('express');
const router = express.Router();
const controller = require('../controllers/contacts.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res, next) => controller.getAllContacts(req, res, next));
router.get('/:id', (req, res, next) => controller.getContactById(req, res, next));
router.post('/', authorize(['ADMIN', 'ACCOUNTANT']), (req, res, next) => controller.createContact(req, res, next));
router.put('/:id', authorize(['ADMIN', 'ACCOUNTANT']), (req, res, next) => controller.updateContact(req, res, next));
router.delete('/:id', authorize(['ADMIN']), (req, res, next) => controller.deleteContact(req, res, next));

module.exports = router;
