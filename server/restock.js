const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    await prisma.stockMovement.create({
      data: {
        product_id: p.id,
        quantity: 100,
        type: 'ADJUSTMENT',
        reference: 'Hackathon Demo Restock'
      }
    });
    console.log('Restocked', p.name);
  }
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
