const prisma = require('../prisma');

class AccountsService {
  async getAllAccounts() {
    return await prisma.account.findMany();
  }

  async getAccountById(id) {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      throw error;
    }
    return account;
  }
}

module.exports = new AccountsService();
