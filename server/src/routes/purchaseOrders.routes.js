const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseOrders.controller");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);

router.post("/", (req, res, next) => controller.create(req, res, next));
router.get("/", (req, res, next) => controller.getAll(req, res, next));
router.get("/:id", (req, res, next) => controller.getById(req, res, next));
router.post("/:id/confirm", (req, res, next) => controller.confirm(req, res, next));
router.delete("/:id", (req, res, next) => controller.delete(req, res, next));

module.exports = router;
