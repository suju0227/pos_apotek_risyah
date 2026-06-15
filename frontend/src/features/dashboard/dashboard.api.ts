import { apiClient } from '../../shared/api/apiClient';
import type {
  DashboardPaymentMethod,
  DashboardSummary,
  DashboardTopProduct,
  DashboardTrendItem,
  ExpiredBatchItem,
  LowStockItem,
  RecentTransaction,
} from './dashboard.types';

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  lowStock: () => apiClient.get<LowStockItem[]>('/dashboard/low-stock'),
  expiredBatches: () =>
    apiClient.get<ExpiredBatchItem[]>('/dashboard/expired-batches'),
  recentTransactions: () =>
    apiClient.get<RecentTransaction[]>('/dashboard/recent-transactions'),
  trends: (days = 14) =>
    apiClient.get<DashboardTrendItem[]>(`/dashboard/trends?days=${days}`),
  topProducts: (days = 7, limit = 5) =>
    apiClient.get<DashboardTopProduct[]>(
      `/dashboard/top-products?days=${days}&limit=${limit}`,
    ),
  paymentMethods: (days = 7) =>
    apiClient.get<DashboardPaymentMethod[]>(
      `/dashboard/payment-methods?days=${days}`,
    ),
};
