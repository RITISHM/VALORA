const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const inv = await prisma.customerInvoice.findFirst({ orderBy: { id: 'desc' } });
  console.log(inv);
}
main().then(() => prisma.$disconnect());
