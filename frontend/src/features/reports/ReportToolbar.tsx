import { useState } from 'react';
import { FileDown, Search } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { useCategories, useProducts } from '../master-data/masterData.hooks';
import { useUsers } from '../users/users.hooks';
import { useBatches } from '../batches/batch.hooks';
import type { ReportFilters } from './report.types';

type ReportToolbarProps = {
  filters: ReportFilters;
  mode: 'sales' | 'profit';
  isExporting: boolean;
  onChange: (filters: ReportFilters) => void;
  onExport: (format: 'xlsx' | 'pdf') => void;
};

export function ReportToolbar({
  filters,
  mode,
  isExporting,
  onChange,
  onExport,
}: ReportToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const products = useProducts('');
  const categories = useCategories();
  const cashiers = useUsers();
  const batches = useBatches();

  const update = (key: keyof ReportFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-xs transition-all duration-300">
      <div className="flex flex-col gap-4">
        {/* Main Filters: Start & End Date */}
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4 items-end">
          <Input
            label="Tanggal Mulai"
            type="date"
            value={filters.startDate ?? ''}
            onChange={(event) => update('startDate', event.target.value)}
          />
          <Input
            label="Tanggal Selesai"
            type="date"
            value={filters.endDate ?? ''}
            onChange={(event) => update('endDate', event.target.value)}
          />
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="secondary"
              className="h-10 text-xs font-semibold"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Sembunyikan Filter' : 'Filter Lanjutan'}
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {showAdvanced ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {mode === 'sales' ? (
              <Select
                label="Metode Bayar"
                value={filters.paymentMethod ?? ''}
                onChange={(event) => update('paymentMethod', event.target.value)}
              >
                <option value="">Semua</option>
                <option value="CASH">CASH</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="QRIS">QRIS</option>
                <option value="DEBIT">DEBIT</option>
              </Select>
            ) : (
              <Select
                label="No. Batch"
                value={filters.batchId ?? ''}
                onChange={(event) => update('batchId', event.target.value)}
              >
                <option value="">Semua Batch</option>
                {batches.data?.map((b) => (
                  <option key={b.id} value={b.batchNumber}>
                    {b.batchNumber}
                  </option>
                ))}
              </Select>
            )}

            <Select
              label="Produk"
              value={filters.productId ?? ''}
              onChange={(event) => update('productId', event.target.value)}
            >
              <option value="">Semua Produk</option>
              {products.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select
              label="Kategori"
              value={filters.categoryId ?? ''}
              onChange={(event) => update('categoryId', event.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            {mode === 'sales' ? (
              <Select
                label="Kasir"
                value={filters.cashierId ?? ''}
                onChange={(event) => update('cashierId', event.target.value)}
              >
                <option value="">Semua Kasir</option>
                {cashiers.data
                  ?.filter((u) => u.role === 'KASIR' || u.role === 'MANAGER')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </Select>
            ) : null}
          </div>
        ) : null}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" onClick={() => onChange({ ...filters })}>
            <Search size={16} />
            Terapkan Filter
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isExporting}
            onClick={() => onExport('xlsx')}
          >
            <FileDown size={16} />
            Excel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isExporting}
            onClick={() => onExport('pdf')}
          >
            <FileDown size={16} />
            PDF
          </Button>
        </div>
      </div>
    </section>
  );
}
