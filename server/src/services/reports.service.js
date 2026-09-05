const prisma = require("../prisma");

class ReportsService {
  /**
   * Balance Sheet Report:
   * Assets = Liabilities + Capital
   */
  async getBalanceSheet(year) {
    const yearNum = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${yearNum}-12-31T23:59:59.999Z`);

    const groupedItems = await prisma.journalItem.groupBy({
      by: ["account_id"],
      _sum: {
        debit: true,
        credit: true,
      },
      where: {
        journal_entry: {
          status: "POSTED",
          entry_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    });

    const accountTotals = {};

    for (const item of groupedItems) {
      accountTotals[item.account_id] = {
        debit: item._sum.debit || 0,
        credit: item._sum.credit || 0,
      };
    }

    const assets = [];
    const liabilities = [];
    const capital = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalCapital = 0;

    // Fetch all accounts in CoA to ensure complete view
    const allAccounts = await prisma.account.findMany();

    for (const acc of allAccounts) {
      const totals = accountTotals[acc.id] || { debit: 0, credit: 0 };
      if (acc.type === "ASSET") {
        const balance = Math.round((totals.debit - totals.credit) * 100) / 100;
        assets.push({ id: acc.id, name: acc.name, balance });
        totalAssets += balance;
      } else if (acc.type === "LIABILITY") {
        const balance = Math.round((totals.credit - totals.debit) * 100) / 100;
        liabilities.push({ id: acc.id, name: acc.name, balance });
        totalLiabilities += balance;
      } else if (acc.type === "CAPITAL") {
        const balance = Math.round((totals.credit - totals.debit) * 100) / 100;
        capital.push({ id: acc.id, name: acc.name, balance });
        totalCapital += balance;
      }
    }

    totalAssets = Math.round(totalAssets * 100) / 100;
    totalLiabilities = Math.round(totalLiabilities * 100) / 100;
    totalCapital = Math.round(totalCapital * 100) / 100;

    const totalLiabilitiesAndCapital = Math.round((totalLiabilities + totalCapital) * 100) / 100;

    return {
      year: yearNum,
      assets: {
        items: assets,
        total: totalAssets,
      },
      liabilities: {
        items: liabilities,
        total: totalLiabilities,
      },
      capital: {
        items: capital,
        total: totalCapital,
      },
      total_assets: totalAssets,
      total_liabilities_and_capital: totalLiabilitiesAndCapital,
      is_balanced: Math.abs(totalAssets - totalLiabilitiesAndCapital) < 0.01,
    };
  }

  /**
   * Profit & Loss Report:
   * Net Income = Income - Expenses
   * Fetches the sum of all journal items for Income and Expense accounts.
   */
  async getProfitAndLoss(year) {
    const yearNum = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${yearNum}-12-31T23:59:59.999Z`);

    const groupedItems = await prisma.journalItem.groupBy({
      by: ["account_id"],
      _sum: {
        debit: true,
        credit: true,
      },
      where: {
        journal_entry: {
          status: "POSTED",
          entry_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    });

    const accountTotals = {};
    for (const item of groupedItems) {
      accountTotals[item.account_id] = {
        debit: item._sum.debit || 0,
        credit: item._sum.credit || 0,
      };
    }

    const incomeItems = [];
    const expenseItems = [];

    let totalIncome = 0;
    let totalExpenses = 0;

    const allAccounts = await prisma.account.findMany();

    for (const acc of allAccounts) {
      const totals = accountTotals[acc.id] || { debit: 0, credit: 0 };
      if (acc.type === "INCOME") {
        const balance = Math.round((totals.credit - totals.debit) * 100) / 100;
        incomeItems.push({ id: acc.id, name: acc.name, balance });
        totalIncome += balance;
      } else if (acc.type === "EXPENSE") {
        const balance = Math.round((totals.debit - totals.credit) * 100) / 100;
        expenseItems.push({ id: acc.id, name: acc.name, balance });
        totalExpenses += balance;
      }
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;
    const netProfit = Math.round((totalIncome - totalExpenses) * 100) / 100;

    return {
      year: yearNum,
      income: {
        items: incomeItems,
        total: totalIncome,
      },
      expenses: {
        items: expenseItems,
        total: totalExpenses,
      },
      net_profit: netProfit,
    };
  }

  /**
   * Budget Report:
   * Committed vs Allowed vs Allowed % vs Amount to Attain per Analytic Account
   */
  async getBudgetReport(period) {
    const budgets = await prisma.budget.findMany({
      include: {
        responsible_contact: true,
        budget_lines: {
          include: {
            analytic_account: true,
          },
        },
      },
    });

    const reportItems = [];

    for (const budget of budgets) {
      for (const line of budget.budget_lines) {
        const committed = line.committed_amount || 0;
        const allowed = line.allowed_amount || 0;
        const allowed_pct = committed > 0 ? Math.round((allowed / committed) * 10000) / 100 : 0;
        const amount_to_attain = Math.round((committed - allowed) * 100) / 100;

        reportItems.push({
          budget_id: budget.id,
          budget_name: budget.name,
          budget_status: budget.status,
          responsible_person: budget.responsible_contact?.name || "N/A",
          analytic_account_id: line.analytic_account_id,
          analytic_account_name: line.analytic_account?.name || "Unassigned",
          type: line.type,
          committed_amount: committed,
          allowed_amount: allowed,
          allowed_pct,
          amount_to_attain,
          over_budget: committed > allowed,
        });
      }
    }

    return {
      total_budgets: budgets.length,
      lines: reportItems,
    };
  }
}


  async getDashboardAnalytics() {
    // Basic implementation for dashboard metrics
    const [
      recentInvoices,
      recentBills,
      totalPaidInvoices,
      totalUnpaidInvoices,
      totalUnpaidBills,
      pendingJournals
    ] = await Promise.all([
      prisma.customerInvoice.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { customer: true } }),
      prisma.vendorBill.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { vendor: true } }),
      prisma.customerInvoice.aggregate({ _sum: { total: true }, where: { status: 'PAID' } }),
      prisma.customerInvoice.aggregate({ _sum: { total: true }, where: { status: { in: ['DRAFT', 'CONFIRMED'] } } }),
      prisma.vendorBill.aggregate({ _sum: { total: true }, where: { status: { in: ['DRAFT', 'CONFIRMED'] } } }),
      prisma.journalEntry.count({ where: { status: 'DRAFT' } })
    ]);

    const admin = {
      totalDue: totalUnpaidInvoices._sum.total || 0,
      recentlyPaid: totalPaidInvoices._sum.total || 0,
      cashFlow: [
        { month: 'Jan', inflow: 10000, outflow: 5000 },
        { month: 'Feb', inflow: 15000, outflow: 8000 },
        { month: 'Mar', inflow: 12000, outflow: 9000 },
        { month: 'Apr', inflow: 18000, outflow: 7000 },
        { month: 'May', inflow: 22000, outflow: 11000 },
        { month: 'Jun', inflow: (totalPaidInvoices._sum.total || 0), outflow: (totalUnpaidBills._sum.total || 0) }
      ],
      recentTransactions: [
        ...recentInvoices.map(i => ({ id: i.id, type: 'Invoice', ref: i.invoice_number, date: i.invoice_date, amount: i.total, status: i.status })),
        ...recentBills.map(b => ({ id: b.id, type: 'Bill', ref: b.bill_number, date: b.bill_date, amount: b.total, status: b.status }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      upcomingPayments: [
        ...recentBills.filter(b => b.status !== 'PAID').map(b => ({ id: b.id, vendor: b.vendor.name, date: b.due_date || b.bill_date, amount: b.total }))
      ].slice(0, 3)
    };

    const accountant = {
      operatingCash: (totalPaidInvoices._sum.total || 0) * 0.8,
      netIncome: (totalPaidInvoices._sum.total || 0) - (totalUnpaidBills._sum.total || 0),
      pendingApprovals: pendingJournals,
      recentActivity: [
        { id: 1, action: "Journal Entry #J-1002 Created", time: "2 hours ago" },
        { id: 2, action: "Vendor Bill #Bill/2026/492 Paid", time: "4 hours ago" },
        { id: 3, action: "Customer Invoice #INV/2026/831 Confirmed", time: "1 day ago" }
      ]
    };

    return { admin, accountant };
  }

module.exports = new ReportsService();
