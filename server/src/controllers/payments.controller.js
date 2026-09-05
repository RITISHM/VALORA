const paymentsService = require("../services/payments.service");

class PaymentsController {
  async getAll(req, res, next) {
    try {
      const payments = await paymentsService.getAll();
      return res.status(200).json(payments);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentsController();
