import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { useSecuritySettings, useUpdateSecuritySettings } from '../settings.hooks';
import type { SecuritySettings } from '../settings.types';

export function SecurityTab() {
  const { data, isLoading, error } = useSecuritySettings();
  const updateSettings = useUpdateSecuritySettings();
  const showToast = useToastStore((state) => state.show);

  const [form, setForm] = useState<Partial<SecuritySettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = Number(value);
    }
    setForm(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form as SecuritySettings);
      showToast('Pengaturan keamanan berhasil disimpan.');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Kebijakan Keamanan & Password</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Batas Waktu Sesi (Menit)" name="sessionTimeout" type="number" min={5} value={form.sessionTimeout ?? 30} onChange={handleChange} />
          <Input label="Panjang Minimal Password" name="minimumPasswordLength" type="number" min={6} value={form.minimumPasswordLength ?? 8} onChange={handleChange} />
          <Input label="Kedaluwarsa Password (Hari)" name="passwordExpiration" type="number" min={0} value={form.passwordExpiration ?? 90} onChange={handleChange} />
          <Input label="Batas Maksimal Gagal Login" name="maxLoginAttempt" type="number" min={1} value={form.maxLoginAttempt ?? 5} onChange={handleChange} />
          <Input label="Masa Retensi Audit Log (Hari)" name="auditRetentionDays" type="number" min={1} value={form.auditRetentionDays ?? 180} onChange={handleChange} />
        </div>
        <div className="mt-6">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" name="enableTwoFactor" checked={form.enableTwoFactor ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-slate-700">Wajibkan Autentikasi Dua Faktor (2FA) untuk Semua Pengguna</span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  );
}
