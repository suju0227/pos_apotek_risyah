import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { InventoryModule } from './inventory.module';
import { PrismaService } from '../../../database/prisma.service';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';
import { Prisma } from '@prisma/client';

describe('Inventory CQRS Integration Tests', () => {
  let service: InventoryService;
  let prisma: PrismaService;
  let testUser: any;
  let testProduct: any;
  let testCategory: any;
  let testUnit: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);

    // Setup basic master fixtures
    testUser = await prisma.user.findFirst();
    if (!testUser) {
      const role = await prisma.role.create({
        data: { name: 'TEST_MANAGER', description: 'Test Manager' },
      });
      testUser = await prisma.user.create({
        data: {
          roleId: role.id,
          name: 'Test Admin',
          username: `testadmin_${Date.now()}`,
          passwordHash: 'dummy',
        },
      });
    }

    testCategory = await prisma.category.create({
      data: { name: `Test Cat ${Date.now()}` },
    });

    testUnit = await prisma.unit.create({
      data: { name: 'Pcs', symbol: 'pcs' },
    });
  });

  afterAll(async () => {
    // Clean up dynamic fixtures
    if (testProduct) {
      await prisma.productBatch.deleteMany({ where: { productId: testProduct.id } });
      await prisma.stockMutation.deleteMany({ where: { productId: testProduct.id } });
      await prisma.product.delete({ where: { id: testProduct.id } });
    }
    if (testCategory) {
      await prisma.category.delete({ where: { id: testCategory.id } });
    }
    if (testUnit) {
      await prisma.unit.delete({ where: { id: testUnit.id } });
    }
  });

  beforeEach(async () => {
    testProduct = await prisma.product.create({
      data: {
        categoryId: testCategory.id,
        baseUnitId: testUnit.id,
        code: `TST-${Date.now()}`,
        name: 'Obat Batuk Test',
        minStockBase: 1,
      },
    });
  });

  afterEach(async () => {
    if (testProduct) {
      await prisma.productBatch.deleteMany({ where: { productId: testProduct.id } });
      await prisma.stockMutation.deleteMany({ where: { productId: testProduct.id } });
      await prisma.product.delete({ where: { id: testProduct.id } });
      testProduct = null;
    }
  });

  it('harus sukses menerima stok awal (ReceiveStockCommand) dan membuat batch serta ledger mutasi baru', async () => {
    const expiredAt = new Date('2028-12-31');
    const mutationId = await service.receiveStock(
      testProduct.id,
      'BATCH-101',
      expiredAt,
      50,
      '5000.0000',
      undefined,
      undefined,
      { purchaseNumber: 'PO-TEST-123', supplier: 'Kimia Farma', invoice: 'INV-1', unitCost: '5000' },
      testUser.id,
    );

    expect(mutationId).toBeDefined();

    // Verifikasi Summary (ProductBatch)
    const batch = await prisma.productBatch.findFirstOrThrow({
      where: { productId: testProduct.id, batchNumber: 'BATCH-101' },
    });
    expect(batch.currentStockBase.toNumber()).toBe(50);
    expect(batch.hppBase.toNumber()).toBe(5000);

    // Verifikasi Ledger (StockMutation)
    const mutation = await prisma.stockMutation.findUniqueOrThrow({
      where: { id: mutationId },
    });
    expect(mutation.qtyChange.toNumber()).toBe(50);
    expect(mutation.movementType).toBe('IN');
  });

  it('harus mendistribusikan potongan stok berdasarkan FEFO (CommitOutboundStockCommand) dengan split batch', async () => {
    // Buat batch terdekat: Kedaluwarsa 2027-01 (Stok: 10)
    await prisma.productBatch.create({
      data: {
        productId: testProduct.id,
        batchNumber: 'BATCH-NEAR',
        expiredDate: new Date('2027-01-01'),
        initialStockBase: 10,
        currentStockBase: 10,
        hppBase: 4000,
        isActive: true,
      },
    });

    // Buat batch terjauh: Kedaluwarsa 2027-06 (Stok: 20)
    await prisma.productBatch.create({
      data: {
        productId: testProduct.id,
        batchNumber: 'BATCH-FAR',
        expiredDate: new Date('2027-06-01'),
        initialStockBase: 20,
        currentStockBase: 20,
        hppBase: 4200,
        isActive: true,
      },
    });

    // Commit penjualan outbound total 15 unit (harusnya memotong 10 dari BATCH-NEAR dan 5 dari BATCH-FAR)
    const mutationIds = await service.commitOutboundStock(
      testProduct.id,
      15,
      'dummy-invoice-id',
      'SALE_RETURN', // Menggunakan SALE_RETURN agar tidak memerlukan detail saleItemId yang berelasi kompleks
      { invoiceNumber: 'INV-SALE-999', cashier: 'Budi', cashierCode: 'C1', unitPrice: '7000', discount: '0', saleUnitName: 'Pcs', conversionToBase: '1' },
      testUser.id,
    );

    expect(mutationIds).toHaveLength(2);

    // Verifikasi sisa stok batch terdekat harus habis
    const nearBatch = await prisma.productBatch.findFirstOrThrow({
      where: { productId: testProduct.id, batchNumber: 'BATCH-NEAR' },
    });
    expect(nearBatch.currentStockBase.toNumber()).toBe(0);

    // Verifikasi sisa stok batch terjauh berkurang dari 20 menjadi 15
    const farBatch = await prisma.productBatch.findFirstOrThrow({
      where: { productId: testProduct.id, batchNumber: 'BATCH-FAR' },
    });
    expect(farBatch.currentStockBase.toNumber()).toBe(15);
  });

  it('harus menolak pemotongan stok jika total stok tidak mencukupi (Shortage Guard)', async () => {
    await prisma.productBatch.create({
      data: {
        productId: testProduct.id,
        batchNumber: 'BATCH-SHORT',
        expiredDate: new Date('2028-01-01'),
        initialStockBase: 5,
        currentStockBase: 5,
        hppBase: 4000,
        isActive: true,
      },
    });

    // Coba potong 10 unit padahal stok hanya ada 5
    await expect(
      service.commitOutboundStock(
        testProduct.id,
        10,
        'dummy-invoice-id',
        'SALE_RETURN',
        { invoiceNumber: 'INV-SALE-888', cashier: 'Budi', cashierCode: 'C1', unitPrice: '7000', discount: '0', saleUnitName: 'Pcs', conversionToBase: '1' },
        testUser.id,
      )
    ).rejects.toThrow(InsufficientStockException);
  });

  it('harus memblokir setiap update dan delete pada stock_mutations lewat database triggers (Immutability Ledger)', async () => {
    // 1. Buat mutation awal
    const mutation = await prisma.stockMutation.create({
      data: {
        productId: testProduct.id,
        batchId: (await prisma.productBatch.create({
          data: {
            productId: testProduct.id,
            batchNumber: 'BATCH-IMMUTABLE',
            expiredDate: new Date('2029-01-01'),
            initialStockBase: 10,
            currentStockBase: 10,
            hppBase: 5000,
          }
        })).id,
        createdById: testUser.id,
        movementType: 'IN',
        referenceType: 'OPENING_BALANCE',
        qtyBefore: 0,
        qtyChange: 10,
        qtyAfter: 10,
      },
    });

    // 2. Coba update record mutasi tersebut, harus di-blokir oleh trigger DB Postgres
    await expect(
      prisma.stockMutation.update({
        where: { id: mutation.id },
        data: { qtyChange: 20 },
      })
    ).rejects.toThrow();

    // 3. Coba delete record mutasi tersebut, harus di-blokir oleh trigger DB Postgres
    await expect(
      prisma.stockMutation.delete({
        where: { id: mutation.id },
      })
    ).rejects.toThrow();
  });
});
