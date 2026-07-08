import { useEffect, useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { ErrorState } from '../../shared/components/ErrorState';
import { Input } from '../../shared/components/Input';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToastStore } from '../../shared/components/toast.store';
import { useSettings, useUpdateSettings } from './settings.hooks';
import type { UpdateSettingsPayload } from './settings.types';

export function SettingsPage() {
  const { data, isLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();
  const showToast = useToastStore((state) => state.show);
  const [form, setForm] = useState<UpdateSettingsPayload>({
    pharmacyName: '',
    address: '',
    phone: '',
    expiredAlertDays: 30,
    timezone: 'Asia/Makassar',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      pharmacyName: data.pharmacyName,
      address: data.address ?? '',
      phone: data.phone ?? '',
      expiredAlertDays: data.expiredAlertDays,
      timezone: data.timezone,
    });
  }, [data]);

  const handleSubmit = async () => {
    const expiredAlertDays = Number(form.expiredAlertDays);

    if (!form.pharmacyName?.trim()) {
      showToast('Nama apotek wajib diisi.');
      return;
    }
    if (!Number.isInteger(expiredAlertDays) || expiredAlertDays < 1) {
      showToast('Ambang peringatan expired harus angka bulat minimal 1 hari.');
      return;
    }

    try {
      await updateSettings.mutateAsync({
        pharmacyName: form.pharmacyName.trim(),
        address: form.address?.trim() || null,
        phone: form.phone?.trim() || null,
        expiredAlertDays,
        timezone: 'Asia/Makassar',
      });
      showToast('Pengaturan berhasil disimpan.');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Pengaturan Apotek</h1>
        <p className="mt-1 text-sm text-slate-600">
          Profil apotek dan konfigurasi operasional dasar untuk dashboard, alert expired,
          dan dokumen internal.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            label="Nama apotek"
            value={form.pharmacyName ?? ''}
            onChange={(event) => setForm({ ...form, pharmacyName: event.target.value })}
          />
          <Input
            label="Telepon"
            value={form.phone ?? ''}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <Input
            label="Alamat"
            value={form.address ?? ''}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
          <Input
            label="Ambang peringatan expired (hari)"
            type="number"
            min={1}
            value={form.expiredAlertDays ?? 30}
            onChange={(event) =>
              setForm({ ...form, expiredAlertDays: Number(event.target.value) })
            }
          />
          <Input label="Zona waktu operasional" value="Asia/Makassar" disabled />
          <Input label="Mata uang" value={data?.currency ?? 'IDR'} disabled />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Zona waktu dan mata uang dikunci untuk V1. Perubahan profil dicatat di audit log
          backend.
        </p>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Template Dokumen</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Template Cetak Pemesanan (PO) - Format HTML
            </label>
            <p className="text-xs text-slate-500">
              Gunakan placeholder: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{poNumber}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{supplierName}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{orderDate}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{itemsTable}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{pharmacyName}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{pharmacyAddress}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{`{{pharmacyPhone}}`}</code>
            </p>
            <textarea
              className="w-full h-64 rounded-md border border-slate-300 p-3 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="<html>...</html>"
              value={form.poPrintTemplate ?? ''}
              onChange={(e) => setForm({ ...form, poPrintTemplate: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-5">
          <Button type="button" onClick={handleSubmit} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
