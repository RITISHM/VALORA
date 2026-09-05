const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '/home/ritish/project/Valora/server/.env' });

async function testSpeed() {
  const prisma = new PrismaClient({ relationLoadStrategy: 'join' });
  
  const startAll = Date.now();
  await Promise.all([
    prisma.contact.findMany(),
    prisma.product.findMany(),
    prisma.analyticAccount.findMany(),
    prisma.budget.findMany(),
    prisma.vendorBill.findMany({ include: { vendor: true, po: true, lines: { include: { product: true, analytic_account: true } } } })
  ]);
  console.log('Backend Promise.all JOIN time: ' + (Date.now() - startAll) + 'ms');

  await prisma.$disconnect();
}

testSpeed();
