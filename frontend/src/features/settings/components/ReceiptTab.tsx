import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useToastStore } from '../../../shared/components/toast.store';
import { useReceiptSettings, useUpdateReceiptSettings } from '../settings.hooks';
import type { ReceiptSettings } from '../settings.types';

export function ReceiptTab() {
  const { data, isLoading, error } = useReceiptSettings();
  const updateSettings = useUpdateReceiptSettings();
  const showToast = useToastStore((state) => state.show);

  const [form, setForm] = useState<Partial<ReceiptSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      await updateSettings.mutateAsync(form as ReceiptSettings);
      showToast('Pengaturan struk berhasil disimpan.');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pengaturan Struk (Receipt)</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lebar Kertas</label>
            <select name="paperWidth" value={form.paperWidth ?? '58mm'} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Format Struk</label>
            <select name="receiptFormat" value={form.receiptFormat ?? 'STANDARD'} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="STANDARD">Standard</option>
              <option value="COMPACT">Compact</option>
              <option value="THREE_COLUMNS">3 Kolom</option>
            </select>
          </div>
          <Input label="Ukuran Font (px)" name="fontSize" type="number" min={8} max={24} value={form.fontSize ?? 12} onChange={handleChange} />
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Tampilkan Elemen Berikut</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="showLogo" checked={form.showLogo ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Tampilkan Logo</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="showQRCode" checked={form.showQRCode ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Tampilkan QR Code</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="showBarcode" checked={form.showBarcode ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Tampilkan Barcode Transaksi</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="showAddress" checked={form.showAddress ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Tampilkan Alamat</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="showNPWP" checked={form.showNPWP ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Tampilkan NPWP</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="autoNumbering" checked={form.autoNumbering ?? false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-700">Auto Penomoran Antrian</span>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Custom Header Text</label>
            <textarea name="customHeader" value={form.customHeader ?? ''} onChange={handleChange} className="w-full h-20 rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Custom Footer Text</label>
            <textarea name="customFooter" value={form.customFooter ?? ''} onChange={handleChange} className="w-full h-20 rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
