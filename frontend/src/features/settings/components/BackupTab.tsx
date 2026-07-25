import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { usePreferenceSettings, useUpdatePreferenceSettings } from '../settings.hooks';
import type { PreferenceSettings } from '../settings.types';

export function BackupTab() {
  const { data, isLoading, error } = usePreferenceSettings();
  const updateSettings = useUpdatePreferenceSettings();
  const showToast = useToastStore((state) => state.show);

  const [form, setForm] = useState<Partial<PreferenceSettings>>({});
  const [isBackingUp, setIsBackingUp] = useState(false);

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
      await updateSettings.mutateAsync(form as PreferenceSettings);
      showToast('Konfigurasi backup berhasil disimpan.');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleManualBackup = () => {
    setIsBackingUp(true);
    // Simulate backup endpoint call
    setTimeout(() => {
      setIsBackingUp(false);
      showToast('Backup berhasil diselesaikan.');
    }, 2000);
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Backup Manual</h2>
            <p className="text-sm text-slate-600">Buat cadangan database dan file konfigurasi secara instan.</p>
          </div>
          <Button type="button" onClick={handleManualBackup} disabled={isBackingUp}>
            {isBackingUp ? 'Sedang Memproses...' : 'Mulai Backup Sekarang'}
          </Button>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pengaturan Backup Otomatis</h2>
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="automaticBackup" checked={form.automaticBackup ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700 font-medium">Aktifkan Backup Otomatis</span>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Direktori Penyimpanan Backup" name="backupDirectory" value={form.backupDirectory ?? '/var/backups/pos'} onChange={handleChange} disabled={!form.automaticBackup} />
            <Input label="Interval Backup (Jam)" name="backupIntervalHours" type="number" min={1} value={form.backupIntervalHours ?? 24} onChange={handleChange} disabled={!form.automaticBackup} />
            <Input label="Jumlah File Disimpan (Retensi)" name="backupRetentionCount" type="number" min={1} value={form.backupRetentionCount ?? 7} onChange={handleChange} disabled={!form.automaticBackup} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mt-4">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="backupCompressionEnabled" checked={form.backupCompressionEnabled ?? false} onChange={handleChange} disabled={!form.automaticBackup} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Aktifkan Kompresi (ZIP)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="backupEncryptionEnabled" checked={form.backupEncryptionEnabled ?? false} onChange={handleChange} disabled={!form.automaticBackup} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Enkripsi File Backup</span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
