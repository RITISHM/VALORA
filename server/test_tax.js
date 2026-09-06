const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const invoicesService = require('./src/services/invoices.service');
const vendorBillsService = require('./src/services/vendorBills.service');

async function test() {
  try {
    const customer = await prisma.contact.findFirst({ where: { type: 'CUSTOMER' } });
    if (!customer) throw new Error("No customer found");

    const product = await prisma.product.findFirst({ where: { type: 'GOODS' } });
    if (!product) throw new Error("No product found");

    console.log("Creating invoice with tax rate...");
    const invoice = await invoicesService.create({
      customer_id: customer.id,
      lines: [
        {
          product_id: product.id,
          qty: 2,
          unit_price: 100,
          tax_rate: 10 // 10% tax
        }
      ]
    });

    console.log(`Created invoice ${invoice.id} with tax_amount: ${invoice.tax_amount}, total: ${invoice.total}`);

    console.log("Confirming invoice...");
    const confirmed = await invoicesService.confirm(invoice.id);
    console.log(`Confirmed invoice status: ${confirmed.status}`);

    const journalEntries = await prisma.journalEntry.findMany({
      where: { reference: `Invoice ${invoice.invoice_number}` },
      include: { journal_items: { include: { account: true } } }
    });

    console.log("Journal Entries:", JSON.stringify(journalEntries, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
