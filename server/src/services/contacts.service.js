const prisma = require('../prisma');

class ContactsService {
  async getAllContacts() {
    return await prisma.contact.findMany();
  }

  async getContactById(id) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }
    return contact;
  }

  async createContact(data) {
    return await prisma.contact.create({ data });
  }

  async updateContact(id, data) {
    try {
      return await prisma.contact.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2025') {
        const err = new Error('Contact not found');
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }
  }

  async deleteContact(id) {
    try {
      await prisma.contact.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        const err = new Error('Contact not found');
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new ContactsService();
