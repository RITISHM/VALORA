const portalService = require('../services/portal.service');

class PortalController {
  async login(req, res, next) {
    try {
      const result = await portalService.login(req.body);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const invoices = await portalService.getInvoicesForContact(contactId);
      return res.status(200).json(invoices);
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const { id } = req.params;
      const invoice = await portalService.getInvoiceByIdForContact(contactId, id);
      return res.status(200).json(invoice);
    } catch (err) {
      next(err);
    }
  }

  async getBills(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const bills = await portalService.getBillsForContact(contactId);
      return res.status(200).json(bills);
    } catch (err) {
      next(err);
    }
  }

  async getBillById(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const { id } = req.params;
      const bill = await portalService.getBillByIdForContact(contactId, id);
      return res.status(200).json(bill);
    } catch (err) {
      next(err);
    }
  }

  async getOutstanding(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const outstanding = await portalService.getOutstandingForContact(contactId);
      return res.status(200).json(outstanding);
    } catch (err) {
      next(err);
    }
  }

  async payInvoice(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const { id } = req.params;
      const payment = await portalService.payInvoiceForContact(contactId, id, req.body);
      return res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  }

  async payBill(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const { id } = req.params;
      const payment = await portalService.payBillForContact(contactId, id, req.body);
      return res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  }

  async checkout(req, res, next) {
    try {
      const contactId = req.user.contact_id;
      const result = await portalService.checkout(contactId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PortalController();
