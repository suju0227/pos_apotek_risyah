import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request = require('supertest');
import { AppModule } from '../../app.module';
import { PrismaService } from '../../database/prisma.service';

describe('Dashboard API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let managerToken: string;
  let cashierToken: string;
  let ownerToken: string;
  let cashierUserId: string;
  const suffix = Date.now().toString();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleRef.get(PrismaService);
    await app.init();
    await seedUsers();

    managerToken = await login('manager_dashboard');
    cashierToken = await login('cashier_dashboard');
    ownerToken = await login('owner_dashboard');
    cashierUserId = (
      await prisma.user.findUniqueOrThrow({
        where: { username: 'cashier_dashboard' },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns manager summary using sales history corrected by returns', async () => {
    const before = await getSummary();
    const sale = await createSaleWithReturn('summary');
    const after = await getSummary();

    expect(after.today.transactionCount - before.today.transactionCount).toBe(1);
    expect(after.today.returnCount - before.today.returnCount).toBe(1);
    expect(after.today.salesTotal - before.today.salesTotal).toBe(1000);
    expect(after.today.salesReturnTotal - before.today.salesReturnTotal).toBe(250);
    expect(after.today.netRevenue - before.today.netRevenue).toBe(750);
    expect(after.today.totalProfit - before.today.totalProfit).toBeCloseTo(
      400.12345678,
      8,
    );
    expect(after.today.profitReversed - before.today.profitReversed).toBeCloseTo(
      100.11111111,
      8,
    );
    expect(after.today.netProfit - before.today.netProfit).toBeCloseTo(
      300.01234567,
      8,
    );

    const recent = await request(app.getHttpServer())
      .get('/api/dashboard/recent-transactions')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(recent.body[0]).toMatchObject({
      id: sale.id,
      saleNumber: sale.saleNumber,
      grandTotal: 1000,
      returnTotal: 250,
      netTotal: 750,
    });
    expect(JSON.stringify(recent.body)).not.toContain('hpp');
    expect(JSON.stringify(recent.body)).not.toContain('profit');
  });

  it('returns low stock based on active non-expired batch stock only', async () => {
    const critical = await createProductWithBatch('critical', {
      minStockBase: 10,
      stockBase: 4,
      expiredDays: 40,
    });
    const enough = await createProductWithBatch('enough', {
      minStockBase: 2,
      stockBase: 5,
      expiredDays: 40,
    });
    const expiredOnly = await createProductWithBatch('expired-only', {
      minStockBase: 1,
      stockBase: 9,
      expiredDays: -1,
    });

    const response = await request(app.getHttpServer())
      .get('/api/dashboard/low-stock')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    const productIds = response.body.map((item: { productId: string }) => item.productId);
    expect(productIds).toContain(critical.product.id);
    expect(productIds).toContain(expiredOnly.product.id);
    expect(productIds).not.toContain(enough.product.id);

    const criticalRow = response.body.find(
      (item: { productId: string }) => item.productId === critical.product.id,
    );
    expect(criticalRow).toMatchObject({
      minStockBase: 10,
      stockAvailableBase: 4,
    });
  });

  it('returns active batches that are close to expired', async () => {
    const active = await createProductWithBatch('expired-alert-active', {
      minStockBase: 0,
      stockBase: 3,
      expiredDays: 10,
    });
    const inactive = await createProductWithBatch('expired-alert-inactive', {
      minStockBase: 0,
      stockBase: 3,
      expiredDays: 10,
      isActive: false,
    });
    const far = await createProductWithBatch('expired-alert-far', {
      minStockBase: 0,
      stockBase: 3,
      expiredDays: 60,
    });

    const response = await request(app.getHttpServer())
      .get('/api/dashboard/expired-batches')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    const batchIds = response.body.map((item: { batchId: string }) => item.batchId);
    expect(batchIds).toContain(active.batch.id);
    expect(batchIds).not.toContain(inactive.batch.id);
    expect(batchIds).not.toContain(far.batch.id);
  });

  it('restricts dashboard endpoints to manager', async () => {
    await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/dashboard/low-stock')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
  });

  async function getSummary() {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    return response.body;
  }

  async function createSaleWithReturn(label: string) {
    const fixture = await createProductWithBatch(`sale-${label}`, {
      minStockBase: 0,
      stockBase: 5,
      expiredDays: 60,
    });

    const sale = await prisma.sale.create({
      data: {
        cashierId: cashierUserId,
        saleNumber: `DASH-SALE-${label}-${suffix}`,
        paymentMethod: 'CASH',
        subtotal: 1200,
        discountTotal: 200,
        grandTotal: 1000,
        paidAmount: 1000,
        changeAmount: 0,
        totalHpp: 599.87654322,
        totalProfit: 400.12345678,
        items: {
          create: {
            productId: fixture.product.id,
            productUnitId: fixture.productUnit.id,
            productName: fixture.product.name,
            unitName: fixture.unit.name,
            qtySale: 1,
            conversionSnapshot: 1,
            qtyBase: 1,
            sellingPrice: 1200,
            subtotal: 1200,
            discountAmount: 200,
            totalAfterDiscount: 1000,
            allocations: {
              create: {
                batchId: fixture.batch.id,
                batchNumber: fixture.batch.batchNumber,
                expiredDate: fixture.batch.expiredDate,
                qtyBase: 1,
                hppBaseSnapshot: 599.87654322,
                subtotal: 1200,
                discountAmount: 200,
                profitAmount: 400.12345678,
              },
            },
          },
        },
      },
    });

    await prisma.salesReturn.create({
      data: {
        saleId: sale.id,
        cashierId: cashierUserId,
        returnNumber: `DASH-RET-${label}-${suffix}`,
        reason: 'Retur untuk dashboard',
        totalRefund: 250,
        totalHppReversed: 149.88888889,
        totalProfitReversed: 100.11111111,
      },
    });

    return sale;
  }

  async function createProductWithBatch(
    label: string,
    options: {
      minStockBase: number;
      stockBase: number;
      expiredDays: number;
      isActive?: boolean;
    },
  ) {
    const category = await prisma.category.create({
      data: { name: `Dashboard Category ${label} ${suffix}` },
    });
    const unit = await prisma.unit.create({
      data: {
        name: `dashboard unit ${label} ${suffix}`,
        symbol: `du${label.slice(0, 2)}${suffix.slice(-2)}`,
      },
    });
    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        baseUnitId: unit.id,
        code: `DASH-${label}-${suffix}`,
        name: `Dashboard Product ${label} ${suffix}`,
        minStockBase: options.minStockBase,
      },
    });
    const productUnit = await prisma.productUnit.create({
      data: {
        productId: product.id,
        unitId: unit.id,
        conversionToBase: 1,
        isDefaultSaleUnit: true,
        isSaleUnit: true,
      },
    });
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        batchNumber: `DASH-BATCH-${label}-${suffix}`,
        expiredDate: futureDate(options.expiredDays),
        initialStockBase: options.stockBase,
        currentStockBase: options.stockBase,
        hppBase: 100,
        isActive: options.isActive ?? true,
        prices: {
          create: {
            productUnitId: productUnit.id,
            sellingPrice: 150,
          },
        },
      },
    });

    return { category, unit, product, productUnit, batch };
  }

  async function login(username: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ usernameOrEmail: username, password: 'ChangeMe123!' })
      .expect(201);
    return response.body.accessToken as string;
  }

  async function seedUsers() {
    await prisma.refreshToken.deleteMany();

    const managerRole = await prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        description: 'Manager apotek untuk dashboard.',
      },
    });
    const cashierRole = await prisma.role.upsert({
      where: { name: 'KASIR' },
      update: {},
      create: {
        name: 'KASIR',
        description: 'Kasir apotek untuk transaksi.',
      },
    });
    const ownerRole = await prisma.role.upsert({
      where: { name: 'PEMILIK' },
      update: {},
      create: {
        name: 'PEMILIK',
        description: 'Pemilik opsional.',
      },
    });
    const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

    await prisma.user.upsert({
      where: { username: 'manager_dashboard' },
      update: { passwordHash, roleId: managerRole.id, isActive: true },
      create: {
        username: 'manager_dashboard',
        email: 'manager-dashboard@example.com',
        name: 'Manager Dashboard',
        passwordHash,
        roleId: managerRole.id,
      },
    });
    await prisma.user.upsert({
      where: { username: 'cashier_dashboard' },
      update: { passwordHash, roleId: cashierRole.id, isActive: true },
      create: {
        username: 'cashier_dashboard',
        email: 'cashier-dashboard@example.com',
        name: 'Cashier Dashboard',
        passwordHash,
        roleId: cashierRole.id,
      },
    });
    await prisma.user.upsert({
      where: { username: 'owner_dashboard' },
      update: { passwordHash, roleId: ownerRole.id, isActive: true },
      create: {
        username: 'owner_dashboard',
        email: 'owner-dashboard@example.com',
        name: 'Owner Dashboard',
        passwordHash,
        roleId: ownerRole.id,
      },
    });
  }

  function futureDate(days: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date;
  }
});
