import { useMutation, useQuery } from '@tanstack/react-query';
import { cashierApi } from './cashier.api';
import type { CreateSalePayload } from './cashier.types';

export function useCashierProducts(q: string) {
  return useQuery({
    queryKey: ['cashier', 'products', q],
    queryFn: () => cashierApi.products(q),
  });
}

export function useCreateCashierSale() {
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateSalePayload;
      idempotencyKey: string;
    }) => cashierApi.createSale(payload, idempotencyKey),
  });
}
