const accountsService = require('../services/accounts.service');

class AccountsController {
  async getAllAccounts(req, res, next) {
    try {
      const accounts = await accountsService.getAllAccounts();
      return res.status(200).json(accounts);
    } catch (err) {
      next(err);
    }
  }

  async getAccountById(req, res, next) {
    try {
      const account = await accountsService.getAccountById(req.params.id);
      return res.status(200).json(account);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AccountsController();
