const salesService = require("../services/sales.service");
const invoicesService = require("../services/invoices.service");

class SalesController {
  async create(req, res, next) {
    try {
      const created = await salesService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const orders = await salesService.getAll();
      return res.status(200).json(orders);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await salesService.getById(id);
      return res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  async confirm(req, res, next) {
    try {
      const { id } = req.params;
      const confirmed = await salesService.confirm(id);
      return res.status(200).json(confirmed);
    } catch (err) {
      next(err);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoicesService.createFromSO(id);
      return res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SalesController();
