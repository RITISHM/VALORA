const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '/home/ritish/project/Valora/server/.env' });

async function testSpeed() {
  const prisma = new PrismaClient();
  
  const startAll = Date.now();
  await Promise.all([
    prisma.contact.findMany(),
    prisma.product.findMany(),
    prisma.analyticAccount.findMany(),
    prisma.budget.findMany(),
    prisma.vendorBill.findMany()
  ]);
  console.log('Backend Promise.all time: ' + (Date.now() - startAll) + 'ms');

  await prisma.$disconnect();
}

testSpeed();
