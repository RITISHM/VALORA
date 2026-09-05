const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Chart of Accounts (CoA)...");
  const accountsData = [
    { name: "Cash", type: "ASSET" },
    { name: "Bank", type: "ASSET" },
    { name: "Debtors", type: "ASSET" },
    { name: "Creditors", type: "LIABILITY" },
    { name: "Tax Payable", type: "LIABILITY" },
    { name: "Capital", type: "CAPITAL" },
    { name: "Sales Income", type: "INCOME" },
    { name: "Purchase Expense", type: "EXPENSE" },
    { name: "Other Expenses", type: "EXPENSE" },
  ];

  const createdAccounts = {};
  for (const acc of accountsData) {
    const created = await prisma.account.create({ data: acc });
    createdAccounts[acc.name] = created.id;
  }
  console.log("CoA Seeded.");

  console.log("Seeding Journals...");
  const journalsData = [
    { name: "Sales Journal", type: "SALES", default_account_id: createdAccounts["Sales Income"] },
    {
      name: "Purchase Journal",
      type: "PURCHASE",
      default_account_id: createdAccounts["Purchase Expense"],
    },
    { name: "Bank Journal", type: "BANK", default_account_id: createdAccounts["Bank"] },
    { name: "Cash Journal", type: "CASH", default_account_id: createdAccounts["Cash"] },
  ];

  for (const jrn of journalsData) {
    await prisma.journal.create({ data: jrn });
  }
  console.log("Journals Seeded.");

  console.log("Seeding demo contacts...");
  await prisma.contact.create({
    data: { name: "Azure Furniture", type: "VENDOR" },
  });
  await prisma.contact.create({
    data: { name: "Nimesh Pathak", type: "CUSTOMER" },
  });
  console.log("Contacts Seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
