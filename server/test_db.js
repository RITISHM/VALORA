const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const accs = await prisma.account.findMany();
  console.log('Accounts:');
  console.log(accs);
  
  const journals = await prisma.journal.findMany();
  console.log('Journals:');
  console.log(journals);
}
run().finally(() => prisma.$disconnect());
