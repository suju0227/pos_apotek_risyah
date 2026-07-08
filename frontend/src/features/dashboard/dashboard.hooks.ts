import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './services/dashboard.api';

const realtimeDashboardQuery = {
  refetchInterval: 15_000,
  refetchOnWindowFocus: true,
  staleTime: 10_000,
};

export function useDashboardSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', startDate, endDate],
    queryFn: () => dashboardApi.summary(startDate, endDate),
    ...realtimeDashboardQuery,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock', 10],
    queryFn: () => dashboardApi.lowStock(10),
    ...realtimeDashboardQuery,
  });
}

export function useExpiredBatches(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'expiring-batches', 10],
    queryFn: () => dashboardApi.expiringBatches(10),
    ...realtimeDashboardQuery,
  });
}

export function useRecentTransactions(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'latest-sales', 5],
    queryFn: () => dashboardApi.latestSales(5),
    ...realtimeDashboardQuery,
  });
}

export function useDashboardRevenueTrend(enabled: boolean, startDate?: string, endDate?: string) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'revenue-trend', '7d', startDate, endDate],
    queryFn: () => dashboardApi.revenueTrend(startDate, endDate),
    ...realtimeDashboardQuery,
  });
}

export function useDashboardProfitTrend(enabled: boolean, startDate?: string, endDate?: string) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'profit-trend', '7d', startDate, endDate],
    queryFn: () => dashboardApi.profitTrend(startDate, endDate),
    ...realtimeDashboardQuery,
  });
}

export function useTopProducts(enabled: boolean, days = 7, limit = 5, startDate?: string, endDate?: string) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'top-products', days, limit, startDate, endDate],
    queryFn: () => dashboardApi.topProducts(days, limit, startDate, endDate),
    ...realtimeDashboardQuery,
  });
}

export function useDashboardPurchaseOrderSummary(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'purchase-order-summary'],
    queryFn: dashboardApi.purchaseOrderSummary,
    ...realtimeDashboardQuery,
  });
}

export function useDashboardPrescriptionSummary(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'prescription-summary'],
    queryFn: dashboardApi.prescriptionSummary,
    ...realtimeDashboardQuery,
  });
}

export function useDashboardRecentActivities(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['dashboard', 'recent-activities', 5],
    queryFn: () => dashboardApi.recentActivities(5),
    ...realtimeDashboardQuery,
  });
}
