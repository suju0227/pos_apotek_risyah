import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { ErrorState } from '../../shared/components/ErrorState';
import { Input } from '../../shared/components/Input';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToastStore } from '../../shared/components/toast.store';
import { apiClient } from '../../shared/api/apiClient';
import { stockApi } from './stock.api';
import { batchApi } from '../batches/batch.api';

export function StockAdjustmentPage() {
  const { data: batches = [], isLoading, error } = useQuery({ queryKey: ['batches'], queryFn: batchApi.list });
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const [batchId, setBatchId] = useState('');
  const [newQtyBase, setNewQtyBase] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!batchId || !newQtyBase || !reason.trim()) {
      showToast('Batch, stok baru, dan alasan wajib diisi.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post('/stock/adjustments', { batchId, newQtyBase: Number(newQtyBase), reason: reason.trim() });
      showToast('Koreksi stok berhasil disimpan.');
      setBatchId(''); setNewQtyBase(''); setReason('');
      await queryClient.invalidateQueries({ queryKey: ['stock'] });
      await queryClient.invalidateQueries({ queryKey: ['stock', 'mutations'] });
    } catch (err) {
      showToast((err as Error).message);
    } finally { setIsSaving(false); }
  }

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-950">Koreksi Stok</h1><p className="mt-1 text-sm text-slate-600">Sesuaikan stok batch berdasarkan hasil pemeriksaan fisik.</p></div>
    <Card><form className="grid gap-4 lg:grid-cols-3" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-700">Batch<select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={batchId} onChange={(event) => setBatchId(event.target.value)}><option value="">Pilih batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.product.name} · {batch.batchNumber}</option>)}</select></label>
      <Input label="Stok baru (satuan dasar)" type="number" min="0" step="0.0001" value={newQtyBase} onChange={(event) => setNewQtyBase(event.target.value)} />
      <Input label="Alasan koreksi" value={reason} onChange={(event) => setReason(event.target.value)} />
      <div><Button type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan Koreksi'}</Button></div>
    </form></Card>
    <Card><h2 className="font-semibold text-slate-950">Batch tersedia</h2><div className="mt-3 divide-y divide-slate-200">{batches.map((batch) => <div className="flex items-center justify-between py-3 text-sm" key={batch.id}><div><div className="font-medium text-slate-900">{batch.product.name}</div><div className="text-slate-500">{batch.batchNumber} · {batch.product.baseUnit.symbol ?? batch.product.baseUnit.name}</div></div><span className="font-semibold text-slate-900">{batch.currentStockBase}</span></div>)}</div></Card>
  </div>;
}
