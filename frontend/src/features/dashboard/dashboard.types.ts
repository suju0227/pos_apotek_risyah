export type DashboardPeriodSummary = {
  startAt: string;
  endAt: string;
  transactionCount: number;
  returnCount: number;
  subtotal: number;
  discountTotal: number;
  salesTotal: number;
  salesReturnTotal: number;
  netRevenue: number;
  totalHpp: number;
  hppReversed: number;
  netHpp: number;
  totalProfit: number;
  profitReversed: number;
  netProfit: number;
};

export type DashboardSummary = {
  generatedAt: string;
  today: DashboardPeriodSummary;
  week: DashboardPeriodSummary;
  month: DashboardPeriodSummary;
  year: DashboardPeriodSummary;
  lowStockCount: number;
  expiredBatchCount: number;
};

export type LowStockItem = {
  productId: string;
  code: string;
  barcode: string | null;
  name: string;
  genericName: string | null;
  category: {
    id: string;
    name: string;
  };
  baseUnit: {
    id: string;
    name: string;
    symbol: string | null;
  };
  minStockBase: number;
  stockAvailableBase: number;
};

export type ExpiredBatchItem = {
  batchId: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  baseUnit: {
    id: string;
    name: string;
    symbol: string | null;
  };
  supplierName: string | null;
  batchNumber: string;
  expiredDate: string;
  currentStockBase: number;
  daysUntilExpired: number;
};

export type RecentTransaction = {
  id: string;
  saleNumber: string;
  paymentMethod: string;
  grandTotal: number;
  returnTotal: number;
  netTotal: number;
  createdAt: string;
  cashier: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
};
