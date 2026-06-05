import {
  AlertTriangle,
  ArrowDownRight,
  CalendarClock,
  LineChart,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { DataTable } from '../../shared/components/DataTable';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import {
  formatDate,
  formatDateTimeWita,
  formatQty,
  formatRupiah,
} from '../../shared/utils/formatters';
import {
  useDashboardSummary,
  useExpiredBatches,
  useLowStock,
  useRecentTransactions,
} from './dashboard.hooks';
import type {
  DashboardSummary,
  ExpiredBatchItem,
  LowStockItem,
  RecentTransaction,
} from './dashboard.types';

export function DashboardPage() {
  const summary = useDashboardSummary();
  const lowStock = useLowStock();
  const expiredBatches = useExpiredBatches();
  const recentTransactions = useRecentTransactions();
  const isLoading =
    summary.isLoading ||
    lowStock.isLoading ||
    expiredBatches.isLoading ||
    recentTransactions.isLoading;
  const error =
    summary.error ||
    lowStock.error ||
    expiredBatches.error ||
    recentTransactions.error;

  const refreshAll = () => {
    void summary.refetch();
    void lowStock.refetch();
    void expiredBatches.refetch();
    void recentTransactions.refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader onRefresh={refreshAll} generatedAt={null} />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error || !summary.data) {
    return (
      <div className="space-y-4">
        <DashboardHeader onRefresh={refreshAll} generatedAt={null} />
        <ErrorState
          title="Dashboard gagal dimuat"
          message={
            error instanceof Error
              ? error.message
              : 'Data dashboard belum dapat diambil dari backend.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        onRefresh={refreshAll}
        generatedAt={summary.data.generatedAt}
      />
      <SummaryGrid summary={summary.data} />
      <section className="grid gap-4 xl:grid-cols-2">
        <LowStockSection items={lowStock.data ?? []} />
        <ExpiredBatchSection items={expiredBatches.data ?? []} />
      </section>
      <RecentTransactionSection items={recentTransactions.data ?? []} />
    </div>
  );
}

function DashboardHeader({
  generatedAt,
  onRefresh,
}: {
  generatedAt: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan operasional dan kondisi stok apotek.
        </p>
        {generatedAt ? (
          <p className="mt-1 text-xs text-slate-500">
            Diperbarui {formatDateTimeWita(generatedAt)}
          </p>
        ) : null}
      </div>
      <Button type="button" variant="secondary" onClick={onRefresh}>
        <RefreshCw size={16} />
        Refresh
      </Button>
    </div>
  );
}

function SummaryGrid({ summary }: { summary: DashboardSummary }) {
  const cards = [
    {
      label: 'Omzet Hari Ini',
      value: formatRupiah(summary.today.netRevenue),
      helper: `${summary.today.transactionCount} transaksi`,
      icon: Wallet,
    },
    {
      label: 'Laba Hari Ini',
      value: formatRupiah(summary.today.netProfit),
      helper: `${summary.today.returnCount} retur`,
      icon: LineChart,
    },
    {
      label: 'Laba Minggu Ini',
      value: formatRupiah(summary.week.netProfit),
      helper: `${formatRupiah(summary.week.netRevenue)} omzet`,
      icon: LineChart,
    },
    {
      label: 'Laba Bulan Ini',
      value: formatRupiah(summary.month.netProfit),
      helper: `${formatRupiah(summary.month.netRevenue)} omzet`,
      icon: LineChart,
    },
    {
      label: 'Laba Tahun Ini',
      value: formatRupiah(summary.year.netProfit),
      helper: `${formatRupiah(summary.year.netRevenue)} omzet`,
      icon: LineChart,
    },
    {
      label: 'Transaksi Hari Ini',
      value: String(summary.today.transactionCount),
      helper: `${formatRupiah(summary.today.discountTotal)} diskon`,
      icon: ReceiptText,
    },
    {
      label: 'Stok Kritis',
      value: String(summary.lowStockCount),
      helper: 'Produk perlu dicek',
      icon: PackageSearch,
    },
    {
      label: 'Batch Mendekati Expired',
      value: String(summary.expiredBatchCount),
      helper: 'Dalam 30 hari',
      icon: CalendarClock,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="min-h-32">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon size={20} />
              </div>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

function LowStockSection({ items }: { items: LowStockItem[] }) {
  return (
    <Card>
      <SectionTitle
        icon={PackageSearch}
        title="Stok Kritis"
        description="Produk dengan stok tersedia <= stok minimum."
      />
      {items.length ? (
        <div className="mt-4">
          <DataTable<LowStockItem>
            data={items.slice(0, 8)}
            columns={[
              {
                key: 'name',
                header: 'Produk',
                render: (row) => (
                  <div>
                    <div className="font-medium text-slate-900">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.code}</div>
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Kategori',
                render: (row) => row.category.name,
              },
              {
                key: 'stockAvailableBase',
                header: 'Stok',
                render: (row) =>
                  formatQty(row.stockAvailableBase, row.baseUnit.symbol ?? row.baseUnit.name),
              },
              {
                key: 'minStockBase',
                header: 'Minimum',
                render: (row) =>
                  formatQty(row.minStockBase, row.baseUnit.symbol ?? row.baseUnit.name),
              },
            ]}
          />
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Tidak ada stok kritis"
            message="Semua stok aktif masih berada di atas batas minimum."
          />
        </div>
      )}
    </Card>
  );
}

function ExpiredBatchSection({ items }: { items: ExpiredBatchItem[] }) {
  return (
    <Card>
      <SectionTitle
        icon={AlertTriangle}
        title="Batch Mendekati Expired"
        description="Batch aktif dengan stok tersisa dan masa expired dekat."
      />
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.slice(0, 8).map((item) => (
            <div
              key={item.batchId}
              className="rounded-md border border-amber-200 bg-amber-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-950">{item.productName}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Batch {item.batchNumber} · {item.categoryName}
                  </div>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-amber-700">
                  {item.daysUntilExpired} hari
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <span>Expired {formatDate(item.expiredDate)}</span>
                <span>
                  Stok{' '}
                  {formatQty(
                    item.currentStockBase,
                    item.baseUnit.symbol ?? item.baseUnit.name,
                  )}
                </span>
                <span>Supplier {item.supplierName ?? '-'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Tidak ada batch mendekati expired"
            message="Belum ada batch aktif yang masuk periode alert."
          />
        </div>
      )}
    </Card>
  );
}

function RecentTransactionSection({ items }: { items: RecentTransaction[] }) {
  return (
    <Card>
      <SectionTitle
        icon={ReceiptText}
        title="Transaksi Terbaru"
        description="Daftar transaksi penjualan terakhir dari backend."
      />
      {items.length ? (
        <div className="mt-4">
          <DataTable<RecentTransaction>
            data={items}
            columns={[
              {
                key: 'saleNumber',
                header: 'Nomor',
                render: (row) => (
                  <div>
                    <div className="font-medium text-slate-900">{row.saleNumber}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateTimeWita(row.createdAt)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'cashier',
                header: 'Kasir',
                render: (row) => row.cashier.name,
              },
              {
                key: 'paymentMethod',
                header: 'Bayar',
              },
              {
                key: 'grandTotal',
                header: 'Total',
                render: (row) => formatRupiah(row.grandTotal),
              },
              {
                key: 'returnTotal',
                header: 'Retur',
                render: (row) => formatRupiah(row.returnTotal),
              },
              {
                key: 'netTotal',
                header: 'Net',
                render: (row) => (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <ArrowDownRight size={14} />
                    {formatRupiah(row.netTotal)}
                  </span>
                ),
              },
            ]}
          />
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada transaksi"
            message="Transaksi terbaru akan tampil setelah checkout berhasil."
          />
        </div>
      )}
    </Card>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
