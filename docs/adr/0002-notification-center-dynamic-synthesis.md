# ADR 0002: Notification Center Dynamic Synthesis & Local Client State

- **Status:** Accepted
- **Date:** July 2026
- **Deciders:** Software Architecture Team, Lead Developer
- **Technical Story:** Provide real-time operational notifications (low stock, batch expiring, system alerts) without bloating the PostgreSQL database with a dedicated notification log table.

---

## Context & Problem Statement

Sistem POS Apotek V2 membutuhkan fitur **Notification Center** untuk memberitahu Pengguna (Manager, Apoteker, Kasir) tentang peristiwa operasional kritis, seperti:
1. Stok produk yang berada di bawah stok minimum (`min_stock_base`).
2. Batch obat yang akan kadaluarsa dalam waktu dekat (misal < 30 / 60 / 90 hari) atau sudah expired.
3. Transaksi retur atau pembatalan PO yang memerlukan perhatian.

Rancangan konvensional umumnya membuat tabel database `notifications` tersendiri dan menggunakan background worker / cron job untuk secara berkala menembakkan baris pemberitahuan baru. Namun untuk POS Apotek V2:
- Mempersulit sinkronisasi status stok riil (jika stok sudah ditambah via pembelian, notifikasi stok tipis lama di DB menjadi *out-of-date* kecuali ada logika pembersihan yang rumit).
- Menambah beban *write operation* dan ukuran penyimpanan database secara tidak perlu (*database bloat*).
- Menambah kompleksitas maintenance skema database V1.

---

## Decision Driver

- **State-based Real-Time Accuracy:** Notifikasi harus selalu mencerminkan kondisi riil sistem saat ini secara instan (*single source of truth*).
- **YAGNI & Minimalisme Architecture (Ponytail Rules):** Hindari pembuat tabel baru dan background job kompleks jika logika query dinamis sudah mencukupi.
- **Client-Side Interactive State:** Pengguna dapat menandai notifikasi sebagai dibaca (*mark as read*) atau menghapus notifikasi dari tampilan UI mereka.

---

## Decision

Kami memutuskan untuk mengimplementasikan **Dynamic Query Synthesis Engine** di Backend dan **LocalStorage Client-State Management** di Frontend:

### 1. Backend Dynamic Synthesis (`NotificationsService`)
- Backend **TIDAK MEMILIKI** tabel `notifications` di PostgreSQL.
- Ketika frontend memanggil `GET /api/notifications`, `NotificationsService` secara paralel melakukan *lightweight DB query synthesis*:
  - Query produk aktif yang `currentStockBase <= minStockBase` -> synthesized as `LOW_STOCK` alert.
  - Query batch aktif dengan `expiredDate <= NOW() + 30 days` -> synthesized as `EXPIRING_BATCH` / `EXPIRED_BATCH` alert.
- Notifikasi disintesis secara dinamis dalam memori backend dan dikembalikan sebagai JSON array dengan ID deterministik (misal: `low-stock-{productId}`, `expiring-batch-{batchId}`).

### 2. Client-Side Read/Deleted State Persistence
Untuk memberikan pengalaman interaktif pengguna tanpa menyimpan per-user read state di database:
- Frontend menyimpan array ID notifikasi yang telah dibaca di LocalStorage browser:
  - `pos_read_notifications`: Menampung daftar ID notifikasi yang diset *read*.
  - `pos_deleted_notifications`: Menampung daftar ID notifikasi yang disembunyikan/dihapus oleh pengguna.
- Komponen `NotificationCenter` di React menggabungkan data dari API dengan status LocalStorage:
  - Notifikasi yang ID-nya ada di `pos_deleted_notifications` difilter out (tidak ditampilkan).
  - Notifikasi yang ID-nya ada di `pos_read_notifications` ditampilkan dengan indikator visual *read* (tanpa badge merah).
  - `NotificationBell` menghitung jumlah unread berdasarkan `total_synthesized - read_count`.

---

## Consequences

### Positive
- **Selalu Akurat (Always Fresh):** Ketika stok barang ditambah melalui Pembelian, notifikasi stok tipis untuk produk tersebut otomatis hilang pada query berikutnya tanpa perlu pembersihan DB manual.
- **Zero Database Bloat:** Database PostgreSQL tidak terbebani oleh jutaan log notifikasi lama.
- **Arsitektur Ringan & Cepat:** Bebas dari pengolahan background worker / cron server yang rumit.

### Trade-offs / Limitations
- **Per-Device Local State:** Status *mark as read* / *delete notification* tersimpan di browser local storage pengguna, sehingga status read tidak tersinkron antar-perangkat jika pengguna berpindah komputer (dapat diterima untuk skala operasional Apotek V1).
