const reportsService = require("../services/reports.service");
const aiService = require("../services/ai.service");

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

  async getDashboardAnalytics(req, res, next) {
    try {
      const data = await reportsService.getDashboardAnalytics();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getAIInsights(req, res, next) {
    try {
      const { year } = req.query;
      const report = await reportsService.getProfitAndLoss(year);
      const insights = await aiService.generateInsights(report);
      return res.status(200).json(insights);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportsController();
