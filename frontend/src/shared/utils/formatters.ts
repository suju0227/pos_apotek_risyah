const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Makassar',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Makassar',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatRupiah(value: number) {
  return rupiahFormatter.format(value);
}

export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTimeWita(value: string | Date) {
  return `${dateTimeFormatter.format(new Date(value))} WITA`;
}

export function formatQty(value: number, unit?: string | null) {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 3,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
