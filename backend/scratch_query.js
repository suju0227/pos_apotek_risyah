const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: 'TRX-20260707-1783466049474-0HXH8A' },
      include: {
        items: {
          include: { allocations: true }
        }
      }
    });

    if (!sale) {
      console.log('Sale not found');
      // maybe find by saleNumber?
      const saleByNumber = await prisma.sale.findFirst({
        where: { saleNumber: 'TRX-20260707-1783466049474-0HXH8A' },
        include: {
          items: {
            include: { allocations: true }
          }
        }
      });
      console.log('Found by saleNumber:', !!saleByNumber);
      if (saleByNumber) {
        console.dir(saleByNumber, { depth: null });
      }
      return;
    }

    console.dir(sale, { depth: null });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
