import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseApi } from './purchase.api';

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: purchaseApi.list,
  });
}

export function usePurchase(id: string | null) {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: () => purchaseApi.detail(id ?? ''),
    enabled: Boolean(id),
  });
}

export function usePurchaseDraftFromPo(poId: string | null) {
  return useQuery({
    queryKey: ['purchases', 'draft-from-po', poId],
    queryFn: () => purchaseApi.draftFromPo(poId ?? ''),
    enabled: Boolean(poId),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  });
}
