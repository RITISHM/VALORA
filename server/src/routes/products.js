const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

const productSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['GOODS', 'SERVICE', 'COMBO']),
  category: z.string().optional().nullable(),
  sales_price: z.number().min(0).default(0.0),
  cost: z.number().min(0).default(0.0)
});

// GET all products
router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// POST create product (Admin or Accountant only)
router.post('/', authorize(['ADMIN', 'ACCOUNTANT']), async (req, res, next) => {
  try {
    const validatedData = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: validatedData });
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// PUT update product (Admin or Accountant only)
router.put('/:id', authorize(['ADMIN', 'ACCOUNTANT']), async (req, res, next) => {
  try {
    const validatedData = productSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: validatedData
    });
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    next(error);
  }
});

// DELETE product (Admin only)
router.delete('/:id', authorize(['ADMIN']), async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    next(error);
  }
});

module.exports = router;
