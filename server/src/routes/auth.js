const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

const signupSchema = z.object({
  name: z.string().min(1),
  login_id: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, "Password must have uppercase, lowercase, and special character"),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'CONTACT']),
  contact_id: z.string().optional()
});

router.post('/signup', async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { login_id: validatedData.login_id },
          { email: validatedData.email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this login ID or email already exists' });
    }

    const password_hash = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        login_id: validatedData.login_id,
        email: validatedData.email,
        password_hash,
        role: validatedData.role,
        contact_id: validatedData.contact_id || null
      }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, contact_id: user.contact_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ user: { id: user.id, name: user.name, role: user.role }, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

const loginSchema = z.object({
  login_id: z.string(),
  password: z.string()
});

router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { login_id: validatedData.login_id }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(validatedData.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, contact_id: user.contact_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ user: { id: user.id, name: user.name, role: user.role }, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    next(error);
  }
});

const { authenticateToken } = require('../middleware/role');

router.put('/me', authenticateToken, async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact_id: user.contact_id
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
