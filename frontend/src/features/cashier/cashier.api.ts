import { apiClient } from '../../shared/api/apiClient';
import type { CashierProduct } from './cashier.types';

export const cashierApi = {
  products: (q: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    const query = params.toString();
    return apiClient.get<CashierProduct[]>(
      `/cashier/products${query ? `?${query}` : ''}`,
    );
  },
};
