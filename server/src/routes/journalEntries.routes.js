const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
const controller = require("../controllers/journals.controller");

router.get("/", (req, res, next) => controller.getJournalEntries(req, res, next));
router.get("/:id", (req, res, next) => controller.getJournalEntryById(req, res, next));
router.post("/", (req, res, next) => controller.createJournalEntry(req, res, next));

module.exports = router;
