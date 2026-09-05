const express = require("express");
const router = express.Router();
const controller = require("../controllers/payments.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", (req, res, next) => controller.getAll(req, res, next));
router.post("/", (req, res, next) => controller.create(req, res, next));

module.exports = router;
