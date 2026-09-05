const express = require("express");
const router = express.Router();
const controller = require("../controllers/portal.controller");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Public portal login
router.post("/login", (req, res, next) => controller.login(req, res, next));

// Protected contact portal routes
router.use(authenticateToken);
router.use(requireRole("CONTACT"));

router.get("/invoices", (req, res, next) => controller.getInvoices(req, res, next));
router.get("/invoices/:id", (req, res, next) => controller.getInvoiceById(req, res, next));
router.get("/bills", (req, res, next) => controller.getBills(req, res, next));
router.get("/bills/:id", (req, res, next) => controller.getBillById(req, res, next));
router.get("/outstanding", (req, res, next) => controller.getOutstanding(req, res, next));
router.post("/invoices/:id/pay", (req, res, next) => controller.payInvoice(req, res, next));
router.post("/invoices/:id/razorpay-order", (req, res, next) =>
  controller.createRazorpayOrder(req, res, next),
);
router.post("/bills/:id/pay", (req, res, next) => controller.payBill(req, res, next));
router.post("/checkout", (req, res, next) => controller.checkout(req, res, next));

module.exports = router;
