const express = require("express");
const router = express.Router();
const controller = require("../controllers/analyticAccounts.controller");

router.post("/", (req, res, next) => controller.create(req, res, next));
router.get("/", (req, res, next) => controller.getAll(req, res, next));
router.get("/:id", (req, res, next) => controller.getById(req, res, next));
router.put("/:id", (req, res, next) => controller.update(req, res, next));
router.delete("/:id", (req, res, next) => controller.delete(req, res, next));

module.exports = router;
