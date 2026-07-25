# Business Rules - POS Apotek V2

## Sumber Kebenaran

Backend adalah sumber kebenaran final untuk:

- stok;
- batch;
- FEFO;
- HPP;
- laba;
- harga final transaksi;
- diskon alokasi;
- retur;
- mutasi stok.

Frontend hanya boleh menghitung estimasi tampilan.

## Stok dan Batch

- Stok wajib disimpan pada level batch dalam satuan dasar.
- Stok batch tidak boleh negatif.
- Batch expired tidak dipakai untuk transaksi normal.
- Semua perubahan stok harus memiliki mutasi stok.
- Jangan menyimpan stok hanya pada level produk.

## PO, Pembelian, dan Resep

- PO adalah rencana pemesanan dan tidak boleh menambah atau mengurangi stok.
- Pembelian final menambah stok melalui transaksi database.
- Resep dasar bukan transaksi final.
- Resep tidak mengurangi stok saat dibuat atau ditandai siap bayar.
- Stok resep baru berkurang setelah kasir checkout berhasil.

## Penjualan, FEFO, dan Profit

- Sales harus menerapkan FEFO di backend.
- Jika satu item memakai beberapa batch, backend wajib menyimpan split batch allocation.
- Detail transaksi harus menyimpan snapshot harga jual final, HPP, diskon alokasi, dan laba.
- Laporan laba memakai histori detail transaksi, bukan harga produk terbaru.
- Harga modal/HPP/laba internal memakai presisi tinggi.
- Uang, HPP, pajak, diskon, dan laba tidak boleh memakai `FLOAT`, `DOUBLE`, atau `REAL`.

## Master Data & Kategori Tree

- Kategori mendukung struktur hirarki pohon (Category Tree).
- Nama kategori harus unik pada parent yang sama (unique name per `parentId`).
- Kedalaman hirarki kategori maksimal 3 level (Level 1 Root -> Level 2 Sub-kategori -> Level 3 Sub-sub-kategori).
- Parent category tidak boleh dihapus jika masih memiliki sub-kategori (children) atau masih terikat pada produk aktif/historis.

## Notification Center & RBAC Notifikasi

- Notifikasi disaring secara eksplisit di backend berdasarkan role pengguna:
  - `KASIR`: Notifikasi status retur penjualan dan pengumuman sistem. Kasir tidak menerima notifikasi stok, expired, PO, atau finansial.
  - `APOTEKER`: Notifikasi stok kritis/rendah, alert batch mendekati expired, update status PO, update status resep, dan pengumuman sistem.
  - `MANAGER`: Seluruh notifikasi (stok rendah, batch expired, update status PO, alert finansial/laba, status retur, audit log user, dan pengumuman sistem).
  - `PEMILIK`: Notifikasi ringkasan tingkat tinggi (ringkasan batch expired, ringkasan harian penjualan/laba, dan pengumuman sistem).

## Role dan Data Sensitif

Role minimum V1:

- `KASIR`
- `APOTEKER`
- `MANAGER`

Kasir tidak boleh menerima:

- HPP;
- laba;
- margin;
- harga beli;
- laporan laba;
- pembelian supplier;
- koreksi stok;
- price setting.

Backend guard wajib tetap menjadi proteksi utama. Frontend route/menu hanya pendamping UX.

## Out of Scope V1

Jangan menambahkan:

- BPJS;
- payment gateway otomatis;
- multi-branch;
- loyalty program;
- full accounting;
- PWA offline penuh;
- database per client;
- peer-to-peer sync;
- transaksi final di localStorage.
