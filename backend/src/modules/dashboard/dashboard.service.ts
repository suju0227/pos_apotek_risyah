import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type StockSummaryRow = {
  productId: string;
  stockAvailableBase: Prisma.Decimal | null;
};

type DashboardTrendSalesRow = {
  day: Date;
  transactionCount: bigint;
  subtotal: Prisma.Decimal | null;
  discountTotal: Prisma.Decimal | null;
  salesTotal: Prisma.Decimal | null;
  totalHpp: Prisma.Decimal | null;
  totalProfit: Prisma.Decimal | null;
};

type DashboardTrendReturnRow = {
  day: Date;
  returnCount: bigint;
  salesReturnTotal: Prisma.Decimal | null;
  hppReversed: Prisma.Decimal | null;
  profitReversed: Prisma.Decimal | null;
};

type DashboardTopProductRow = {
  productId: string;
  productName: string;
  categoryName: string;
  qtyBase: Prisma.Decimal | null;
  revenue: Prisma.Decimal | null;
  transactionCount: bigint;
};

type DashboardPaymentSalesRow = {
  paymentMethod: string;
  transactionCount: bigint;
  salesTotal: Prisma.Decimal | null;
};

type DashboardPaymentReturnRow = {
  paymentMethod: string;
  returnCount: bigint;
  returnTotal: Prisma.Decimal | null;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const windows = {
      today: this.todayWindow(now),
      week: this.weekWindow(now),
      month: this.monthWindow(now),
      year: this.yearWindow(now),
    };

    const [today, week, month, year, lowStock, expiredBatches] =
      await Promise.all([
        this.periodSummary(windows.today),
        this.periodSummary(windows.week),
        this.periodSummary(windows.month),
        this.periodSummary(windows.year),
        this.lowStock(),
        this.expiredBatches(),
      ]);

    return {
      generatedAt: now.toISOString(),
      today,
      week,
      month,
      year,
      lowStockCount: lowStock.length,
      expiredBatchCount: expiredBatches.length,
    };
  }

  async lowStock() {
    const today = this.startOfUtcDay(new Date());
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: true,
        baseUnit: true,
      },
      orderBy: { name: 'asc' },
    });

    if (!products.length) return [];

    const stockRows = await this.prisma.$queryRaw<StockSummaryRow[]>(Prisma.sql`
      SELECT
        product_id AS "productId",
        COALESCE(SUM(current_stock_base), 0) AS "stockAvailableBase"
      FROM product_batches
      WHERE product_id IN (${Prisma.join(products.map((product) => Prisma.sql`${product.id}::uuid`))})
        AND is_active = true
        AND deleted_at IS NULL
        AND expired_date >= ${today}::date
      GROUP BY product_id
    `);
    const stockByProductId = new Map(
      stockRows.map((row) => [row.productId, Number(row.stockAvailableBase ?? 0)]),
    );

    return products
      .map((product) => {
        const stockAvailableBase = stockByProductId.get(product.id) ?? 0;
        const minStockBase = Number(product.minStockBase);
        if (stockAvailableBase > minStockBase) return null;

        return {
          productId: product.id,
          code: product.code,
          barcode: product.barcode,
          name: product.name,
          genericName: product.genericName,
          category: {
            id: product.category.id,
            name: product.category.name,
          },
          baseUnit: {
            id: product.baseUnit.id,
            name: product.baseUnit.name,
            symbol: product.baseUnit.symbol,
          },
          minStockBase,
          stockAvailableBase,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  async expiredBatches() {
    const today = this.startOfUtcDay(new Date());
    const alertUntil = new Date(today);
    alertUntil.setUTCDate(alertUntil.getUTCDate() + 30);

    const batches = await this.prisma.productBatch.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        currentStockBase: { gt: 0 },
        expiredDate: {
          gte: today,
          lte: alertUntil,
        },
        product: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        product: {
          include: {
            category: true,
            baseUnit: true,
          },
        },
        supplier: true,
      },
      orderBy: [{ expiredDate: 'asc' }, { createdAt: 'asc' }],
    });

    return batches.map((batch) => ({
      batchId: batch.id,
      productId: batch.productId,
      productCode: batch.product.code,
      productName: batch.product.name,
      categoryName: batch.product.category.name,
      baseUnit: {
        id: batch.product.baseUnit.id,
        name: batch.product.baseUnit.name,
        symbol: batch.product.baseUnit.symbol,
      },
      supplierName: batch.supplier?.name ?? null,
      batchNumber: batch.batchNumber,
      expiredDate: batch.expiredDate.toISOString().slice(0, 10),
      currentStockBase: Number(batch.currentStockBase),
      daysUntilExpired: this.daysBetween(today, batch.expiredDate),
    }));
  }

  async recentTransactions() {
    const sales = await this.prisma.sale.findMany({
      where: { deletedAt: null },
      include: {
        cashier: {
          include: { role: true },
        },
        salesReturns: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return sales.map((sale) => {
      const totalReturn = sale.salesReturns.reduce(
        (sum, salesReturn) => sum + Number(salesReturn.totalRefund),
        0,
      );

      return {
        id: sale.id,
        saleNumber: sale.saleNumber,
        paymentMethod: sale.paymentMethod,
        grandTotal: Number(sale.grandTotal),
        returnTotal: totalReturn,
        netTotal: Number(sale.grandTotal) - totalReturn,
        createdAt: sale.createdAt.toISOString(),
        cashier: {
          id: sale.cashier.id,
          name: sale.cashier.name,
          username: sale.cashier.username,
          role: sale.cashier.role.name,
        },
      };
    });
  }

  async trends(days = 14) {
    const window = this.daysWindow(days);
    const [salesRows, returnRows] = await Promise.all([
      this.prisma.$queryRaw<DashboardTrendSalesRow[]>(Prisma.sql`
        SELECT
          DATE_TRUNC('day', created_at)::date AS "day",
          COUNT(*) AS "transactionCount",
          COALESCE(SUM(subtotal), 0) AS "subtotal",
          COALESCE(SUM(discount_total), 0) AS "discountTotal",
          COALESCE(SUM(grand_total), 0) AS "salesTotal",
          COALESCE(SUM(total_hpp), 0) AS "totalHpp",
          COALESCE(SUM(total_profit), 0) AS "totalProfit"
        FROM sales
        WHERE deleted_at IS NULL
          AND created_at >= ${window.start}
          AND created_at < ${window.end}
        GROUP BY DATE_TRUNC('day', created_at)::date
        ORDER BY "day" ASC
      `),
      this.prisma.$queryRaw<DashboardTrendReturnRow[]>(Prisma.sql`
        SELECT
          DATE_TRUNC('day', created_at)::date AS "day",
          COUNT(*) AS "returnCount",
          COALESCE(SUM(total_refund), 0) AS "salesReturnTotal",
          COALESCE(SUM(total_hpp_reversed), 0) AS "hppReversed",
          COALESCE(SUM(total_profit_reversed), 0) AS "profitReversed"
        FROM sales_returns
        WHERE created_at >= ${window.start}
          AND created_at < ${window.end}
        GROUP BY DATE_TRUNC('day', created_at)::date
        ORDER BY "day" ASC
      `),
    ]);

    const salesByDay = new Map(
      salesRows.map((row) => [this.dateKey(row.day), row]),
    );
    const returnsByDay = new Map(
      returnRows.map((row) => [this.dateKey(row.day), row]),
    );

    return this.dayKeys(window.start, window.days).map((date) => {
      const sales = salesByDay.get(date);
      const returns = returnsByDay.get(date);
      const salesTotal = Number(sales?.salesTotal ?? 0);
      const salesReturnTotal = Number(returns?.salesReturnTotal ?? 0);
      const totalHpp = Number(sales?.totalHpp ?? 0);
      const hppReversed = Number(returns?.hppReversed ?? 0);
      const totalProfit = Number(sales?.totalProfit ?? 0);
      const profitReversed = Number(returns?.profitReversed ?? 0);

      return {
        date,
        transactionCount: Number(sales?.transactionCount ?? 0),
        returnCount: Number(returns?.returnCount ?? 0),
        subtotal: Number(sales?.subtotal ?? 0),
        discountTotal: Number(sales?.discountTotal ?? 0),
        salesTotal,
        salesReturnTotal,
        netRevenue: salesTotal - salesReturnTotal,
        totalHpp,
        hppReversed,
        netHpp: this.roundInternal(totalHpp - hppReversed),
        totalProfit,
        profitReversed,
        netProfit: this.roundInternal(totalProfit - profitReversed),
      };
    });
  }

  async topProducts(days = 7, limit = 5) {
    const window = this.daysWindow(days);
    const normalizedLimit = Math.min(Math.max(limit, 1), 20);

    const rows = await this.prisma.$queryRaw<DashboardTopProductRow[]>(Prisma.sql`
      SELECT
        si.product_id AS "productId",
        si.product_name AS "productName",
        c.name AS "categoryName",
        COALESCE(SUM(si.qty_base), 0) AS "qtyBase",
        COALESCE(SUM(si.total_after_discount), 0) AS "revenue",
        COUNT(DISTINCT s.id) AS "transactionCount"
      FROM sale_items si
      INNER JOIN sales s ON s.id = si.sale_id
      INNER JOIN products p ON p.id = si.product_id
      INNER JOIN categories c ON c.id = p.category_id
      WHERE s.deleted_at IS NULL
        AND s.created_at >= ${window.start}
        AND s.created_at < ${window.end}
      GROUP BY si.product_id, si.product_name, c.name
      ORDER BY COALESCE(SUM(si.qty_base), 0) DESC, COALESCE(SUM(si.total_after_discount), 0) DESC
      LIMIT ${normalizedLimit}
    `);

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      categoryName: row.categoryName,
      qtyBase: Number(row.qtyBase ?? 0),
      revenue: Number(row.revenue ?? 0),
      transactionCount: Number(row.transactionCount),
    }));
  }

  async paymentMethods(days = 7) {
    const window = this.daysWindow(days);
    const [salesRows, returnRows] = await Promise.all([
      this.prisma.$queryRaw<DashboardPaymentSalesRow[]>(Prisma.sql`
        SELECT
          payment_method AS "paymentMethod",
          COUNT(*) AS "transactionCount",
          COALESCE(SUM(grand_total), 0) AS "salesTotal"
        FROM sales
        WHERE deleted_at IS NULL
          AND created_at >= ${window.start}
          AND created_at < ${window.end}
        GROUP BY payment_method
      `),
      this.prisma.$queryRaw<DashboardPaymentReturnRow[]>(Prisma.sql`
        SELECT
          s.payment_method AS "paymentMethod",
          COUNT(sr.id) AS "returnCount",
          COALESCE(SUM(sr.total_refund), 0) AS "returnTotal"
        FROM sales_returns sr
        INNER JOIN sales s ON s.id = sr.sale_id
        WHERE sr.created_at >= ${window.start}
          AND sr.created_at < ${window.end}
        GROUP BY s.payment_method
      `),
    ]);

    const byPaymentMethod = new Map<
      string,
      {
        paymentMethod: string;
        transactionCount: number;
        returnCount: number;
        salesTotal: number;
        returnTotal: number;
      }
    >();

    for (const row of salesRows) {
      byPaymentMethod.set(row.paymentMethod, {
        paymentMethod: row.paymentMethod,
        transactionCount: Number(row.transactionCount),
        returnCount: 0,
        salesTotal: Number(row.salesTotal ?? 0),
        returnTotal: 0,
      });
    }

    for (const row of returnRows) {
      const current =
        byPaymentMethod.get(row.paymentMethod) ??
        {
          paymentMethod: row.paymentMethod,
          transactionCount: 0,
          returnCount: 0,
          salesTotal: 0,
          returnTotal: 0,
        };
      current.returnCount = Number(row.returnCount);
      current.returnTotal = Number(row.returnTotal ?? 0);
      byPaymentMethod.set(row.paymentMethod, current);
    }

    return [...byPaymentMethod.values()]
      .map((row) => ({
        ...row,
        netRevenue: row.salesTotal - row.returnTotal,
      }))
      .sort((first, second) => second.netRevenue - first.netRevenue);
  }

  private async periodSummary(window: { start: Date; end: Date }) {
    const [sales, salesReturns] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          deletedAt: null,
          createdAt: {
            gte: window.start,
            lt: window.end,
          },
        },
        _count: { _all: true },
        _sum: {
          subtotal: true,
          discountTotal: true,
          grandTotal: true,
          totalHpp: true,
          totalProfit: true,
        },
      }),
      this.prisma.salesReturn.aggregate({
        where: {
          createdAt: {
            gte: window.start,
            lt: window.end,
          },
        },
        _count: { _all: true },
        _sum: {
          totalRefund: true,
          totalHppReversed: true,
          totalProfitReversed: true,
        },
      }),
    ]);

    const salesTotal = Number(sales._sum.grandTotal ?? 0);
    const salesReturnTotal = Number(salesReturns._sum.totalRefund ?? 0);
    const totalHpp = Number(sales._sum.totalHpp ?? 0);
    const hppReversed = Number(salesReturns._sum.totalHppReversed ?? 0);
    const totalProfit = Number(sales._sum.totalProfit ?? 0);
    const profitReversed = Number(salesReturns._sum.totalProfitReversed ?? 0);

    return {
      startAt: window.start.toISOString(),
      endAt: window.end.toISOString(),
      transactionCount: sales._count._all,
      returnCount: salesReturns._count._all,
      subtotal: Number(sales._sum.subtotal ?? 0),
      discountTotal: Number(sales._sum.discountTotal ?? 0),
      salesTotal,
      salesReturnTotal,
      netRevenue: salesTotal - salesReturnTotal,
      totalHpp,
      hppReversed,
      netHpp: this.roundInternal(totalHpp - hppReversed),
      totalProfit,
      profitReversed,
      netProfit: this.roundInternal(totalProfit - profitReversed),
    };
  }

  private todayWindow(now: Date) {
    const start = this.startOfUtcDay(now);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private weekWindow(now: Date) {
    const start = this.startOfUtcDay(now);
    const day = start.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setUTCDate(start.getUTCDate() - diff);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }

  private monthWindow(now: Date) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }

  private yearWindow(now: Date) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    return { start, end };
  }

  private daysWindow(days: number) {
    const normalizedDays = Math.min(Math.max(days, 1), 31);
    const start = this.startOfUtcDay(new Date());
    start.setUTCDate(start.getUTCDate() - (normalizedDays - 1));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + normalizedDays);
    return { start, end, days: normalizedDays };
  }

  private dayKeys(start: Date, days: number) {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      return this.dateKey(date);
    });
  }

  private dateKey(date: Date | string) {
    if (typeof date === 'string') {
      return date.slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  private startOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private daysBetween(start: Date, end: Date) {
    const milliseconds = end.getTime() - start.getTime();
    return Math.ceil(milliseconds / 86_400_000);
  }

  private roundInternal(value: number) {
    return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
  }
}
