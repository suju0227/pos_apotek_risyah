import { useAuthStore } from '../auth/auth.store';
import { formatRupiah } from '../../shared/utils/formatters';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import type { Product, BatchFinancialSnapshot } from '../master-data/masterData.types';

function BatchStatusBadge({ status }: { status: BatchFinancialSnapshot['status'] }) {
  const map: Record<
    BatchFinancialSnapshot['status'],
    { label: string; tone: 'emerald' | 'amber' | 'red' | 'slate' }
  > = {
    ACTIVE: { label: 'Aktif', tone: 'emerald' },
    EXPIRED: { label: 'Expired', tone: 'red' },
    OUT_OF_STOCK: { label: 'Habis', tone: 'amber' },
    INACTIVE: { label: 'Draft', tone: 'slate' },
  };
  const { label, tone } = map[status] ?? { label: status, tone: 'slate' };
  return <Badge tone={tone}>{label}</Badge>;
}

interface ProductFinancialBatchHistoryProps {
  product: Product;
}

export function ProductFinancialBatchHistory({ product }: ProductFinancialBatchHistoryProps) {
  const user = useAuthStore((state) => state.user);
  const canViewFinancials = user?.role === 'MANAGER' || user?.role === 'PEMILIK';

  if (!canViewFinancials) return null;

  const batches = product.batches ?? [];

  if (batches.length === 0) {
    return (
      <EmptyState
        title="Belum ada batch"
        message="Batch akan muncul setelah pembelian pertama dicatat."
      />
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Riwayat Financial Batch</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Batch', 'Harga Modal', 'HPP', 'Harga Jual', 'Margin', 'Expired', 'Status'].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {batches.map((batch) => {
              const isMarginPositive = batch.margin >= 0;
              return (
                <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                    {batch.batchNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {batch.costModalBase > 0 ? formatRupiah(batch.costModalBase) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-semibold">
                    {batch.hppBase > 0 ? formatRupiah(batch.hppBase) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {batch.sellingPriceBase > 0 ? formatRupiah(batch.sellingPriceBase) : '—'}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap font-semibold ${
                      batch.hppBase > 0
                        ? isMarginPositive
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {batch.hppBase > 0 ? formatRupiah(batch.margin) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(batch.expiredDate).toLocaleDateString('id-ID', {
                      timeZone: 'Asia/Makassar',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <BatchStatusBadge status={batch.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
