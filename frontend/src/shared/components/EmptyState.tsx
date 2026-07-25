import { Inbox } from 'lucide-react';
import { Card } from './Card';

export function EmptyState({
  title = 'Data kosong',
  message = 'Belum ada data yang bisa ditampilkan.',
  icon: Icon = Inbox,
}: {
  title?: string;
  message?: string;
  icon?: any;
}) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/50">
        <Icon size={24} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600 max-w-xs">{message}</p>
    </Card>
  );
}
