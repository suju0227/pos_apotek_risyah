export type PeriodSummary = {
  startAt: string;
  endAt: string;
  transactionCount: number;
  returnCount: number;
  subtotal: number;
  discountTotal: number;
  salesTotal: number;
  salesReturnTotal: number;
  netRevenue: number;
  totalHpp?: number;
  hppReversed?: number;
  netHpp?: number;
  totalProfit?: number;
  profitReversed?: number;
  netProfit?: number;
};

export type DashboardSummary = {
  todayRevenue: number;
  todayProfit?: number;
  weeklyProfit?: number;
  monthlyProfit?: number;
  yearlyProfit?: number;
  todayTransactionCount: number;
  lowStockCount: number;
  expiringBatchCount: number;
  outOfStockCount?: number;
  customPeriod?: PeriodSummary;
};

export type DashboardTrendPoint = {
  date: string;
  revenue: number;
  profit?: number;
};

export type LatestSaleItem = {
  id: string;
  saleNumber: string;
  saleTime: string;
  cashierName: string;
  total: number;
  paymentMethod: string;
  status: string;
};

export type LowStockProduct = {
  productId: string;
  productName: string;
  currentStockBase: number;
  minimumStockBase: number;
  shortage: number;
  baseUnitName: string;
  status: 'AMAN' | 'RENDAH' | 'HABIS';
};

export type ExpiringBatchItem = {
  batchId: string;
  productName: string;
  batchNumber: string;
  expiredDate: string;
  daysRemaining: number;
  currentStockBase: number;
  baseUnitName: string;
  status: 'AMAN' | 'WASPADA' | 'KRITIS' | 'EXPIRED';
};

export type PurchaseOrderSummary = {
  draft: number;
  sent: number;
  partiallyReceived: number;
  received: number;
  cancelled?: number;
  todayPurchases?: number;
};

export type PrescriptionSummary = {
  newPrescription: number;
  readyForPayment: number;
  completed: number;
  todayCounseling: number;
};

export type RecentActivity = {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  entityType: string;
  summary: string;
};

export type TopProduct = {
  productId: string;
  productName: string;
  categoryName: string;
  qtyBase: number;
  revenue: number;
  transactionCount: number;
};
