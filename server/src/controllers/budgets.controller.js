const budgetsService = require("../services/budgets.service");

class BudgetsController {
  async create(req, res, next) {
    try {
      const created = await budgetsService.create(req.body);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const list = await budgetsService.getAll();
      return res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const budget = await budgetsService.getById(id);
      return res.status(200).json(budget);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await budgetsService.update(id, req.body);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  async confirm(req, res, next) {
    try {
      const { id } = req.params;
      const confirmed = await budgetsService.confirm(id);
      return res.status(200).json(confirmed);
    } catch (err) {
      next(err);
    }
  }

  async revise(req, res, next) {
    try {
      const { id } = req.params;
      const revised = await budgetsService.revise(id, req.body);
      return res.status(201).json(revised);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const cancelled = await budgetsService.cancel(id);
      return res.status(200).json(cancelled);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BudgetsController();
