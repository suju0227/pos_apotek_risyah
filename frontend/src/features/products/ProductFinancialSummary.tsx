import { TrendingUp, DollarSign, Package, Percent, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../auth/auth.store';
import { formatRupiah, formatPercent } from '../../shared/utils/formatters';
import type { Product } from '../master-data/masterData.types';

type AccentKey = 'green' | 'blue' | 'amber' | 'rose' | 'default';

function StatCard({
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`rounded-lg border p-1.5 ${colors}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      {value === null ? (
        <div>
          <p className="text-sm font-semibold text-slate-300">—</p>
          <p className="mt-0.5 text-xs text-slate-400">Belum tersedia</p>
        </div>
      ) : (
        <div>
          <p className="text-base font-extrabold text-slate-800">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
      )}
    </div>
  );
}

interface ProductFinancialSummaryProps {
  product: Product;
}

export function ProductFinancialSummary({ product }: ProductFinancialSummaryProps) {
  const user = useAuthStore((state) => state.user);
  const canViewFinancials = user?.role === 'MANAGER' || user?.role === 'PEMILIK';

  if (!canViewFinancials) return null;

  const hasData = product.batchCount > 0;
  const isMarginPositive = product.marginActive >= 0;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <DollarSign className="h-4 w-4 text-emerald-600" />
        Ringkasan Finansial Aktif
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="HPP Aktif (per unit dasar)"
          value={hasData ? formatRupiah(product.hppActive) : null}
          icon={Package}
          accent="blue"
        />
        <StatCard
          label="Harga Jual Aktif (per unit dasar)"
          value={hasData ? formatRupiah(product.sellingPriceActive) : null}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Margin per Unit"
          value={hasData ? formatRupiah(product.marginActive) : null}
          sub={hasData ? formatPercent(product.marginPercentActive / 100) : undefined}
          icon={TrendingUp}
          accent={hasData ? (isMarginPositive ? 'green' : 'rose') : 'default'}
        />
        <StatCard
          label="Margin (%)"
          value={hasData ? formatPercent(product.marginPercentActive / 100) : null}
          icon={Percent}
          accent={hasData ? (isMarginPositive ? 'green' : 'rose') : 'default'}
        />
        <StatCard
          label="Total Batch Aktif"
          value={product.batchCount > 0 ? String(product.batchCount) : null}
          sub={product.batchCount > 0 ? 'batch dengan stok tersedia' : undefined}
          icon={BarChart2}
          accent="amber"
        />
        <StatCard
          label="Estimasi Laba Total"
          value={hasData ? formatRupiah(product.potensiProfit) : null}
          sub={hasData ? 'dari seluruh stok aktif' : undefined}
          icon={TrendingUp}
          accent={hasData ? 'green' : 'default'}
        />
      </div>
    </div>
  );
}
