import { useQuery } from '@tanstack/react-query';
import { cashierApi } from './cashier.api';

export function useCashierProducts(q: string) {
  return useQuery({
    queryKey: ['cashier', 'products', q],
    queryFn: () => cashierApi.products(q),
  });
}
