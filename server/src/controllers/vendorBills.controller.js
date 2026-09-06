const vendorBillsService = require("../services/vendorBills.service");

class VendorBillsController {
  async create(req, res, next) {
    try {
      const created = await vendorBillsService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const list = await vendorBillsService.getAll();
      return res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const bill = await vendorBillsService.getById(id);
      return res.status(200).json(bill);
    } catch (err) {
      next(err);
    }
  }

  async confirm(req, res, next) {
    try {
      const { id } = req.params;
      const confirmed = await vendorBillsService.confirm(id);
      return res.status(200).json(confirmed);
    } catch (err) {
      next(err);
    }
  }

  async pay(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await vendorBillsService.pay(id, req.body);
      return res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await vendorBillsService.delete(id);
      return res.status(200).json(deleted);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VendorBillsController();
