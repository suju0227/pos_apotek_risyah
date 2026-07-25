import { useAuthStore } from '../auth/auth.store';
import { EmptyState } from '../../shared/components/EmptyState';
import { ProductFinancialSummary } from './ProductFinancialSummary';
import { ProductFinancialBatchHistory } from './ProductFinancialBatchHistory';
import { ProductFinancialAnalytics } from './ProductFinancialAnalytics';
import type { Product } from '../master-data/masterData.types';

interface ProductFinancialTabProps {
  product: Product;
}

export function ProductFinancialTab({ product }: ProductFinancialTabProps) {
  const user = useAuthStore((state) => state.user);
  const canViewFinancials = user?.role === 'MANAGER' || user?.role === 'PEMILIK';

  if (!canViewFinancials) {
    return (
      <EmptyState
        title="Akses terbatas"
        message="Informasi finansial hanya tersedia untuk Manager dan Pemilik."
      />
    );
  }

  return (
    <div className="space-y-8">
      <ProductFinancialSummary product={product} />
      <div className="border-t border-slate-100" />
      <ProductFinancialBatchHistory product={product} />
      <div className="border-t border-slate-100" />
      <ProductFinancialAnalytics product={product} />
    </div>
  );
}
