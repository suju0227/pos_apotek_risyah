import { apiClient } from '../../shared/api/apiClient';
import type {
  DashboardSummary,
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
};
