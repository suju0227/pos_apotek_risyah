import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboard.api';

const realtimeDashboardQuery = {
  refetchInterval: 15_000,
  refetchOnWindowFocus: true,
  staleTime: 10_000,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
    ...realtimeDashboardQuery,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: dashboardApi.lowStock,
    ...realtimeDashboardQuery,
  });
}

export function useExpiredBatches() {
  return useQuery({
    queryKey: ['dashboard', 'expired-batches'],
    queryFn: dashboardApi.expiredBatches,
    ...realtimeDashboardQuery,
  });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: dashboardApi.recentTransactions,
    ...realtimeDashboardQuery,
  });
}

export function useDashboardTrends() {
  return useQuery({
    queryKey: ['dashboard', 'trends', 14],
    queryFn: () => dashboardApi.trends(14),
    ...realtimeDashboardQuery,
  });
}

export function useDashboardTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'top-products', 7, 5],
    queryFn: () => dashboardApi.topProducts(7, 5),
    ...realtimeDashboardQuery,
  });
}

export function useDashboardPaymentMethods() {
  return useQuery({
    queryKey: ['dashboard', 'payment-methods', 7],
    queryFn: () => dashboardApi.paymentMethods(7),
    ...realtimeDashboardQuery,
  });
}
