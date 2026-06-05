import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProfitReportQueryDto } from './dto/profit-report-query.dto';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const reportSaleInclude = {
  cashier: {
    include: { role: true },
  },
  salesReturns: true,
  items: {
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.SaleInclude;

const profitAllocationInclude = {
  batch: true,
  salesReturnItems: true,
  saleItem: {
    include: {
      product: {
        include: { category: true },
      },
      sale: {
        include: {
          cashier: true,
        },
      },
    },
  },
} satisfies Prisma.SaleBatchAllocationInclude;

type ReportSale = Prisma.SaleGetPayload<{ include: typeof reportSaleInclude }>;
type ProfitAllocation = Prisma.SaleBatchAllocationGetPayload<{
  include: typeof profitAllocationInclude;
}>;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async sales(query: SalesReportQueryDto) {
    const { page, limit, skip } = this.pagination(query.page, query.limit);
    const dateFilter = this.dateFilter(query.startDate, query.endDate);
    const where = this.salesWhere(query, dateFilter);

    const [total, sales, allSales] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        include: reportSaleInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.findMany({
        where,
        include: reportSaleInclude,
      }),
    ]);

    const summary = this.salesSummary(allSales);

    return {
      filters: this.filtersResponse(query, dateFilter),
      summary,
      pagination: this.paginationResponse(page, limit, total),
      data: sales.map((sale) => this.saleRow(sale)),
    };
  }

  async profit(query: ProfitReportQueryDto) {
    const { page, limit, skip } = this.pagination(query.page, query.limit);
    const dateFilter = this.dateFilter(query.startDate, query.endDate);
    const where = this.profitWhere(query, dateFilter);

    const [total, allocations, allAllocations] = await Promise.all([
      this.prisma.saleBatchAllocation.count({ where }),
      this.prisma.saleBatchAllocation.findMany({
        where,
        include: profitAllocationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.saleBatchAllocation.findMany({
        where,
        include: profitAllocationInclude,
      }),
    ]);

    const summary = this.profitSummary(allAllocations);

    return {
      filters: this.filtersResponse(query, dateFilter),
      summary,
      pagination: this.paginationResponse(page, limit, total),
      data: allocations.map((allocation) => this.profitRow(allocation)),
    };
  }

  private salesWhere(
    query: SalesReportQueryDto,
    dateFilter: Prisma.DateTimeFilter,
  ): Prisma.SaleWhereInput {
    return {
      deletedAt: null,
      createdAt: dateFilter,
      ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
      ...(query.cashierId ? { cashierId: query.cashierId } : {}),
      ...(query.productId || query.categoryId
        ? {
            items: {
              some: {
                ...(query.productId ? { productId: query.productId } : {}),
                ...(query.categoryId
                  ? { product: { categoryId: query.categoryId } }
                  : {}),
              },
            },
          }
        : {}),
    };
  }

  private profitWhere(
    query: ProfitReportQueryDto,
    dateFilter: Prisma.DateTimeFilter,
  ): Prisma.SaleBatchAllocationWhereInput {
    return {
      ...(query.batchId ? { batchId: query.batchId } : {}),
      saleItem: {
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.categoryId
          ? { product: { categoryId: query.categoryId } }
          : {}),
        sale: {
          deletedAt: null,
          createdAt: dateFilter,
        },
      },
    };
  }

  private salesSummary(sales: ReportSale[]) {
    const subtotal = this.sum(sales, (sale) => Number(sale.subtotal));
    const discountTotal = this.sum(sales, (sale) => Number(sale.discountTotal));
    const grandTotal = this.sum(sales, (sale) => Number(sale.grandTotal));
    const returnTotal = this.sum(sales, (sale) =>
      this.sum(sale.salesReturns, (salesReturn) =>
        Number(salesReturn.totalRefund),
      ),
    );

    return {
      transactionCount: sales.length,
      returnCount: this.sum(sales, (sale) => sale.salesReturns.length),
      subtotal,
      discountTotal,
      grandTotal,
      returnTotal,
      netRevenue: grandTotal - returnTotal,
    };
  }

  private profitSummary(allocations: ProfitAllocation[]) {
    const grossRevenue = this.sum(allocations, (allocation) =>
      Number(allocation.subtotal),
    );
    const totalDiscount = this.sum(allocations, (allocation) =>
      Number(allocation.discountAmount),
    );
    const totalHpp = this.roundInternal(
      this.sum(
        allocations,
        (allocation) =>
          Number(allocation.qtyBase) * Number(allocation.hppBaseSnapshot),
      ),
    );
    const grossProfit = this.roundInternal(
      this.sum(allocations, (allocation) => Number(allocation.profitAmount)),
    );
    const returnRevenue = this.sum(allocations, (allocation) =>
      this.sum(allocation.salesReturnItems, (item) => Number(item.refundAmount)),
    );
    const returnHpp = this.roundInternal(
      this.sum(allocations, (allocation) =>
        this.sum(allocation.salesReturnItems, (item) =>
          Number(item.hppReversed),
        ),
      ),
    );
    const returnProfit = this.roundInternal(
      this.sum(allocations, (allocation) =>
        this.sum(allocation.salesReturnItems, (item) =>
          Number(item.profitReversed),
        ),
      ),
    );
    const netRevenue = grossRevenue - returnRevenue;
    const netHpp = this.roundInternal(totalHpp - returnHpp);
    const netProfit = this.roundInternal(grossProfit - returnProfit);

    return {
      allocationCount: allocations.length,
      grossRevenue,
      totalDiscount,
      totalHpp,
      grossProfit,
      returnRevenue,
      returnHpp,
      returnProfit,
      netRevenue,
      netHpp,
      netProfit,
      profitDisplay: Math.round(netProfit),
    };
  }

  private saleRow(sale: ReportSale) {
    const returnTotal = this.sum(sale.salesReturns, (salesReturn) =>
      Number(salesReturn.totalRefund),
    );

    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      saleDate: sale.createdAt.toISOString(),
      cashier: {
        id: sale.cashier.id,
        name: sale.cashier.name,
        username: sale.cashier.username,
      },
      paymentMethod: sale.paymentMethod,
      subtotal: Number(sale.subtotal),
      discountTotal: Number(sale.discountTotal),
      grandTotal: Number(sale.grandTotal),
      returnTotal,
      netTotal: Number(sale.grandTotal) - returnTotal,
      returnStatus: returnTotal > 0 ? 'RETURNED' : 'NONE',
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        categoryId: item.product.categoryId,
        categoryName: item.product.category.name,
        unitName: item.unitName,
        qtySale: Number(item.qtySale),
        qtyBase: Number(item.qtyBase),
        sellingPrice: Number(item.sellingPrice),
        subtotal: Number(item.subtotal),
        discountAmount: Number(item.discountAmount),
        totalAfterDiscount: Number(item.totalAfterDiscount),
      })),
    };
  }

  private profitRow(allocation: ProfitAllocation) {
    const hppAmount = this.roundInternal(
      Number(allocation.qtyBase) * Number(allocation.hppBaseSnapshot),
    );
    const returnRevenue = this.sum(allocation.salesReturnItems, (item) =>
      Number(item.refundAmount),
    );
    const returnHpp = this.roundInternal(
      this.sum(allocation.salesReturnItems, (item) => Number(item.hppReversed)),
    );
    const returnProfit = this.roundInternal(
      this.sum(allocation.salesReturnItems, (item) =>
        Number(item.profitReversed),
      ),
    );
    const grossProfit = Number(allocation.profitAmount);
    const netProfit = this.roundInternal(grossProfit - returnProfit);

    return {
      allocationId: allocation.id,
      saleId: allocation.saleItem.saleId,
      saleNumber: allocation.saleItem.sale.saleNumber,
      saleDate: allocation.saleItem.sale.createdAt.toISOString(),
      cashier: {
        id: allocation.saleItem.sale.cashier.id,
        name: allocation.saleItem.sale.cashier.name,
        username: allocation.saleItem.sale.cashier.username,
      },
      productId: allocation.saleItem.productId,
      productName: allocation.saleItem.productName,
      categoryId: allocation.saleItem.product.categoryId,
      categoryName: allocation.saleItem.product.category.name,
      batchId: allocation.batchId,
      batchNumber: allocation.batchNumber,
      expiredDate: allocation.expiredDate.toISOString().slice(0, 10),
      qtyBase: Number(allocation.qtyBase),
      grossRevenue: Number(allocation.subtotal),
      discountAmount: Number(allocation.discountAmount),
      hppBaseSnapshot: Number(allocation.hppBaseSnapshot),
      hppAmount,
      grossProfit,
      returnRevenue,
      returnHpp,
      returnProfit,
      netRevenue: Number(allocation.subtotal) - returnRevenue,
      netHpp: this.roundInternal(hppAmount - returnHpp),
      netProfit,
      profitDisplay: Math.round(netProfit),
    };
  }

  private dateFilter(startDate?: string, endDate?: string): Prisma.DateTimeFilter {
    const start = startDate
      ? this.parseDate(startDate, 'startDate')
      : this.startOfUtcDay(new Date());
    const end = endDate
      ? this.endExclusive(endDate)
      : this.nextUtcDay(start);

    if (start >= end) {
      throw new BadRequestException('startDate harus sebelum endDate');
    }

    return { gte: start, lt: end };
  }

  private parseDate(value: string, field: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${field} harus memakai format YYYY-MM-DD`);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} tidak valid`);
    }
    return date;
  }

  private endExclusive(value: string) {
    return this.nextUtcDay(this.parseDate(value, 'endDate'));
  }

  private nextUtcDay(date: Date) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  private startOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private filtersResponse(
    query: SalesReportQueryDto | ProfitReportQueryDto,
    dateFilter: Prisma.DateTimeFilter,
  ) {
    return {
      ...query,
      startAt: (dateFilter.gte as Date).toISOString(),
      endAt: (dateFilter.lt as Date).toISOString(),
    };
  }

  private pagination(pageInput?: number, limitInput?: number) {
    const page = pageInput ?? DEFAULT_PAGE;
    const limit = limitInput ?? DEFAULT_LIMIT;
    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  private paginationResponse(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private sum<T>(items: T[], getter: (item: T) => number) {
    return items.reduce((total, item) => total + getter(item), 0);
  }

  private roundInternal(value: number) {
    return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
  }
}
