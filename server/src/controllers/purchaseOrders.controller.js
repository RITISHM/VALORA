const service = require("../services/purchaseOrders.service");

class PurchaseOrdersController {
  async create(req, res, next) {
    try {
      const result = await service.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await service.getAll();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await service.getById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const result = await service.confirm(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PurchaseOrdersController();
