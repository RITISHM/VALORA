const inventoryService = require('../services/inventory.service');

class InventoryController {
  async getStock(req, res, next) {
    try {
      const stock = await inventoryService.getCurrentStock();
      return res.status(200).json(stock);
    } catch (err) {
      next(err);
    }
  }

  async getStockByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const stock = await inventoryService.getCurrentStock(productId);
      return res.status(200).json(stock);
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req, res, next) {
    try {
      const movements = await inventoryService.getMovements();
      return res.status(200).json(movements);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
