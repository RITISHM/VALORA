const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting ultra-fast Supabase database seeding for Valora ERP...");

  // 1. Clean old mock data in a single batch transaction
  console.log("Cleaning old mock data...");
  try {
    await prisma.$transaction([
      prisma.payment.deleteMany(),
      prisma.customerInvoiceLine.deleteMany(),
      prisma.customerInvoice.deleteMany(),
      prisma.salesOrderLine.deleteMany(),
      prisma.salesOrder.deleteMany(),
      prisma.vendorBillLine.deleteMany(),
      prisma.vendorBill.deleteMany(),
      prisma.purchaseOrderLine.deleteMany(),
      prisma.purchaseOrder.deleteMany(),
      prisma.budgetLine.deleteMany(),
      prisma.budget.deleteMany(),
      prisma.journalItem.deleteMany(),
      prisma.journalEntry.deleteMany(),
      prisma.stockMovement.deleteMany(),
      prisma.user.deleteMany(),
      prisma.contact.deleteMany(),
      prisma.product.deleteMany(),
      prisma.analyticAccount.deleteMany(),
      prisma.journal.deleteMany(),
      prisma.account.deleteMany(),
    ]);
  } catch (err) {
    console.log("Clean step warning:", err.message);
  }

  // 2. Seed Chart of Accounts
  console.log("Seeding Chart of Accounts...");
  const accountsData = [
    { name: "Cash", type: "ASSET" },
    { name: "Bank", type: "ASSET" },
    { name: "Debtors", type: "ASSET" },
    { name: "Inventory Stock", type: "ASSET" },
    { name: "Creditors", type: "LIABILITY" },
    { name: "Tax Payable", type: "LIABILITY" },
    { name: "Capital", type: "CAPITAL" },
    { name: "Sales Income", type: "INCOME" },
    { name: "Service Revenue", type: "INCOME" },
    { name: "Purchase Expense", type: "EXPENSE" },
    { name: "Office Expenses", type: "EXPENSE" },
    { name: "Rent Expense", type: "EXPENSE" },
  ];

  const accountResults = await Promise.all(accountsData.map(acc => prisma.account.create({ data: acc })));
  const createdAccounts = {};
  accountResults.forEach(acc => { createdAccounts[acc.name] = acc.id; });

  // 3. Seed Journals
  console.log("Seeding Journals...");
  const journalsData = [
    { name: "Sales Journal", type: "SALES", default_account_id: createdAccounts["Sales Income"] },
    { name: "Purchase Journal", type: "PURCHASE", default_account_id: createdAccounts["Purchase Expense"] },
    { name: "Bank Journal", type: "BANK", default_account_id: createdAccounts["Bank"] },
    { name: "Cash Journal", type: "CASH", default_account_id: createdAccounts["Cash"] },
  ];
  await Promise.all(journalsData.map(jrn => prisma.journal.create({ data: jrn })));

  // 4. Seed Contacts
  console.log("Seeding Contacts...");
  const [vendorAzure, customerNimesh, partnerTechCorp, customerAcme] = await Promise.all([
    prisma.contact.create({
      data: {
        name: "Azure Furniture Ltd",
        type: "VENDOR",
        email: "vendor@azure.com",
        mobile: "+91 9876543210",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    }),
    prisma.contact.create({
      data: {
        name: "Nimesh Pathak",
        type: "CUSTOMER",
        email: "customer@nimesh.com",
        mobile: "+91 9812345678",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
      },
    }),
    prisma.contact.create({
      data: {
        name: "TechCorp Global Solutions",
        type: "BOTH",
        email: "info@techcorp.com",
        mobile: "+91 9988776655",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
      },
    }),
    prisma.contact.create({
      data: {
        name: "Acme Enterprises",
        type: "CUSTOMER",
        email: "contact@acme.com",
        mobile: "+91 9765432109",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
      },
    }),
  ]);

  // 5. Seed Users
  console.log("Seeding Users...");
  const commonPasswordHash = await bcrypt.hash("Valora@123", 10);
  await Promise.all([
    prisma.user.create({
      data: {
        name: "Valora Admin",
        login_id: "adminvalora",
        email: "admin@valora.com",
        password_hash: commonPasswordHash,
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Chief Accountant",
        login_id: "accountantvalora",
        email: "accountant@valora.com",
        password_hash: commonPasswordHash,
        role: "ACCOUNTANT",
      },
    }),
    prisma.user.create({
      data: {
        name: "Nimesh Pathak (Customer User)",
        login_id: "nimeshpathak",
        email: "customer@nimesh.com",
        password_hash: commonPasswordHash,
        role: "CONTACT",
        contact_id: customerNimesh.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Azure Furniture (Vendor User)",
        login_id: "azurevendor",
        email: "vendor@azure.com",
        password_hash: commonPasswordHash,
        role: "CONTACT",
        contact_id: vendorAzure.id,
      },
    }),
  ]);

  // 6. Seed Products
  console.log("Seeding Products...");
  const [prodDesk, prodChair, prodConsulting] = await Promise.all([
    prisma.product.create({
      data: {
        name: "Ergonomic Executive Desk",
        type: "GOODS",
        category: "Furniture",
        sales_price: 25000,
        cost: 18000,
      },
    }),
    prisma.product.create({
      data: {
        name: "High-Back Mesh Office Chair",
        type: "GOODS",
        category: "Furniture",
        sales_price: 12000,
        cost: 8000,
      },
    }),
    prisma.product.create({
      data: {
        name: "Enterprise ERP Setup Service",
        type: "SERVICE",
        category: "Professional Services",
        sales_price: 150000,
        cost: 50000,
      },
    }),
  ]);

  // 7. Seed Analytic Accounts
  console.log("Seeding Analytic Accounts...");
  const [analyticIT, analyticMarketing, analyticConsulting] = await Promise.all([
    prisma.analyticAccount.create({
      data: { name: "Corporate IT & Software", type: "EXPENSE" },
    }),
    prisma.analyticAccount.create({
      data: { name: "Q3 Digital Marketing Campaign", type: "EXPENSE" },
    }),
    prisma.analyticAccount.create({
      data: { name: "Enterprise Consulting Stream", type: "INCOME" },
    }),
  ]);

  // 8. Seed Budgets
  console.log("Seeding Budgets...");
  const demoBudget = await prisma.budget.create({
    data: {
      name: "FY2026 Corporate Budget",
      period_start: new Date("2026-01-01"),
      period_end: new Date("2026-12-31"),
      responsible_contact_id: partnerTechCorp.id,
      status: "CONFIRMED",
    },
  });

  await Promise.all([
    prisma.budgetLine.create({
      data: {
        budget_id: demoBudget.id,
        analytic_account_id: analyticIT.id,
        type: "EXPENSE",
        allowed_amount: 500000,
        committed_amount: 144000,
      },
    }),
    prisma.budgetLine.create({
      data: {
        budget_id: demoBudget.id,
        analytic_account_id: analyticMarketing.id,
        type: "EXPENSE",
        allowed_amount: 300000,
        committed_amount: 85000,
      },
    }),
  ]);

  // 9. Seed Sales Orders & Customer Invoices
  console.log("Seeding Sales & Customer Invoices...");
  const salesOrder = await prisma.salesOrder.create({
    data: {
      so_number: "SO-2026-001",
      customer_id: customerAcme.id,
      so_date: new Date("2026-08-15"),
      status: "CONFIRMED",
      subtotal: 175000,
      tax_amount: 0,
      total: 175000,
    },
  });

  await Promise.all([
    prisma.salesOrderLine.create({
      data: {
        so_id: salesOrder.id,
        product_id: prodConsulting.id,
        analytic_account_id: analyticConsulting.id,
        qty: 1,
        unit_price: 150000,
        total: 150000,
      },
    }),
    prisma.salesOrderLine.create({
      data: {
        so_id: salesOrder.id,
        product_id: prodDesk.id,
        qty: 1,
        unit_price: 25000,
        total: 25000,
      },
    }),
  ]);

  const [invoice1, invoice2] = await Promise.all([
    prisma.customerInvoice.create({
      data: {
        so_id: salesOrder.id,
        invoice_number: "INV-2026-001",
        customer_id: customerAcme.id,
        invoice_date: new Date("2026-08-16"),
        due_date: new Date("2026-08-30"),
        status: "PAID",
        subtotal: 175000,
        tax_amount: 0,
        total: 175000,
      },
    }),
    prisma.customerInvoice.create({
      data: {
        invoice_number: "INV-2026-002",
        customer_id: customerNimesh.id,
        invoice_date: new Date("2026-09-01"),
        due_date: new Date("2026-09-15"),
        status: "CONFIRMED",
        subtotal: 37000,
        tax_amount: 0,
        total: 37000,
      },
    }),
  ]);

  await Promise.all([
    prisma.customerInvoiceLine.create({
      data: {
        invoice_id: invoice1.id,
        product_id: prodConsulting.id,
        analytic_account_id: analyticConsulting.id,
        qty: 1,
        unit_price: 150000,
        total: 150000,
      },
    }),
    prisma.customerInvoiceLine.create({
      data: {
        invoice_id: invoice2.id,
        product_id: prodDesk.id,
        qty: 1,
        unit_price: 25000,
        total: 25000,
      },
    }),
    prisma.customerInvoiceLine.create({
      data: {
        invoice_id: invoice2.id,
        product_id: prodChair.id,
        qty: 1,
        unit_price: 12000,
        total: 12000,
      },
    }),
  ]);

  // 10. Seed Purchase Orders & Vendor Bills
  console.log("Seeding Purchase Orders & Vendor Bills...");
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      po_number: "PO-2026-001",
      vendor_id: vendorAzure.id,
      po_date: new Date("2026-08-20"),
      status: "CONFIRMED",
      subtotal: 96000,
      tax_amount: 0,
      total: 96000,
    },
  });

  await prisma.purchaseOrderLine.create({
    data: {
      po_id: purchaseOrder.id,
      product_id: prodChair.id,
      analytic_account_id: analyticIT.id,
      qty: 12,
      unit_price: 8000,
      total: 96000,
    },
  });

  const bill1 = await prisma.vendorBill.create({
    data: {
      po_id: purchaseOrder.id,
      bill_reference: "AZ-BILL-9981",
      vendor_id: vendorAzure.id,
      bill_date: new Date("2026-08-22"),
      due_date: new Date("2026-09-05"),
      status: "CONFIRMED",
      subtotal: 96000,
      tax_amount: 0,
      total: 96000,
    },
  });

  await prisma.vendorBillLine.create({
    data: {
      bill_id: bill1.id,
      product_id: prodChair.id,
      analytic_account_id: analyticIT.id,
      qty: 12,
      unit_price: 8000,
      total: 96000,
    },
  });

  console.log("🎉 SUCCESS! Mock data successfully seeded into Supabase database!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
