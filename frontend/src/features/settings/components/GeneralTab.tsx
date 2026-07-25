import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { useAppSettings, useUpdateAppSettings } from '../settings.hooks';
import type { AppSettings } from '../settings.types';
import { useSettingsStore } from '../settings.store';

export function GeneralTab() {
  const { data, isLoading, error } = useAppSettings();
  const updateSettings = useUpdateAppSettings();
  const showToast = useToastStore((state) => state.show);
  const reloadPublic = useSettingsStore(state => state.load);

  const [form, setForm] = useState<Partial<AppSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form as AppSettings);
      showToast('Pengaturan umum berhasil disimpan.');
      reloadPublic();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Informasi Aplikasi</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Nama Situs (Site Name)" name="siteName" value={form.siteName ?? ''} onChange={handleChange} required />
          <Input label="Nama Aplikasi" name="applicationName" value={form.applicationName ?? ''} onChange={handleChange} required />
          <Input label="Nama Singkat" name="shortName" value={form.shortName ?? ''} onChange={handleChange} required />
          <Input label="Tagline" name="tagline" value={form.tagline ?? ''} onChange={handleChange} />
          <div className="lg:col-span-2">
            <Input label="Deskripsi" name="description" value={form.description ?? ''} onChange={handleChange} />
          </div>
          <div className="lg:col-span-2">
            <Input label="Footer Copyright" name="footerCopyright" value={form.footerCopyright ?? ''} onChange={handleChange} />
          </div>
        </div>
      </Card>
      
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lingkungan & Status</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Environment</label>
            <select name="environment" value={form.environment ?? 'development'} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="development">Development</option>
              <option value="production">Production</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex items-center mt-6">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="maintenanceMode" checked={form.maintenanceMode ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Aktifkan Maintenance Mode</span>
            </label>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded text-sm text-slate-600">
          <p><strong>Database:</strong> PostgreSQL (Readonly Info)</p>
          <p><strong>System Version:</strong> v1.0.0 (Readonly Info)</p>
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
