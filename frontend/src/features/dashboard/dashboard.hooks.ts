import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboard.api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: dashboardApi.lowStock,
  });
}

export function useExpiredBatches() {
  return useQuery({
    queryKey: ['dashboard', 'expired-batches'],
    queryFn: dashboardApi.expiredBatches,
  });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: dashboardApi.recentTransactions,
  });
}
