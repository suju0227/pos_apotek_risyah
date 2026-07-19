import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { DataTable } from '../../shared/components/DataTable';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToastStore } from '../../shared/components/toast.store';
import {
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useCreateSupplier,
  useCreateUnit,
  useDeactivateCategory,
  useDeactivateProduct,
  useDeactivateSupplier,
  useDeactivateUnit,
  useProducts,
  useSuppliers,
  useUnits,
} from './masterData.hooks';
import type {
  Category,
  Product,
  ProductUnit,
  Supplier,
  Unit,
} from './masterData.types';
import { ProductDetailPanel } from '../products/ProductDetailPanel';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional();

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  description: optionalText,
});

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  phone: optionalText,
  contactPerson: optionalText,
  address: optionalText,
});

const unitSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  symbol: optionalText,
});

const productSchema = z.object({
  code: z.string().trim().min(1, 'Kode wajib diisi'),
  barcode: optionalText,
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  genericName: optionalText,
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  baseUnitId: z.string().min(1, 'Satuan dasar wajib dipilih'),
  minStockBase: z.coerce.number().min(0, 'Stok minimum tidak boleh negatif'),
});

type CategoryForm = z.infer<typeof categorySchema>;
type SupplierForm = z.infer<typeof supplierSchema>;
type UnitForm = z.infer<typeof unitSchema>;
type ProductForm = z.infer<typeof productSchema>;
type ProductFormInput = z.input<typeof productSchema>;

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function FormError({ error }: { error?: unknown }) {
  if (!error) return null;
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {error instanceof Error ? error.message : 'Request gagal'}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-xs text-red-600">{message}</span>;
}



export function CategoriesPage() {
  const toast = useToastStore((state) => state.show);
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deactivateCategory = useDeactivateCategory();
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createCategory.mutateAsync(values);
    form.reset({ name: '', description: '' });
    toast('Kategori berhasil ditambahkan');
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kategori"
        subtitle="Kelola kelompok produk untuk pencarian dan laporan."
      />
      <Card>
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
          <Input
            label="Nama kategori"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Input label="Deskripsi" {...form.register('description')} />
          <Button className="self-end" disabled={createCategory.isPending}>
            Tambah
          </Button>
        </form>
        <FormError error={createCategory.error} />
      </Card>
      {categories.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {categories.isError ? <ErrorState message={categories.error.message} /> : null}
      {categories.data?.length === 0 ? (
        <EmptyState title="Kategori kosong" message="Tambahkan kategori produk pertama." />
      ) : null}
      {categories.data?.length ? (
        <DataTable<Category>
          data={categories.data}
          columns={[
            { key: 'name', header: 'Nama' },
            { key: 'description', header: 'Deskripsi' },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => <StatusBadge active={row.isActive} />,
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={deactivateCategory.isPending || !row.isActive}
                  onClick={async () => {
                    await deactivateCategory.mutateAsync(row.id);
                    toast('Kategori dinonaktifkan');
                  }}
                >
                  Nonaktifkan
                </Button>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function SuppliersPage() {
  const toast = useToastStore((state) => state.show);
  const suppliers = useSuppliers();
  const createSupplier = useCreateSupplier();
  const deactivateSupplier = useDeactivateSupplier();
  const form = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', phone: '', contactPerson: '', address: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createSupplier.mutateAsync(values);
    form.reset({ name: '', phone: '', contactPerson: '', address: '' });
    toast('Supplier berhasil ditambahkan');
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Supplier"
        subtitle="Kelola pemasok untuk pembelian dan batch obat."
      />
      <Card>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto]" onSubmit={onSubmit}>
          <Input
            label="Nama supplier"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Input label="Telepon" {...form.register('phone')} />
          <Input label="Kontak" {...form.register('contactPerson')} />
          <Input label="Alamat" {...form.register('address')} />
          <Button className="self-end" disabled={createSupplier.isPending}>
            Tambah
          </Button>
        </form>
        <FormError error={createSupplier.error} />
      </Card>
      {suppliers.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {suppliers.isError ? <ErrorState message={suppliers.error.message} /> : null}
      {suppliers.data?.length === 0 ? (
        <EmptyState title="Supplier kosong" message="Tambahkan supplier pertama." />
      ) : null}
      {suppliers.data?.length ? (
        <DataTable<Supplier>
          data={suppliers.data}
          columns={[
            { key: 'name', header: 'Nama' },
            { key: 'phone', header: 'Telepon' },
            { key: 'contactPerson', header: 'Kontak' },
            { key: 'address', header: 'Alamat' },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => <StatusBadge active={row.isActive} />,
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={deactivateSupplier.isPending || !row.isActive}
                  onClick={async () => {
                    await deactivateSupplier.mutateAsync(row.id);
                    toast('Supplier dinonaktifkan');
                  }}
                >
                  Nonaktifkan
                </Button>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function UnitsPage() {
  const toast = useToastStore((state) => state.show);
  const units = useUnits();
  const createUnit = useCreateUnit();
  const deactivateUnit = useDeactivateUnit();
  const form = useForm<UnitForm>({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: '', symbol: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createUnit.mutateAsync(values);
    form.reset({ name: '', symbol: '' });
    toast('Satuan berhasil ditambahkan');
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Satuan"
        subtitle="Kelola satuan dasar dan satuan jual produk."
      />
      <Card>
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
          <Input
            label="Nama satuan"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Input label="Simbol" {...form.register('symbol')} />
          <Button className="self-end" disabled={createUnit.isPending}>
            Tambah
          </Button>
        </form>
        <FormError error={createUnit.error} />
      </Card>
      {units.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {units.isError ? <ErrorState message={units.error.message} /> : null}
      {units.data?.length === 0 ? (
        <EmptyState title="Satuan kosong" message="Tambahkan satuan pertama." />
      ) : null}
      {units.data?.length ? (
        <DataTable<Unit>
          data={units.data}
          columns={[
            { key: 'name', header: 'Nama' },
            { key: 'symbol', header: 'Simbol' },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => <StatusBadge active={row.isActive} />,
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={deactivateUnit.isPending || !row.isActive}
                  onClick={async () => {
                    await deactivateUnit.mutateAsync(row.id);
                    toast('Satuan dinonaktifkan');
                  }}
                >
                  Nonaktifkan
                </Button>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function ProductsPage() {
  const toast = useToastStore((state) => state.show);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const categories = useCategories();
  const units = useUnits();
  const products = useProducts(search);
  const createProduct = useCreateProduct();
  const deactivateProduct = useDeactivateProduct();
  const form = useForm<ProductFormInput, unknown, ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      barcode: '',
      name: '',
      genericName: '',
      categoryId: '',
      baseUnitId: '',
      minStockBase: 0,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createProduct.mutateAsync(values);
    form.reset({
      code: '',
      barcode: '',
      name: '',
      genericName: '',
      categoryId: '',
      baseUnitId: '',
      minStockBase: 0,
    });
    toast('Produk berhasil ditambahkan');
  });

  const categoryOptions = categories.data ?? [];
  const unitOptions = units.data ?? [];
  const selectedProduct =
    products.data?.find((product) => product.id === selectedProductId) ?? null;



  return (
    <div className="space-y-5">
      <PageHeader
        title="Produk"
        subtitle="Kelola produk, kategori, satuan dasar, dan stok minimum."
      />
      <Card>
        <form className="grid gap-4 lg:grid-cols-3" onSubmit={onSubmit}>
          <Input
            label="Kode produk"
            {...form.register('code')}
            error={form.formState.errors.code?.message}
          />
          <Input label="Barcode" {...form.register('barcode')} />
          <Input
            label="Nama produk"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Input label="Nama generik" {...form.register('genericName')} />
          <Select
            label="Kategori"
            error={form.formState.errors.categoryId?.message}
            {...form.register('categoryId')}
          >
            <option value="">Pilih kategori</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Satuan dasar"
            error={form.formState.errors.baseUnitId?.message}
            {...form.register('baseUnitId')}
          >
            <option value="">Pilih satuan</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
          <Input
            label="Stok minimum"
            type="number"
            step="0.0001"
            {...form.register('minStockBase')}
            error={form.formState.errors.minStockBase?.message}
          />
          <div className="flex items-end">
            <Button disabled={createProduct.isPending}>Tambah produk</Button>
          </div>
        </form>
        <FormError error={createProduct.error} />
      </Card>
      <Card className="p-4">
        <Input
          label="Cari produk"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nama, kode, atau barcode"
        />
      </Card>
      {products.isLoading || categories.isLoading || units.isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : null}
      {products.isError ? <ErrorState message={products.error.message} /> : null}
      {products.data?.length === 0 ? (
        <EmptyState title="Produk kosong" message="Tambahkan produk pertama." />
      ) : null}
      {products.data?.length ? (
        <DataTable<Product>
          data={products.data}
          columns={[
            { key: 'code', header: 'Kode' },
            { key: 'name', header: 'Nama' },
            {
              key: 'category',
              header: 'Kategori',
              render: (row) => row.category?.name ?? '-',
            },
            {
              key: 'baseUnit',
              header: 'Satuan dasar',
              render: (row) => row.baseUnit?.name ?? '-',
            },
            {
              key: 'minStockBase',
              header: 'Stok minimum',
              render: (row) => row.minStockBase.toLocaleString('id-ID'),
            },
            {
              key: 'saleUnits',
              header: 'Satuan jual',
              render: (row) =>
                row.productUnits
                  .filter((productUnit) => productUnit.isSaleUnit && productUnit.isActive)
                  .map((productUnit) => productUnit.unit.name)
                  .join(', ') || '-',
            },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => <StatusBadge active={row.isActive} />,
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                <div className="flex flex-row items-center gap-1.5 whitespace-nowrap">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      selectedProductId === row.id ? 'primary' : 'secondary'
                    }
                    onClick={() => setSelectedProductId(row.id)}
                  >
                    Satuan jual
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={deactivateProduct.isPending || !row.isActive}
                    onClick={async () => {
                      await deactivateProduct.mutateAsync(row.id);
                      if (selectedProductId === row.id) setSelectedProductId(null);
                      toast('Produk dinonaktifkan');
                    }}
                  >
                    Nonaktifkan
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : null}
      {selectedProduct ? (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProductId(null)}
        />
      ) : null}
    </div>
  );
}
