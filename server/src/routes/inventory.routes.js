const express = require("express");
const router = express.Router();
const controller = require("../controllers/inventory.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/stock", (req, res, next) => controller.getStock(req, res, next));
router.get("/stock/:productId", (req, res, next) => controller.getStockByProduct(req, res, next));
router.get("/movements", (req, res, next) => controller.getMovements(req, res, next));

module.exports = router;
