const prisma = require("../prisma");

class AccountsService {
  async getAllAccounts() {
    let accounts = await prisma.account.findMany({
      orderBy: { name: "asc" },
    });

    if (accounts.length === 0) {
      // Seed pre-configured accounts from design specification
      const defaults = [
        { name: "Bank A/c", type: "ASSET" },
        { name: "Purchase Expense A/c", type: "EXPENSE" },
        { name: "Debtors A/c", type: "ASSET" },
        { name: "Creditors A/c", type: "LIABILITY" },
        { name: "Sales Income A/c", type: "INCOME" },
        { name: "Cash A/c", type: "ASSET" },
        { name: "Other Expense A/c", type: "EXPENSE" },
        { name: "Capital A/c", type: "CAPITAL" },
        { name: "Tax Payable A/c", type: "LIABILITY" },
        { name: "Input Tax A/c", type: "ASSET" },
      ];

      await prisma.account.createMany({ data: defaults });

      accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
    }

    return accounts;
  }

  async getAccountById(id) {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) {
      const error = new Error("Account not found");
      error.statusCode = 404;
      throw error;
    }
    return account;
  }

  async createAccount({ name, type }) {
    if (!name) {
      const error = new Error("Account name is required");
      error.statusCode = 400;
      throw error;
    }

    let accType = (type || "ASSET").toUpperCase();
    if (accType === "BANK" || accType === "CASH" || accType === "ASSET") accType = "ASSET";
    else if (accType === "LIABILITY") accType = "LIABILITY";
    else if (accType === "INCOME") accType = "INCOME";
    else if (accType === "EXPENSES" || accType === "OTHER EXPENSES" || accType === "EXPENSE")
      accType = "EXPENSE";
    else if (accType === "CAPITAL") accType = "CAPITAL";

    return await prisma.account.create({
      data: {
        name,
        type: accType,
      },
    });
  }
}

module.exports = new AccountsService();
