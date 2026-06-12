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
    if (!form.pharmacyName?.trim()) {
      showToast('Nama apotek wajib diisi.');
      return;
    }
    if (!form.expiredAlertDays || form.expiredAlertDays < 1) {
      showToast('Ambang expired minimal 1 hari.');
      return;
    }

    try {
      await updateSettings.mutateAsync({
        pharmacyName: form.pharmacyName.trim(),
        address: form.address?.trim() || null,
        phone: form.phone?.trim() || null,
        expiredAlertDays: Number(form.expiredAlertDays),
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
        <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Profil apotek dan konfigurasi operasional dasar.
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
            label="Ambang expired alert hari"
            type="number"
            min={1}
            value={form.expiredAlertDays ?? 30}
            onChange={(event) =>
              setForm({ ...form, expiredAlertDays: Number(event.target.value) })
            }
          />
          <Input label="Timezone" value="Asia/Makassar" disabled />
          <Input label="Currency" value={data?.currency ?? 'IDR'} disabled />
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
