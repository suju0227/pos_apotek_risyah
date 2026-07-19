import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { usePreferenceSettings, useUpdatePreferenceSettings } from '../settings.hooks';
import type { PreferenceSettings } from '../settings.types';

export function PreferencesTab() {
  const { data, isLoading, error } = usePreferenceSettings();
  const updateSettings = useUpdatePreferenceSettings();
  const showToast = useToastStore((state) => state.show);

  const [form, setForm] = useState<Partial<PreferenceSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      await updateSettings.mutateAsync(form as PreferenceSettings);
      showToast('Preferensi berhasil disimpan.');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferensi Sistem & UI</h2>
        
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tema Default User Baru</label>
            <select name="defaultTheme" value={form.defaultTheme ?? 'AUTO'} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
              <option value="AUTO">Auto (System)</option>
            </select>
          </div>
          <Input label="Interval Refresh Dashboard (detik)" name="dashboardRefreshInterval" type="number" min={10} value={form.dashboardRefreshInterval ?? 60} onChange={handleChange} />
          <Input label="Landing Page Default" name="defaultLandingPage" value={form.defaultLandingPage ?? '/dashboard'} onChange={handleChange} />
          <Input label="Jumlah Baris Tabel (Default)" name="defaultRowsPerPage" type="number" min={5} value={form.defaultRowsPerPage ?? 10} onChange={handleChange} />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Fitur UI Tambahan</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="enableAnimation" checked={form.enableAnimation ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Aktifkan Animasi</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="enableNotification" checked={form.enableNotification ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Aktifkan Notifikasi Pop-up</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="enableSound" checked={form.enableSound ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Aktifkan Suara Peringatan</span>
            </label>
          </div>
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
