const contactsService = require('../services/contacts.service');
const { z } = require('zod');

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

class ContactsController {
  async getAllContacts(req, res, next) {
    try {
      const contacts = await contactsService.getAllContacts();
      return res.status(200).json(contacts);
    } catch (err) {
      next(err);
    }
  }

  async getContactById(req, res, next) {
    try {
      const contact = await contactsService.getContactById(req.params.id);
      return res.status(200).json(contact);
    } catch (err) {
      next(err);
    }
  }

  async createContact(req, res, next) {
    try {
      const validatedData = contactSchema.parse(req.body);
      const contact = await contactsService.createContact(validatedData);
      return res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors });
      }
      next(err);
    }
  }

  async updateContact(req, res, next) {
    try {
      const validatedData = contactSchema.parse(req.body);
      const contact = await contactsService.updateContact(req.params.id, validatedData);
      return res.status(200).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors });
      }
      next(err);
    }
  }

  async deleteContact(req, res, next) {
    try {
      await contactsService.deleteContact(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ContactsController();
