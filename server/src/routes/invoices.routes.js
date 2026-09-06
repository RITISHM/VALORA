const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
const controller = require("../controllers/invoices.controller");

router.post("/", (req, res, next) => controller.create(req, res, next));
router.get("/", (req, res, next) => controller.getAll(req, res, next));
router.get("/:id", (req, res, next) => controller.getById(req, res, next));
router.post("/:id/confirm", (req, res, next) => controller.confirm(req, res, next));
router.post("/:id/pay", (req, res, next) => controller.pay(req, res, next));
router.delete("/:id", (req, res, next) => controller.delete(req, res, next));

module.exports = router;
