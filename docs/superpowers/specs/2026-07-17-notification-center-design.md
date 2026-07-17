# Design Specification - Notification Center POS Apotek V2

Pusat Informasi Operasional (Notification Center) real-time berbasis peran (RBAC) dengan pendekatan dynamic synthesis (state-based query) dan penyimpanan status klien pada local storage.

## 1. Arsitektur Backend

### Endpoint Rute
*   `GET /api/notifications`
    *   Menerima parameter query opsional jika diperlukan.
    *   Mengembalikan daftar notifikasi aktif yang disintesis secara dinamis.
    *   Mengamankan akses dengan `JwtAuthGuard` dan `RolesGuard`.

### Alur Kueri Paralel (NotificationsService)
Layanan akan mengambil data status riil dari database PostgreSQL menggunakan Prisma secara paralel:
1.  **Stok Kritis**: Cari produk aktif (`isActive: true, deletedAt: null`) dengan `stockAvailableBase <= minStockBase`.
    *   Format Judul: `Stok Kritis: [Nama Produk]`
    *   Pesan: `Tersisa [Stok] [Satuan] (Batas minimum: [MinStok] [Satuan])`
    *   ID: `stock-[productId]`
    *   Path: `/produk`
    *   Priority: `high`
2.  **Batch Kadaluwarsa**: Cari batch aktif (`isActive: true, deletedAt: null`) dengan sisa hari hingga kedaluwarsa (`daysRemaining <= 90`).
    *   Jika `daysRemaining < 0`:
        *   Format Judul: `Batch Kedaluwarsa`
        *   Pesan: `Produk [Nama Produk] (Batch: [NoBatch]) sudah kedaluwarsa!`
        *   ID: `batch-expired-[batchId]`
        *   Priority: `critical`
    *   Jika `0 <= daysRemaining <= 30`:
        *   Format Judul: `Batch Segera Kedaluwarsa`
        *   Pesan: `Produk [Nama Produk] (Batch: [NoBatch]) kedaluwarsa dalam [Hari] hari!`
        *   ID: `batch-warning-[batchId]`
        *   Priority: `critical`
    *   Jika `31 <= daysRemaining <= 90`:
        *   Pesan: `Produk [Nama Produk] (Batch: [NoBatch]) kedaluwarsa dalam [Hari] hari.`
        *   ID: `batch-info-[batchId]`
        *   Priority: `medium`
    *   Path: `/batch`
3.  **Purchase Order Terlambat**: Cari PO berstatus `SENT` yang telah melewati estimasi hari pengiriman (`orderDate` + 3 hari).
    *   Format Judul: `Pemesanan Terlambat`
    *   Pesan: `PO [NoPO] ke [Supplier] terlambat [Hari] hari.`
    *   ID: `po-late-[poId]`
    *   Path: `/pemesanan`
    *   Priority: `high`
4.  **Log Audit Aktivitas (Recent Logs)**: Mengambil 5 log audit aktivitas sensitif terbaru dari `AuditLog`.
    *   Aktivitas Login: `User [Nama] login.` (Priority: `info`)
    *   Aktivitas Logout: `User [Nama] logout.` (Priority: `info`)
    *   Harga Berubah: `Harga [Produk] diubah oleh [Nama].` (Priority: `medium`)
    *   Produk Baru: `Produk baru [Produk] ditambahkan oleh [Nama].` (Priority: `success`)
    *   Gagal Login: `5 kali gagal login dari IP [IP]` (Priority: `critical`)
    *   ID: `audit-[logId]`
    *   Path: `/audit-log`
5.  **Backup Database**: Cek log audit untuk tindakan backup terakhir. Jika tidak ada backup dalam 24 jam terakhir:
    *   Judul: `Backup Database`
    *   Pesan: `Backup database belum dilakukan hari ini.`
    *   ID: `backup-alert`
    *   Path: `/settings`
    *   Priority: `medium`

### Penyaringan RBAC di Backend
Sebelum mengembalikan hasil, backend memfilter item berdasarkan peran:
*   `KASIR`: Hanya menerima kategori `stock` (stok kritis), `operational` (transaksi).
*   `APOTEKER`: Menerima kategori `stock` (stok kritis, expired), `operational` (resep).
*   `MANAGER`: Menerima seluruh kategori (termasuk audit aktivitas, backup, dll).
*   `PEMILIK`: Menerima seluruh kategori operasional & stok, mengecualikan audit aktivitas sensitif internal.

---

## 2. Arsitektur Frontend

### Penyimpanan Status Klien (LocalStorage)
Status baca/hapus dikelola menggunakan kunci:
*   `pos_read_notifications`: Menyimpan array string ID notifikasi yang telah ditandai sebagai dibaca.
*   `pos_deleted_notifications`: Menyimpan array string ID notifikasi yang telah dihapus/disembunyikan oleh pengguna.

### Tab Kategori
*   `Semua`: Menampilkan seluruh notifikasi.
*   `Operasional`: Notifikasi resep, transaksi, barang datang.
*   `Stok`: Notifikasi stok kritis dan expired batch.
*   `Purchase`: Notifikasi PO lambat dan barang masuk.
*   `Sistem`: Notifikasi backup, audit login, dan keamanan.

### Badge Lencana
*   Menampilkan jumlah total notifikasi yang ID-nya **tidak ada** di `pos_read_notifications` dan `pos_deleted_notifications`.
*   Jika total unread > 0, tampilkan lencana merah `🔔 (Count)`.

### Tindakan Cepat (Actions)
*   **Klik Item**: Membuka tautan `path`, otomatis menandai item sebagai dibaca (memasukkan ID ke `pos_read_notifications`).
*   **Tandai Dibaca**: Klik tombol check untuk menandai dibaca tanpa berpindah halaman.
*   **Hapus Notifikasi**: Klik tombol silang untuk menyembunyikan item (memasukkan ID ke `pos_deleted_notifications`).
*   **Salin Referensi**: Tombol untuk menyalin nomor PO / No. Batch / No. Invoice jika tersedia.
*   **Tandai Semua Dibaca**: Memasukkan seluruh ID notifikasi aktif ke `pos_read_notifications`.
