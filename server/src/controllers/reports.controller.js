const reportsService = require("../services/reports.service");

class ReportsController {
  async getBalanceSheet(req, res, next) {
    try {
      const { year } = req.query;
      const report = await reportsService.getBalanceSheet(year);
      return res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  async getProfitAndLoss(req, res, next) {
    try {
      const { year } = req.query;
      const report = await reportsService.getProfitAndLoss(year);
      return res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  async getBudgetReport(req, res, next) {
    try {
      const { period } = req.query;
      const report = await reportsService.getBudgetReport(period);
      return res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportsController();
