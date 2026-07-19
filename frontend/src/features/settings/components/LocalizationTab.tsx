import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { useLocalizationSettings, useUpdateLocalizationSettings } from '../settings.hooks';
import type { LocalizationSettings } from '../settings.types';
import { useSettingsStore } from '../settings.store';

export function LocalizationTab() {
  const { data, isLoading, error } = useLocalizationSettings();
  const updateSettings = useUpdateLocalizationSettings();
  const showToast = useToastStore((state) => state.show);
  const reloadPublic = useSettingsStore(state => state.load);

  const [form, setForm] = useState<Partial<LocalizationSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: name === 'defaultTax' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form as LocalizationSettings);
      showToast('Pengaturan lokalisasi berhasil disimpan.');
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Lokalisasi & Regional</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Zona Waktu</label>
            <select name="timezone" value={form.timezone ?? 'Asia/Makassar'} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa</label>
            <select name="language" value={form.language ?? 'id'} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <Input label="Mata Uang" name="currency" value={form.currency ?? 'IDR'} onChange={handleChange} />
          <Input label="Format Tanggal" name="dateFormat" value={form.dateFormat ?? 'DD/MM/YYYY'} onChange={handleChange} />
          <Input label="Format Waktu" name="timeFormat" value={form.timeFormat ?? 'HH:mm'} onChange={handleChange} />
          <Input label="Pemisah Desimal" name="decimalSeparator" value={form.decimalSeparator ?? ','} onChange={handleChange} />
          <Input label="Pemisah Ribuan" name="thousandSeparator" value={form.thousandSeparator ?? '.'} onChange={handleChange} />
          <Input label="Pajak Default (%)" name="defaultTax" type="number" min={0} step="0.1" value={form.defaultTax ?? 0} onChange={handleChange} />
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
