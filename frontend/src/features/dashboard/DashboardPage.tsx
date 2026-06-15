import type { ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  BarChart3,
  CalendarClock,
  LineChart as LineChartIcon,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  useDashboardPaymentMethods,
  useDashboardSummary,
  useDashboardTopProducts,
  useDashboardTrends,
  useExpiredBatches,
  useLowStock,
  useRecentTransactions,
} from './dashboard.hooks';
import type {
  DashboardPaymentMethod,
  DashboardSummary,
  DashboardTopProduct,
  DashboardTrendItem,
  ExpiredBatchItem,
  LowStockItem,
  RecentTransaction,
} from './dashboard.types';

const paymentColors = ['#059669', '#0f766e', '#2563eb', '#7c3aed', '#f59e0b'];

export function DashboardPage() {
  const summary = useDashboardSummary();
  const trends = useDashboardTrends();
  const topProducts = useDashboardTopProducts();
  const paymentMethods = useDashboardPaymentMethods();
  const lowStock = useLowStock();
  const expiredBatches = useExpiredBatches();
  const recentTransactions = useRecentTransactions();
  const queries = [
    summary,
    trends,
    topProducts,
    paymentMethods,
    lowStock,
    expiredBatches,
    recentTransactions,
  ];

  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const error = queries.find((query) => query.error)?.error;

  const refreshAll = () => {
    for (const query of queries) {
      void query.refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          generatedAt={null}
          isFetching={isFetching}
          onRefresh={refreshAll}
        />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error && !summary.data) {
    return (
      <div className="space-y-4">
        <DashboardHeader
          generatedAt={null}
          isFetching={isFetching}
          onRefresh={refreshAll}
        />
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

  if (!summary.data) {
    return (
      <div className="space-y-4">
        <DashboardHeader
          generatedAt={null}
          isFetching={isFetching}
          onRefresh={refreshAll}
        />
        <EmptyState
          title="Dashboard belum memiliki data"
          message="Ringkasan operasional akan tampil setelah backend mengirim data."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        generatedAt={summary.data.generatedAt}
        isFetching={isFetching}
        onRefresh={refreshAll}
      />
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sebagian data gagal disinkronkan. Dashboard tetap menampilkan data terakhir
          yang tersedia.
        </div>
      ) : null}
      <SummaryGrid summary={summary.data} />
      <RealtimeChartGrid
        paymentMethods={paymentMethods.data ?? []}
        topProducts={topProducts.data ?? []}
        trends={trends.data ?? []}
      />
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
  isFetching,
  onRefresh,
}: {
  generatedAt: string | null;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live 15 detik
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Monitoring operasional, penjualan, stok, dan alert batch dari backend.
        </p>
        {generatedAt ? (
          <p className="mt-1 text-xs text-slate-500">
            Diperbarui {formatDateTimeWita(generatedAt)}
            {isFetching ? ' - menyinkronkan data terbaru...' : ''}
          </p>
        ) : null}
      </div>
      <Button type="button" variant="secondary" onClick={onRefresh}>
        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
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
      icon: LineChartIcon,
    },
    {
      label: 'Laba Minggu Ini',
      value: formatRupiah(summary.week.netProfit),
      helper: `${formatRupiah(summary.week.netRevenue)} omzet`,
      icon: LineChartIcon,
    },
    {
      label: 'Laba Bulan Ini',
      value: formatRupiah(summary.month.netProfit),
      helper: `${formatRupiah(summary.month.netRevenue)} omzet`,
      icon: LineChartIcon,
    },
    {
      label: 'Laba Tahun Ini',
      value: formatRupiah(summary.year.netProfit),
      helper: `${formatRupiah(summary.year.netRevenue)} omzet`,
      icon: LineChartIcon,
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

function RealtimeChartGrid({
  paymentMethods,
  topProducts,
  trends,
}: {
  paymentMethods: DashboardPaymentMethod[];
  topProducts: DashboardTopProduct[];
  trends: DashboardTrendItem[];
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <TrendChart items={trends} />
      <TopProductChart items={topProducts} />
      <PaymentMethodChart items={paymentMethods} />
    </section>
  );
}

function TrendChart({ items }: { items: DashboardTrendItem[] }) {
  const data = items.map((item) => ({
    ...item,
    dateLabel: formatCompactDate(item.date),
  }));

  return (
    <Card className="xl:col-span-2">
      <SectionTitle
        icon={Activity}
        title="Trend 14 Hari"
        description="Omzet dan laba bersih setelah koreksi retur."
      />
      {data.length ? (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="netRevenue" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={formatCompactNumber}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatRupiah(Number(value)),
                  name === 'netRevenue' ? 'Omzet bersih' : 'Laba bersih',
                ]}
                labelFormatter={(label) => `Tanggal ${label}`}
              />
              <Area
                dataKey="netRevenue"
                fill="url(#netRevenue)"
                name="Omzet bersih"
                stroke="#059669"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="netProfit"
                dot={false}
                name="Laba bersih"
                stroke="#2563eb"
                strokeWidth={2}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada trend"
            message="Grafik akan terisi setelah transaksi atau retur tercatat."
          />
        </div>
      )}
    </Card>
  );
}

function TopProductChart({ items }: { items: DashboardTopProduct[] }) {
  const data = items.map((item) => ({
    ...item,
    shortName:
      item.productName.length > 18
        ? `${item.productName.slice(0, 18)}...`
        : item.productName,
  }));

  return (
    <Card>
      <SectionTitle
        icon={BarChart3}
        title="Produk Terlaris"
        description="Top 5 produk berdasarkan qty base 7 hari terakhir."
      />
      {data.length ? (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={formatCompactNumber}
                type="number"
              />
              <YAxis
                dataKey="shortName"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                type="category"
                width={98}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue'
                    ? formatRupiah(Number(value))
                    : formatCompactNumber(Number(value)),
                  name === 'revenue' ? 'Omzet' : 'Qty base',
                ]}
              />
              <Bar dataKey="qtyBase" fill="#0f766e" name="Qty base" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada produk terlaris"
            message="Ranking akan muncul setelah penjualan tercatat."
          />
        </div>
      )}
    </Card>
  );
}

function PaymentMethodChart({ items }: { items: DashboardPaymentMethod[] }) {
  return (
    <Card>
      <SectionTitle
        icon={Wallet}
        title="Metode Pembayaran"
        description="Komposisi omzet bersih 7 hari terakhir."
      />
      {items.length ? (
        <>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="netRevenue"
                  innerRadius={48}
                  nameKey="paymentMethod"
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {items.map((item, index) => (
                    <Cell
                      key={item.paymentMethod}
                      fill={paymentColors[index % paymentColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatRupiah(Number(value)), 'Omzet bersih']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {items.map((item, index) => (
              <div
                key={item.paymentMethod}
                className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-slate-800">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: paymentColors[index % paymentColors.length] }}
                  />
                  {item.paymentMethod}
                </span>
                <span className="text-slate-600">{formatRupiah(item.netRevenue)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada pembayaran"
            message="Komposisi metode bayar akan muncul setelah transaksi tercatat."
          />
        </div>
      )}
    </Card>
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
                    Batch {item.batchNumber} - {item.categoryName}
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
  icon: ComponentType<{ size?: number }>;
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

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Makassar',
  }).format(new Date(value));
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);
}
