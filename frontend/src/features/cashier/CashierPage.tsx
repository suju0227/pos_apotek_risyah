import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { Input } from '../../shared/components/Input';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToastStore } from '../../shared/components/toast.store';
import { formatQty, formatRupiah } from '../../shared/utils/formatters';
import { useCashierProducts } from './cashier.hooks';
import { useCashierCartStore } from './cashierCart.store';
import type { CashierProduct, CashierProductUnit } from './cashier.types';

export function CashierPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const productsQuery = useCashierProducts(search);
  const { items, addItem, updateQty, removeItem, clear } = useCashierCartStore();
  const showToast = useToastStore((state) => state.show);
  const estimatedTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.qtySaleUnit * item.sellingPrice,
        0,
      ),
    [items],
  );

  const handleAddItem = (product: CashierProduct, unit: CashierProductUnit) => {
    addItem({ product, unit });
    showToast(`${product.name} ditambahkan ke keranjang.`);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-700">Kasir</p>
        <h1 className="text-2xl font-bold text-slate-950">Transaksi Kasir</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <Card>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchDraft);
              }}
            >
              <div className="flex-1">
                <Input
                  label="Cari produk"
                  placeholder="Nama, kode, barcode, atau generik"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" className="sm:mb-0">
                <Search size={16} />
                Cari
              </Button>
            </form>
          </Card>

          {productsQuery.isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : productsQuery.isError ? (
            <ErrorState
              title="Produk gagal dimuat"
              message={productsQuery.error.message}
            />
          ) : productsQuery.data?.length ? (
            <div className="grid gap-3">
              {productsQuery.data.map((product) => (
                <ProductResult
                  key={product.id}
                  product={product}
                  onAddItem={handleAddItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Produk tidak ditemukan"
              message="Produk aktif dengan stok dan satuan jual aktif akan tampil di sini."
            />
          )}
        </section>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Keranjang</h2>
                <p className="text-sm text-slate-500">{items.length} item</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={!items.length}
                onClick={() => {
                  clear();
                  showToast('Keranjang dikosongkan.');
                }}
              >
                <Trash2 size={16} />
                Kosongkan
              </Button>
            </div>

            {items.length ? (
              <div className="divide-y divide-slate-200">
                {items.map((item) => (
                  <div key={item.cartItemId} className="space-y-3 py-4 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">
                          {item.productName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.productCode} · {item.unitSymbol ?? item.unitName}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Hapus ${item.productName}`}
                        onClick={() => removeItem(item.cartItemId)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <QtyStepper
                        value={item.qtySaleUnit}
                        min={item.minSaleQty}
                        max={item.stockAvailable}
                        onChange={(qty) => updateQty(item.cartItemId, qty)}
                      />
                      <div className="text-right">
                        <div className="text-sm text-slate-500">
                          {formatRupiah(item.sellingPrice)}
                        </div>
                        <div className="font-semibold text-slate-950">
                          {formatRupiah(item.qtySaleUnit * item.sellingPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
                <ShoppingCart className="mx-auto text-slate-400" size={28} />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Belum ada item
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cari produk lalu pilih satuan jual untuk mulai transaksi.
                </p>
              </div>
            )}

            <div className="rounded-md bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Estimasi subtotal</span>
                <span className="font-semibold text-slate-950">
                  {formatRupiah(estimatedTotal)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Checkout dan pembayaran final akan diaktifkan pada fase berikutnya.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ProductResult({
  product,
  onAddItem,
}: {
  product: CashierProduct;
  onAddItem: (product: CashierProduct, unit: CashierProductUnit) => void;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-950">{product.name}</h2>
            {product.category ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {product.category.name}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {product.code}
            {product.barcode ? ` · ${product.barcode}` : ''}
            {product.genericName ? ` · ${product.genericName}` : ''}
          </div>
        </div>
        <div className="text-sm text-slate-600">
          Stok dasar:{' '}
          <span className="font-semibold text-slate-950">
            {formatQty(product.stockAvailableBase, product.baseUnit.symbol)}
          </span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {product.units.map((unit) => (
          <ProductUnitButton
            key={unit.productUnitId}
            unit={unit}
            onClick={() => onAddItem(product, unit)}
          />
        ))}
      </div>
    </Card>
  );
}

function ProductUnitButton({
  unit,
  onClick,
}: {
  unit: CashierProductUnit;
  onClick: () => void;
}) {
  const isBelowMinimum = unit.stockAvailable < unit.minSaleQty;

  return (
    <button
      type="button"
      disabled={isBelowMinimum}
      className="rounded-md border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-950">
            {unit.unitSymbol ?? unit.unitName}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Min {formatQty(unit.minSaleQty)} · Stok{' '}
            {formatQty(unit.stockAvailable, unit.unitSymbol)}
          </div>
          {isBelowMinimum ? (
            <div className="mt-1 text-xs font-medium text-amber-700">
              Stok kurang dari minimum jual
            </div>
          ) : unit.saleUnitNote ? (
            <div className="mt-1 text-xs text-slate-500">{unit.saleUnitNote}</div>
          ) : null}
        </div>
        <div className="text-right text-sm font-semibold text-emerald-700">
          {formatRupiah(unit.sellingPrice)}
        </div>
      </div>
    </button>
  );
}

function QtyStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const step = min || 1;

  return (
    <div className="flex items-center rounded-md border border-slate-200">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(value - step)}
        aria-label="Kurangi qty"
      >
        <Minus size={15} />
      </button>
      <input
        className="h-9 w-20 border-x border-slate-200 text-center text-sm font-semibold outline-none"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <button
        type="button"
        className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(value + step)}
        aria-label="Tambah qty"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
