const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const invoicesService = require('./invoices.service');
const vendorBillsService = require('./vendorBills.service');

class PortalService {
  async login({ login_id, password }) {
    if (!login_id || !password) {
      const error = new Error('login_id and password are required');
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { login_id },
      include: { contact: true },
    });

    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    if (!user.contact_id) {
      const error = new Error('User is not associated with a contact account');
      error.statusCode = 403;
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, contact_id: user.contact_id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact_id: user.contact_id,
        contact_name: user.contact?.name,
      },
      token,
    };
  }

  async getInvoicesForContact(contactId) {
    if (!contactId) {
      const error = new Error('Contact ID missing from user token');
      error.statusCode = 400;
      throw error;
    }

    return await prisma.customerInvoice.findMany({
      where: { customer_id: contactId },
      orderBy: { invoice_date: 'desc' },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });
  }

  async getInvoiceByIdForContact(contactId, invoiceId) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    if (!invoice || invoice.customer_id !== contactId) {
      const error = new Error('Invoice not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  }

  async getBillsForContact(contactId) {
    if (!contactId) {
      const error = new Error('Contact ID missing from user token');
      error.statusCode = 400;
      throw error;
    }

    return await prisma.vendorBill.findMany({
      where: { vendor_id: contactId },
      orderBy: { bill_date: 'desc' },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });
  }

  async getBillByIdForContact(contactId, billId) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: billId },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    if (!bill || bill.vendor_id !== contactId) {
      const error = new Error('Vendor Bill not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    return bill;
  }

  async getOutstandingForContact(contactId) {
    if (!contactId) {
      const error = new Error('Contact ID missing from user token');
      error.statusCode = 400;
      throw error;
    }

    const unpaidInvoices = await prisma.customerInvoice.findMany({
      where: {
        customer_id: contactId,
        status: { in: ['DRAFT', 'CONFIRMED'] },
      },
    });

    const unpaidBills = await prisma.vendorBill.findMany({
      where: {
        vendor_id: contactId,
        status: { in: ['DRAFT', 'CONFIRMED'] },
      },
    });

    let totalUnpaidInvoices = 0;
    for (const inv of unpaidInvoices) {
      totalUnpaidInvoices += inv.total;
    }

    let totalUnpaidBills = 0;
    for (const bill of unpaidBills) {
      totalUnpaidBills += bill.total;
    }

    totalUnpaidInvoices = Math.round(totalUnpaidInvoices * 100) / 100;
    totalUnpaidBills = Math.round(totalUnpaidBills * 100) / 100;

    return {
      contact_id: contactId,
      total_unpaid_invoices: totalUnpaidInvoices,
      total_unpaid_bills: totalUnpaidBills,
      net_outstanding: Math.round((totalUnpaidInvoices - totalUnpaidBills) * 100) / 100,
    };
  }

  async payInvoiceForContact(contactId, invoiceId, { method, amount }) {
    const invoice = await this.getInvoiceByIdForContact(contactId, invoiceId);

    if (invoice.status === 'PAID') {
      const error = new Error('Invoice is already paid');
      error.statusCode = 400;
      throw error;
    }

    if (invoice.status === 'CANCELLED') {
      const error = new Error('Cannot pay a cancelled invoice');
      error.statusCode = 400;
      throw error;
    }

    const payAmount = parseFloat(amount) || invoice.total;
    if (payAmount > invoice.total) {
      const error = new Error(`Payment amount (${payAmount}) cannot exceed invoice total (${invoice.total})`);
      error.statusCode = 400;
      throw error;
    }

    return await invoicesService.pay(invoiceId, { method, amount: payAmount });
  }

  async payBillForContact(contactId, billId, { method, amount }) {
    const bill = await this.getBillByIdForContact(contactId, billId);

    if (bill.status === 'PAID') {
      const error = new Error('Vendor Bill is already paid');
      error.statusCode = 400;
      throw error;
    }

    if (bill.status === 'CANCELLED') {
      const error = new Error('Cannot pay a cancelled bill');
      error.statusCode = 400;
      throw error;
    }

    const payAmount = parseFloat(amount) || bill.total;
    if (payAmount > bill.total) {
      const error = new Error(`Payment amount (${payAmount}) cannot exceed bill total (${bill.total})`);
      error.statusCode = 400;
      throw error;
    }

    return await vendorBillsService.pay(billId, { method, amount: payAmount });
  }

  async checkout(contactId, { items }) {
    if (!items || items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    // Prepare lines for invoice
    const lines = items.map(item => ({
      product_id: item.product_id,
      qty: item.quantity,
      unit_price: item.price,
      tax_rate: 0
    }));

    // Create a new Customer Invoice as DRAFT (or CONFIRMED). We'll create as DRAFT so they can pay it.
    const invoice = await invoicesService.create({
      customer_id: contactId,
      invoice_date: new Date(),
      lines
    });

    return invoice;
  }
  async createRazorpayOrder(contactId, invoiceId) {
    const invoice = await this.getInvoiceByIdForContact(contactId, invoiceId);

    if (invoice.status === 'PAID') {
      const error = new Error('Invoice is already paid');
      error.statusCode = 400;
      throw error;
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const error = new Error('Razorpay keys not configured on server');
      error.statusCode = 500;
      throw error;
    }

    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(invoice.total * 100);

    const order = await instance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_inv_${invoice.id}`,
    });

    return {
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
    };
  }
}

module.exports = new PortalService();
