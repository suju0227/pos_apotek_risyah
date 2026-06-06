import { apiClient } from '../../shared/api/apiClient';
import type {
  CreatePurchasePayload,
  Purchase,
  PurchaseDraftFromPo,
} from './purchase.types';

export const purchaseApi = {
  list: () => apiClient.get<Purchase[]>('/purchases'),
  detail: (id: string) => apiClient.get<Purchase>(`/purchases/${id}`),
  create: (payload: CreatePurchasePayload) =>
    apiClient.post<Purchase>('/purchases', payload),
  draftFromPo: (poId: string) =>
    apiClient.get<PurchaseDraftFromPo>(`/purchases/create-from-po/${poId}`),
};
