const express = require("express");
const prisma = require("../prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(1),
  login_id: z.string().min(6), // Removed max(12) to allow email as login_id for customers
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/,
      "Password must have uppercase, lowercase, and special character",
    ),
  role: z.enum(["ADMIN", "ACCOUNTANT", "CONTACT"]),
  contact_id: z.string().optional(),
  contact_type: z.enum(["CUSTOMER", "VENDOR", "BOTH"]).optional(),
});

router.post("/signup", async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const password_hash = await bcrypt.hash(validatedData.password, 10);

    let contact_id = validatedData.contact_id || null;
    let contact_type = validatedData.contact_type || null;

    if (validatedData.role === 'CONTACT') {
      if (!contact_id) {
        const typeToUse = validatedData.contact_type || 'BOTH';
        const newContact = await prisma.contact.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            type: typeToUse
          }
        });
        contact_id = newContact.id;
        contact_type = newContact.type;
      } else {
        const existingContact = await prisma.contact.findUnique({ where: { id: contact_id } });
        contact_type = existingContact?.type;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        login_id: validatedData.login_id,
        email: validatedData.email,
        password_hash,
        role: validatedData.role,
        contact_id: contact_id,
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, contact_id: user.contact_id, contact_type: contact_type },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res
      .status(201)
      .json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, contact_type: contact_type }, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "User with this login ID or email already exists" });
    }
    next(error);
  }
});

const loginSchema = z.object({
  login_id: z.string(),
  password: z.string(),
});

router.post("/login", async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { login_id: validatedData.login_id },
          { email: validatedData.login_id }
        ]
      },
      include: { contact: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(validatedData.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, contact_id: user.contact_id, contact_type: user.contact?.type },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, contact_type: user.contact?.type }, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    next(error);
  }
});

const { authenticateToken } = require("../middleware/auth");

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { contact: true }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put("/me", authenticateToken, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name cannot be empty" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact_id: user.contact_id,
      },
    });
  } catch (error) {
    next(error);
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "ACCOUNTANT", "CONTACT"]).optional(),
  contact_id: z.string().nullable().optional(),
});

router.get("/users", authenticateToken, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        login_id: true,
        email: true,
        role: true,
        contact_id: true,
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id", authenticateToken, async (req, res, next) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        login_id: true,
        email: true,
        role: true,
        contact_id: true,
      }
    });
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }
    next(error);
  }
});

router.delete("/users/:id", authenticateToken, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    next(error);
  }
});

module.exports = router;
