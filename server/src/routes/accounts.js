const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET all accounts (Chart of Accounts)
router.get('/', async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany();
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

// GET account by ID
router.get('/:id', async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id }
    });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
