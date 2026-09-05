const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '/home/ritish/project/Valora/server/.env' });

async function testSpeed() {
  const prisma = new PrismaClient();
  
  const startAll = Date.now();
  
  const [c, p, a, b, vb] = await prisma.$transaction([
    prisma.contact.findMany(),
    prisma.product.findMany(),
    prisma.analyticAccount.findMany(),
    prisma.budget.findMany(),
    prisma.vendorBill.findMany({ include: { vendor: true, po: true, lines: { include: { product: true, analytic_account: true } } } })
  ]);
  
  console.log('Backend Transaction time: ' + (Date.now() - startAll) + 'ms');
  await prisma.$disconnect();
}

testSpeed();
