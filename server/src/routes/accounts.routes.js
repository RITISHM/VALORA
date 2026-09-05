const express = require("express");
const router = express.Router();
const controller = require("../controllers/accounts.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", (req, res, next) => controller.getAllAccounts(req, res, next));
router.post("/", (req, res, next) => controller.createAccount(req, res, next));
router.get("/:id", (req, res, next) => controller.getAccountById(req, res, next));

module.exports = router;
