const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Only logged in users can access these routes
router.use(authenticate);

// Validation schema for creating/updating a contact
const contactSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['CUSTOMER', 'VENDOR', 'BOTH']),
  email: z.string().email().optional().nullable(),
  mobile: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable()
});

// GET all contacts
router.get('/', async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany();
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

// GET contact by ID
router.get('/:id', async (req, res, next) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// POST create contact (Admin or Accountant only)
router.post('/', authorize(['ADMIN', 'ACCOUNTANT']), async (req, res, next) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    const contact = await prisma.contact.create({ data: validatedData });
    res.status(201).json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
});

// PUT update contact (Admin or Accountant only)
router.put('/:id', authorize(['ADMIN', 'ACCOUNTANT']), async (req, res, next) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: validatedData
    });
    res.json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Contact not found' });
    next(error);
  }
});

// DELETE contact (Admin only)
router.delete('/:id', authorize(['ADMIN']), async (req, res, next) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Contact not found' });
    next(error);
  }
});

module.exports = router;
