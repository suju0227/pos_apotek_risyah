import { useAuthStore } from '../../features/auth/auth.store';
import { formatRupiah, formatPercent } from '../utils/formatters';
import { Card } from './Card';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Percent, 
  Plus, 
  ArrowRight
} from 'lucide-react';

interface FinancialSummaryCardProps {
  costModalBase: number;
  additionalCostBase: number;
  hppBase: number;
  sellingPriceBase: number;
  margin: number;
  marginPercent: number;
  currentStockBase?: number;
  nilaiPersediaan?: number;
  potensiProfit?: number;
  title?: string;
  className?: string;
}

export function FinancialSummaryCard({
  costModalBase,
  additionalCostBase,
  hppBase,
  sellingPriceBase,
  margin,
  marginPercent,
  currentStockBase,
  nilaiPersediaan,
  potensiProfit,
  title = 'Ringkasan Finansial',
  className = '',
}: FinancialSummaryCardProps) {
  const user = useAuthStore((state) => state.user);
  const canViewFinancials = user?.role === 'MANAGER' || user?.role === 'PEMILIK';

  if (!canViewFinancials) {
    return null;
  }

  // Margin percentage to fraction for formatter
  const formattedMarginPercent = formatPercent(marginPercent / 100);
  const isMarginPositive = margin >= 0;

  return (
    <Card className={`overflow-hidden border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 p-0 ${className}`}>
      {/* Card Header with gradient accent */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 px-6 py-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          {title}
        </h4>
      </div>

      <div className="p-6">
        {/* Cost Formula Breakdown Row */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500">Harga Modal (Base)</span>
            <span className="text-sm font-bold text-slate-700 mt-1">
              {formatRupiah(costModalBase)}
            </span>
          </div>

          <div className="flex flex-col relative">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-slate-400 hidden sm:block">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-500 sm:pl-4">Biaya Tambahan</span>
            <span className="text-sm font-bold text-slate-700 mt-1 sm:pl-4">
              {formatRupiah(additionalCostBase)}
            </span>
          </div>

          <div className="flex flex-col relative border-t border-slate-200/60 pt-3 sm:border-t-0 sm:pt-0">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-slate-400 hidden sm:block">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium text-emerald-700 sm:pl-4">HPP (Base)</span>
            <span className="text-sm font-extrabold text-emerald-600 mt-1 sm:pl-4">
              {formatRupiah(hppBase)}
            </span>
          </div>
        </div>

        {/* Pricing, Margin and Stock Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Harga Jual (Base)</span>
              <Package className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-base font-extrabold text-slate-800 mt-2">
              {formatRupiah(sellingPriceBase)}
            </p>
          </div>

          <div className={`rounded-xl border p-4 shadow-sm ${
            isMarginPositive 
              ? 'border-emerald-100 bg-emerald-50/20' 
              : 'border-rose-100 bg-rose-50/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isMarginPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                Margin (Rp / %)
              </span>
              {isMarginPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Percent className="h-3.5 w-3.5 text-rose-400" />
              )}
            </div>
            <p className="text-base font-extrabold text-slate-800 mt-2">
              {formatRupiah(margin)}
            </p>
            <span className={`text-xs font-semibold mt-1 inline-block ${
              isMarginPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formattedMarginPercent}
            </span>
          </div>

          {currentStockBase !== undefined && (
            <div className="col-span-2 mt-2 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500">Nilai Persediaan</span>
                <span className="text-sm font-bold text-slate-800 mt-1">
                  {formatRupiah(nilaiPersediaan ?? (hppBase * currentStockBase))}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Stok: {currentStockBase} unit
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500">Potensi Profit</span>
                <span className="text-sm font-bold text-emerald-600 mt-1">
                  {formatRupiah(potensiProfit ?? (margin * currentStockBase))}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Dari sisa stok batch
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
