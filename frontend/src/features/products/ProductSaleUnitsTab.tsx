// frontend/src/features/products/ProductSaleUnitsTab.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { DataTable } from '../../shared/components/DataTable';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToastStore } from '../../shared/components/toast.store';
import {
  useCreateProductUnit,
  useDeactivateProductUnit,
  useProductUnits,
  useUnits,
  useUpdateProductUnit,
} from '../master-data/masterData.hooks';
import type { Product, ProductUnit } from '../master-data/masterData.types';

const productUnitSchema = z.object({
  unitId: z.string().min(1, 'Satuan wajib dipilih'),
  conversionToBase: z.coerce.number().min(0.0001, 'Konversi harus lebih dari 0'),
  isDefaultSaleUnit: z.boolean(),
  isSaleUnit: z.boolean(),
  minSaleQty: z.coerce.number().min(0.001, 'Minimum jual harus lebih dari 0'),
  saleUnitNote: z.string().trim().optional(),
});

type ProductUnitFormInput = z.input<typeof productUnitSchema>;
type ProductUnitForm = z.output<typeof productUnitSchema>;

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600"
      />
      {label}
    </label>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
        active
          ? 'border-teal-500/15 bg-teal-500/8 text-teal-700'
          : 'border-slate-500/15 bg-slate-500/8 text-slate-500'
      }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

function FormError({ error }: { error: Error | null }) {
  if (!error) return null;
  return <p className="mt-2 text-sm text-rose-600">{error.message}</p>;
}

interface ProductSaleUnitsTabProps {
  productId: string;
  selectedProduct: Product;
}

export function ProductSaleUnitsTab({ productId, selectedProduct }: ProductSaleUnitsTabProps) {
  const toast = useToastStore((state) => state.show);
  const units = useUnits();
  const productUnits = useProductUnits(productId);
  const createProductUnit = useCreateProductUnit(productId);
  const updateProductUnit = useUpdateProductUnit(productId);
  const deactivateProductUnit = useDeactivateProductUnit(productId);

  const unitOptions = units.data ?? [];

  const productUnitForm = useForm<ProductUnitFormInput, unknown, ProductUnitForm>({
    resolver: zodResolver(productUnitSchema),
    defaultValues: {
      unitId: '',
      conversionToBase: 1,
      isDefaultSaleUnit: false,
      isSaleUnit: true,
      minSaleQty: 1,
      saleUnitNote: '',
    },
  });

  const onSubmitProductUnit = productUnitForm.handleSubmit(async (values) => {
    if (!productId) return;
    await createProductUnit.mutateAsync(values);
    productUnitForm.reset({
      unitId: '',
      conversionToBase: 1,
      isDefaultSaleUnit: false,
      isSaleUnit: true,
      minSaleQty: 1,
      saleUnitNote: '',
    });
    toast('Satuan produk berhasil ditambahkan');
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Satuan dasar: {selectedProduct.baseUnit.name}. Backend tetap
        memvalidasi satuan jual aktif saat checkout.
      </p>

      <form
        className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr] xl:grid-cols-[1fr_1fr_1fr_1fr_1.3fr_auto]"
        onSubmit={onSubmitProductUnit}
      >
        <Select
          label="Satuan"
          error={productUnitForm.formState.errors.unitId?.message}
          {...productUnitForm.register('unitId')}
        >
          <option value="">Pilih satuan</option>
          {unitOptions.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </Select>
        <Input
          label="Konversi ke dasar"
          type="number"
          step="0.0001"
          {...productUnitForm.register('conversionToBase')}
          error={productUnitForm.formState.errors.conversionToBase?.message}
        />
        <Input
          label="Minimum jual"
          type="number"
          step="0.001"
          {...productUnitForm.register('minSaleQty')}
          error={productUnitForm.formState.errors.minSaleQty?.message}
        />
        <div className="space-y-3 self-end pb-2">
          <CheckboxField
            label="Boleh dijual"
            checked={productUnitForm.watch('isSaleUnit')}
            onChange={(checked) => productUnitForm.setValue('isSaleUnit', checked)}
          />
          <CheckboxField
            label="Default jual"
            checked={productUnitForm.watch('isDefaultSaleUnit')}
            onChange={(checked) => productUnitForm.setValue('isDefaultSaleUnit', checked)}
          />
        </div>
        <Input
          label="Catatan"
          {...productUnitForm.register('saleUnitNote')}
          placeholder="Opsional"
        />
        <Button className="self-end" disabled={createProductUnit.isPending}>
          Tambah
        </Button>
      </form>
      <FormError error={createProductUnit.error} />

      {productUnits.isLoading ? <LoadingSkeleton rows={3} /> : null}
      {productUnits.isError ? (
        <ErrorState message={productUnits.error.message} />
      ) : null}
      {productUnits.data?.length === 0 ? (
        <EmptyState
          title="Satuan jual belum ada"
          message="Tambahkan satuan produk sebelum batch dan harga jual dibuat."
        />
      ) : null}
      {productUnits.data?.length ? (
        <DataTable<ProductUnit>
          data={productUnits.data}
          columns={[
            { key: 'unit', header: 'Satuan', render: (row) => row.unit.name },
            {
              key: 'conversionToBase',
              header: 'Konversi',
              render: (row) => row.conversionToBase.toLocaleString('id-ID'),
            },
            {
              key: 'minSaleQty',
              header: 'Min jual',
              render: (row) => row.minSaleQty.toLocaleString('id-ID'),
            },
            {
              key: 'isSaleUnit',
              header: 'Boleh dijual',
              render: (row) => <StatusBadge active={row.isSaleUnit} />,
            },
            {
              key: 'isDefaultSaleUnit',
              header: 'Default',
              render: (row) => (
                <span className="text-sm font-medium text-slate-700">
                  {row.isDefaultSaleUnit ? 'Ya' : '-'}
                </span>
              ),
            },
            { key: 'saleUnitNote', header: 'Catatan' },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => <StatusBadge active={row.isActive} />,
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      updateProductUnit.isPending ||
                      !row.isActive ||
                      row.isDefaultSaleUnit
                    }
                    onClick={async () => {
                      await updateProductUnit.mutateAsync({
                        productUnitId: row.id,
                        payload: {
                          isDefaultSaleUnit: true,
                          isSaleUnit: true,
                          isActive: true,
                        },
                      });
                      toast('Default satuan jual diperbarui');
                    }}
                  >
                    Jadikan default
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateProductUnit.isPending || !row.isActive}
                    onClick={async () => {
                      await updateProductUnit.mutateAsync({
                        productUnitId: row.id,
                        payload: { isSaleUnit: !row.isSaleUnit },
                      });
                      toast('Status satuan jual diperbarui');
                    }}
                  >
                    {row.isSaleUnit ? 'Nonjual' : 'Boleh jual'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={deactivateProductUnit.isPending || !row.isActive}
                    onClick={async () => {
                      await deactivateProductUnit.mutateAsync(row.id);
                      toast('Satuan produk dinonaktifkan');
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
      <FormError error={updateProductUnit.error} />
      <FormError error={deactivateProductUnit.error} />
    </div>
  );
}
