import { TrendingUp, TrendingDown, Package, Layers, ArrowDownUp } from 'lucide-react';
import { useAuthStore } from '../auth/auth.store';
import { formatRupiah } from '../../shared/utils/formatters';
import type { Product } from '../master-data/masterData.types';

type AccentKey = 'green' | 'blue' | 'amber' | 'rose' | 'default';

function AnalyticCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | null;
  sub?: string;
  icon: React.ElementType;
  accent?: AccentKey;
}) {
  const accentMap: Record<AccentKey, string> = {
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    default: 'text-slate-600 bg-slate-50 border-slate-100',
  };
  const colors = accentMap[accent ?? 'default'];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`rounded-lg border p-1.5 ${colors}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      {value === null ? (
        <p className="text-sm font-semibold text-slate-300">— Belum tersedia</p>
      ) : (
        <div>
          <p className="text-sm font-extrabold text-slate-800">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
      )}
    </div>
  );
}

interface ProductFinancialAnalyticsProps {
  product: Product;
}

export function ProductFinancialAnalytics({ product }: ProductFinancialAnalyticsProps) {
  const user = useAuthStore((state) => state.user);
  const canViewFinancials = user?.role === 'MANAGER' || user?.role === 'PEMILIK';

  if (!canViewFinancials) return null;

  const hasData = product.batchCount > 0;
  const batches = product.batches ?? [];

  // FEFO batch = first ACTIVE batch (backend already sorts by expiredDate asc)
  const fefoBatch = batches.find((b) => b.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Analitik Financial</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnalyticCard
          label="HPP Tertinggi"
          value={hasData ? formatRupiah(product.hppMax) : null}
          sub={hasData ? 'dari semua batch aktif' : undefined}
          icon={TrendingUp}
          accent="amber"
        />
        <AnalyticCard
          label="HPP Terendah"
          value={hasData ? formatRupiah(product.hppMin) : null}
          sub={hasData ? 'dari semua batch aktif' : undefined}
          icon={TrendingDown}
          accent="blue"
        />
        <AnalyticCard
          label="Total Batch Aktif"
          value={product.batchCount > 0 ? String(product.batchCount) : null}
          sub="batch dengan stok tersedia"
          icon={Layers}
          accent="green"
        />
        <AnalyticCard
          label="Nilai Persediaan"
          value={hasData ? formatRupiah(product.nilaiPersediaan) : null}
          sub={hasData ? 'HPP × stok semua batch' : undefined}
          icon={Package}
          accent="blue"
        />
        <AnalyticCard
          label="Batch FEFO Aktif"
          value={fefoBatch ? fefoBatch.batchNumber : null}
          sub={
            fefoBatch
              ? `Expired: ${new Date(fefoBatch.expiredDate).toLocaleDateString('id-ID', {
                  timeZone: 'Asia/Makassar',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}`
              : undefined
          }
          icon={ArrowDownUp}
          accent="amber"
        />
        <AnalyticCard
          label="Total Batch (semua status)"
          value={String(batches.length)}
          sub={batches.length > 0 ? 'termasuk expired & habis' : undefined}
          icon={Layers}
          accent="default"
        />
      </div>
    </div>
  );
}
