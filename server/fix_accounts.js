const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const accounts = await prisma.account.findMany();
  for (const acc of accounts) {
    if (!acc.name.endsWith('A/c') && !acc.name.endsWith(' A/c')) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { name: acc.name + ' A/c' }
      });
      console.log(`Renamed ${acc.name} to ${acc.name} A/c`);
    }
  }

  // Create Input Tax A/c if it doesn't exist
  const inputTax = await prisma.account.findFirst({ where: { name: 'Input Tax A/c' } });
  if (!inputTax) {
    await prisma.account.create({
      data: { name: 'Input Tax A/c', type: 'ASSET' }
    });
    console.log('Created Input Tax A/c');
  } else {
    console.log('Input Tax A/c already exists');
  }

}
run().finally(() => prisma.$disconnect());
