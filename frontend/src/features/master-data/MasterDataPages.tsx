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
  useCategoriesTree,
  useCreateCategory,
  useCreateProduct,
  useCreateSupplier,
  useCreateUnit,
  useDeactivateCategory,
  useDeleteCategory,
  useDeactivateProduct,
  useDeactivateSupplier,
  useDeactivateUnit,
  useProducts,
  useSuppliers,
  useUnits,
  useDosageForms,
  useCreateDosageForm,
  useUpdateDosageForm,
  useDeactivateDosageForm,
  useDeleteDosageForm,
} from './masterData.hooks';
import type {
  Category,
  Product,
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
  parentId: optionalText,
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
  parentCategoryId: z.string().min(1, 'Kategori wajib dipilih'),
  categoryId: z.string().optional(),
  baseUnitId: z.string().min(1, 'Satuan dasar wajib dipilih'),
  minStockBase: z.coerce.number().min(0, 'Stok minimum tidak boleh negatif'),
  dosageFormId: optionalText,
  storageLocationId: optionalText,
});

type CategoryForm = z.infer<typeof categorySchema>;
type SupplierForm = z.infer<typeof supplierSchema>;
type UnitForm = z.infer<typeof unitSchema>;
type ProductForm = z.infer<typeof productSchema>;

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

// Collapsible tree item for categories
function CategoryTreeItem({
  node,
  onDeactivate,
  onDelete,
  level = 0,
}: {
  node: Category;
  onDeactivate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-3 hover:bg-slate-50 transition-colors shadow-xs"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              {isOpen ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-5 h-5 text-slate-300 flex items-center justify-center">•</span>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span className="font-semibold text-slate-900">{node.name}</span>
            {node.description && (
              <span className="text-xs text-slate-500 font-normal sm:ml-2">
                — {node.description}
              </span>
            )}
          </div>
          <span className="ml-2">
            <StatusBadge active={node.isActive} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!node.isActive}
            onClick={() => onDeactivate(node.id)}
          >
            Nonaktifkan
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(node.id)}
          >
            Hapus
          </Button>
        </div>
      </div>
      {hasChildren && isOpen && (
        <div className="space-y-1 mt-1">
          {node.children?.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              onDeactivate={onDeactivate}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesPage() {
  const toast = useToastStore((state) => state.show);
  const categoriesFlat = useCategories();
  const categoriesTree = useCategoriesTree();
  const createCategory = useCreateCategory();
  const deactivateCategory = useDeactivateCategory();
  const deleteCategory = useDeleteCategory();
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', parentId: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        description: values.description,
        parentId: values.parentId || null,
      };
      await createCategory.mutateAsync(payload);
      form.reset({ name: '', description: '', parentId: '' });
      toast('Kategori berhasil ditambahkan');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menambahkan kategori');
    }
  });

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateCategory.mutateAsync(id);
      toast('Kategori berhasil dinonaktifkan');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menonaktifkan kategori');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini secara permanen?')) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast('Kategori berhasil dihapus');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menghapus kategori');
    }
  };

  // Only list active root categories as possible parent options (two-level UI restriction)
  const parentOptions = categoriesFlat.data?.filter((c) => !c.parentId && c.isActive) || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kategori"
        subtitle="Kelola kelompok produk untuk pencarian dan laporan."
      />
      <Card>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
          <Input
            label="Nama kategori"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Select
            label="Kategori Induk (Opsional)"
            error={form.formState.errors.parentId?.message}
            {...form.register('parentId')}
          >
            <option value="">-- Kategori Utama (Root) --</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="Deskripsi" {...form.register('description')} />
          <div className="md:col-span-3 flex justify-end">
            <Button disabled={createCategory.isPending}>
              Tambah Kategori
            </Button>
          </div>
        </form>
        <FormError error={createCategory.error} />
      </Card>
      
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Struktur Hirarki Kategori</h2>
        {categoriesTree.isLoading ? <LoadingSkeleton rows={5} /> : null}
        {categoriesTree.isError ? <ErrorState message={categoriesTree.error.message} /> : null}
        {categoriesTree.data?.length === 0 ? (
          <EmptyState title="Kategori kosong" message="Tambahkan kategori produk pertama." />
        ) : null}
        {categoriesTree.data?.length ? (
          <div className="space-y-2 max-w-4xl">
            {categoriesTree.data.map((node) => (
              <CategoryTreeItem
                key={node.id}
                node={node}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : null}
      </div>
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
        subtitle="Kelola distributor resmi obat dan alat kesehatan."
      />
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Input
            label="Nama supplier"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Input label="Telepon" {...form.register('phone')} />
          <Input label="Contact Person" {...form.register('contactPerson')} />
          <Input label="Alamat" {...form.register('address')} />
          <div className="md:col-span-2 flex justify-end">
            <Button disabled={createSupplier.isPending}>Tambah supplier</Button>
          </div>
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
            { key: 'phone', header: 'Telepon', render: (row) => row.phone ?? '-' },
            {
              key: 'contactPerson',
              header: 'Contact Person',
              render: (row) => row.contactPerson ?? '-',
            },
            { key: 'address', header: 'Alamat', render: (row) => row.address ?? '-' },
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
        subtitle="Kelola satuan kemasan obat seperti Box, Strip, Tablet."
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
        <EmptyState title="Satuan kosong" message="Tambahkan satuan obat pertama." />
      ) : null}
      {units.data?.length ? (
        <DataTable<Unit>
          data={units.data}
          columns={[
            { key: 'name', header: 'Nama' },
            { key: 'symbol', header: 'Simbol', render: (row) => row.symbol ?? '-' },
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

// Temporary hardcoded options for storage locations (preparation fields)
const STORAGE_LOCATION_OPTIONS = [
  { value: 'rak-a', label: 'Rak A' },
  { value: 'rak-b', label: 'Rak B' },
  { value: 'lemari-pendingin', label: 'Lemari Pendingin' },
  { value: 'etalase-depan', label: 'Etalase Depan' },
];

export function ProductsPage() {
  const toast = useToastStore((state) => state.show);
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterDosageFormId, setFilterDosageFormId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const categoriesFlat = useCategories();
  const categoriesTree = useCategoriesTree();
  const units = useUnits();
  const dosageForms = useDosageForms();
  const products = useProducts(search, filterCategoryId, filterDosageFormId);
  const createProduct = useCreateProduct();
  const deactivateProduct = useDeactivateProduct();
  
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      barcode: '',
      name: '',
      genericName: '',
      parentCategoryId: '',
      categoryId: '',
      baseUnitId: '',
      minStockBase: 0,
      dosageFormId: '',
      storageLocationId: '',
    },
  });

  const watchParentCategoryId = form.watch('parentCategoryId');
  const subcategories = categoriesTree.data?.find((c) => c.id === watchParentCategoryId)?.children || [];
  const hasSubcategories = subcategories.length > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    if (hasSubcategories && !values.categoryId) {
      form.setError('categoryId', { type: 'manual', message: 'Subkategori wajib dipilih' });
      return;
    }

    const finalCategoryId = hasSubcategories ? values.categoryId! : values.parentCategoryId;

    try {
      const payload = {
        code: values.code,
        barcode: values.barcode,
        name: values.name,
        genericName: values.genericName,
        categoryId: finalCategoryId,
        baseUnitId: values.baseUnitId,
        minStockBase: values.minStockBase,
        dosageFormId: values.dosageFormId || undefined,
        storageLocationId: values.storageLocationId || undefined,
      };

      await createProduct.mutateAsync(payload);
      form.reset({
        code: '',
        barcode: '',
        name: '',
        genericName: '',
        parentCategoryId: '',
        categoryId: '',
        baseUnitId: '',
        minStockBase: 0,
        dosageFormId: '',
        storageLocationId: '',
      });
      toast('Produk berhasil ditambahkan');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menambahkan produk');
    }
  });

  const parentCategoryOptions = categoriesTree.data?.filter((c) => c.isActive) || [];
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
            label="Kategori Utama"
            error={form.formState.errors.parentCategoryId?.message}
            {...form.register('parentCategoryId')}
          >
            <option value="">Pilih kategori utama</option>
            {parentCategoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {hasSubcategories ? (
            <Select
              label="Subkategori"
              error={form.formState.errors.categoryId?.message}
              {...form.register('categoryId')}
            >
              <option value="">Pilih subkategori</option>
              {subcategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="hidden lg:block"></div>
          )}

          <Select
            label="Satuan dasar"
            error={form.formState.errors.baseUnitId?.message}
            {...form.register('baseUnitId')}
          >
            <option value="">Pilih satuan dasar</option>
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

          {/* Preparation Fields: Dosage Form and Storage Location */}
          <Select
            label="Bentuk Sediaan"
            error={form.formState.errors.dosageFormId?.message}
            {...form.register('dosageFormId')}
          >
            <option value="">-- Pilih Bentuk Sediaan --</option>
            {dosageForms.data?.filter((df) => df.isActive).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} ({opt.code})
              </option>
            ))}
          </Select>

          <Select
            label="Lokasi Penyimpanan (Persiapan)"
            error={form.formState.errors.storageLocationId?.message}
            {...form.register('storageLocationId')}
          >
            <option value="">-- Pilih Lokasi --</option>
            {STORAGE_LOCATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <div className="lg:col-span-3 flex justify-end">
            <Button disabled={createProduct.isPending}>Tambah produk</Button>
          </div>
        </form>
        <FormError error={createProduct.error} />
      </Card>

      <Card className="p-4 grid gap-4 md:grid-cols-3">
        <Input
          label="Cari produk"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nama, kode, atau barcode"
        />
        <Select
          label="Filter Kategori"
          value={filterCategoryId}
          onChange={(event) => setFilterCategoryId(event.target.value)}
        >
          <option value="">Semua Kategori</option>
          {categoriesFlat.data?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <Select
          label="Filter Bentuk Sediaan"
          value={filterDosageFormId}
          onChange={(event) => setFilterDosageFormId(event.target.value)}
        >
          <option value="">Semua Bentuk Sediaan</option>
          {dosageForms.data?.map((df) => (
            <option key={df.id} value={df.id}>
              {df.name}
            </option>
          ))}
        </Select>
      </Card>

      {products.isLoading || categoriesFlat.isLoading || units.isLoading ? (
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

const dosageFormSchema = z.object({
  code: z.string().trim().min(1, 'Kode wajib diisi'),
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  description: optionalText,
});

export function DosageFormsPage() {
  const toast = useToastStore((state) => state.show);
  const [search, setSearch] = useState('');
  
  const dosageForms = useDosageForms();
  const createDosageForm = useCreateDosageForm();
  const deactivateDosageForm = useDeactivateDosageForm();
  const deleteDosageForm = useDeleteDosageForm();
  
  const form = useForm({
    resolver: zodResolver(dosageFormSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createDosageForm.mutateAsync(values);
      form.reset({ code: '', name: '', description: '' });
      toast('Bentuk sediaan berhasil ditambahkan');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menambahkan bentuk sediaan');
    }
  });

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateDosageForm.mutateAsync(id);
      toast('Bentuk sediaan berhasil dinonaktifkan');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menonaktifkan bentuk sediaan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bentuk sediaan ini?')) return;
    try {
      await deleteDosageForm.mutateAsync(id);
      toast('Bentuk sediaan berhasil dihapus');
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || 'Gagal menghapus bentuk sediaan');
    }
  };

  const filteredData = dosageForms.data?.filter((df) => {
    const s = search.toLowerCase();
    return df.code.toLowerCase().includes(s) || df.name.toLowerCase().includes(s);
  }) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bentuk Sediaan</h1>
          <p className="text-muted-foreground">
            Kelola standar bentuk sediaan obat untuk penyeragaman resep dan master produk.
          </p>
        </div>
      </div>
      <Card className="p-5">
        <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
          <Input
            label="Kode sediaan (misal: TAB, SIR)"
            {...form.register('code')}
            error={form.formState.errors.code?.message}
          />
          <Input
            label="Nama bentuk sediaan"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <Input label="Deskripsi" {...form.register('description')} />
          <div className="md:col-span-3 flex justify-end">
            <Button disabled={createDosageForm.isPending}>
              Tambah Bentuk Sediaan
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <Input
          label="Cari bentuk sediaan"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nama atau kode bentuk sediaan"
        />
      </Card>

      {dosageForms.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {dosageForms.isError ? <ErrorState message={dosageForms.error.message} /> : null}
      {dosageForms.data && filteredData.length === 0 ? (
        <EmptyState title="Bentuk sediaan tidak ditemukan" message="Coba kata kunci pencarian lain atau tambahkan baru." />
      ) : null}

      {filteredData.length ? (
        <DataTable<any>
          data={filteredData}
          columns={[
            { key: 'code', header: 'Kode' },
            { key: 'name', header: 'Nama' },
            { key: 'description', header: 'Deskripsi', render: (row) => row.description ?? '-' },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  row.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {row.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              ),
            },
            {
              key: 'productCount',
              header: 'Jumlah Produk',
              render: (row) => `${row.productCount || 0} produk`,
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={deactivateDosageForm.isPending || !row.isActive}
                    onClick={() => handleDeactivate(row.id)}
                  >
                    Nonaktifkan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteDosageForm.isPending}
                    onClick={() => handleDelete(row.id)}
                  >
                    Hapus
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
