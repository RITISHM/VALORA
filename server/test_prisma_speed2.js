const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '/home/ritish/project/Valora/server/.env' });

async function testSpeed() {
  process.env.DATABASE_URL = process.env.DIRECT_URL; // Force direct URL
  const prisma = new PrismaClient();
  
  const startAll = Date.now();
  await Promise.all([
    prisma.contact.findMany(),
    prisma.product.findMany(),
    prisma.analyticAccount.findMany(),
    prisma.budget.findMany(),
    prisma.vendorBill.findMany()
  ]);
  console.log('Backend Promise.all DIRECT time: ' + (Date.now() - startAll) + 'ms');

  await prisma.$disconnect();
}

testSpeed();
