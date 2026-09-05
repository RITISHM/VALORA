const express = require("express");
const router = express.Router();
const controller = require("../controllers/sales.controller");

router.post("/", (req, res, next) => controller.create(req, res, next));
router.get("/", (req, res, next) => controller.getAll(req, res, next));
router.get("/:id", (req, res, next) => controller.getById(req, res, next));
router.post("/:id/confirm", (req, res, next) => controller.confirm(req, res, next));
router.post("/:id/create-invoice", (req, res, next) => controller.createInvoice(req, res, next));

module.exports = router;
