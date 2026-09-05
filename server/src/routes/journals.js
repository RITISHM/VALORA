const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

const journalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SALES', 'PURCHASE', 'BANK', 'CASH']),
  default_account_id: z.string().uuid()
});

// GET all journals
router.get('/', async (req, res, next) => {
  try {
    const journals = await prisma.journal.findMany({
      include: { default_account: true }
    });
    res.json(journals);
  } catch (error) {
    next(error);
  }
});

// GET journal by ID
router.get('/:id', async (req, res, next) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { id: req.params.id },
      include: { default_account: true }
    });
    if (!journal) return res.status(404).json({ error: 'Journal not found' });
    res.json(journal);
  } catch (error) {
    next(error);
  }
});

// POST create journal (Admin only)
router.post('/', authorize(['ADMIN']), async (req, res, next) => {
  try {
    const validatedData = journalSchema.parse(req.body);
    const journal = await prisma.journal.create({ data: validatedData });
    res.status(201).json(journal);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// PUT update journal (Admin only)
router.put('/:id', authorize(['ADMIN']), async (req, res, next) => {
  try {
    const validatedData = journalSchema.parse(req.body);
    const journal = await prisma.journal.update({
      where: { id: req.params.id },
      data: validatedData
    });
    res.json(journal);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Journal not found' });
    next(error);
  }
});

module.exports = router;
