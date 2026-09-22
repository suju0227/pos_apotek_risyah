import { DataTable } from '../../shared/components/DataTable';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { formatDateTimeWita } from '../../shared/utils/formatters';
import { useCounselingRecords } from './counseling.hooks';
import { usePrescriptions } from '../prescriptions/prescription.hooks';

export function ServiceHistoryPage() {
  const counseling = useCounselingRecords();
  const prescriptions = usePrescriptions();
  if (counseling.isLoading || prescriptions.isLoading) return <LoadingSkeleton rows={6} />;
  if (counseling.error) return <ErrorState message={(counseling.error as Error).message} />;
  if (prescriptions.error) return <ErrorState message={(prescriptions.error as Error).message} />;
  const rows = [
    ...(prescriptions.data ?? []).map((item) => ({ id: `prescription-${item.id}`, type: 'Resep', subject: item.patientName, status: item.status, date: item.createdAt, officer: item.pharmacist?.name ?? '-' })),
    ...(counseling.data ?? []).map((item) => ({ id: `counseling-${item.id}`, type: 'Konseling', subject: item.patientName ?? '-', status: 'Tercatat', date: item.counselingDate, officer: item.pharmacist.name })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-950">Riwayat Pelayanan</h1><p className="mt-1 text-sm text-slate-600">Riwayat resep dan konseling yang dilayani apotek.</p></div>
    {!rows.length ? <EmptyState title="Belum ada riwayat pelayanan" /> : <DataTable data={rows as (typeof rows[number] & Record<string, unknown>)[]} columns={[{ key: 'type', header: 'Jenis' }, { key: 'subject', header: 'Pasien' }, { key: 'status', header: 'Status' }, { key: 'date', header: 'Waktu', render: (row) => formatDateTimeWita(row.date) }, { key: 'officer', header: 'Petugas' }]} />}
  </div>;
}
