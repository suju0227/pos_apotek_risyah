---
document_name: "05_TASK_BREAKDOWN_POS_APOTEK_REVISI_SINKRON"
document_type: "Task Breakdown / Implementation Plan"
project_name: "POS Apotek"
version: "1.1.0"
status: "Draft Revisi - Synchronized with PRD, SRS, SDD, UI/UX, Frontend, and Backend"
prepared_for: "AI Vibe Coding / Codex GPT"
prepared_by: "Suryadi Umar"
last_updated: "2026-06-02"
source_documents:
  - "01_PRD_POS_APOTEK.md"
  - "02_SRS_POS_APOTEK.md"
  - "03_SDD_SYSTEM_DESIGN_POS_APOTEK.md"
  - "04_UI_UX_FLOW_POS_APOTEK.md"
  - "06_FRONTEND_POS_APOTEK.md"
  - "07_BACKEND_POS_APOTEK.md"
related_documents:
  - "01_PRD_POS_APOTEK.md"
  - "02_SRS_POS_APOTEK.md"
  - "03_SDD_SYSTEM_DESIGN_POS_APOTEK.md"
  - "04_UI_UX_FLOW_POS_APOTEK.md"
  - "06_FRONTEND_POS_APOTEK.md"
  - "07_BACKEND_POS_APOTEK.md"
revision_focus:
  - "sinkronisasi route frontend final berbahasa Indonesia"
  - "penambahan task refresh token, idempotency key, dan audit log"
  - "penambahan task manajemen user dan pengaturan profil apotek"
  - "penegasan APP_TIMEZONE Asia/Makassar dan penyimpanan timestamp UTC"
  - "penguatan testing concurrency, role sanitization, histori transaksi, dan idempotency"
---

# Task Breakdown - POS Apotek

## 0. Instruksi Pembacaan untuk AI Coding

Dokumen ini adalah **Task Breakdown** untuk implementasi aplikasi **POS Apotek**.

Dokumen ini memecah pekerjaan menjadi tugas teknis yang bisa dieksekusi secara bertahap oleh AI coding atau developer.

Dokumen ini harus dibaca setelah:
1. `01_PRD_POS_APOTEK.md`
2. `02_SRS_POS_APOTEK.md`
3. `03_SDD_SYSTEM_DESIGN_POS_APOTEK.md`
4. `06_FRONTEND_POS_APOTEK.md`
5. `07_BACKEND_POS_APOTEK.md`
6. `04_UI_UX_FLOW_POS_APOTEK.md`

AI coding wajib mengikuti aturan berikut:

1. Kerjakan task berdasarkan urutan fase.
2. Jangan mengerjakan fitur di luar scope V1.
3. Jangan melompati database dan service penting untuk langsung membuat UI.
4. Jangan menyimpan stok hanya pada level produk.
5. Jangan membuat transaksi kasir tanpa batch, FEFO, split allocation, dan mutasi stok.
6. Jangan menampilkan HPP atau laba kepada role kasir.
7. Jangan menghitung laba dari harga produk terbaru.
8. Jangan mengubah transaksi lama ketika harga produk berubah.
9. Jangan menghapus permanen transaksi, batch, pembelian, retur, atau mutasi stok.
10. Jangan menjadikan frontend sebagai sumber kebenaran final.
11. Jika task gagal, perbaiki task itu dahulu sebelum melanjutkan task berikutnya.
12. Gunakan route frontend final berbahasa Indonesia sesuai SDD dan UI/UX Flow.
13. Gunakan endpoint API backend berbahasa Inggris teknis dengan prefix `/api`.
14. Gunakan idempotency key untuk checkout, pembelian, retur, dan koreksi stok.
15. Gunakan waktu backend sebagai waktu transaksi final; jam frontend hanya tampilan.
16. Simpan timestamp database dalam UTC dan tampilkan waktu operasional dalam `Asia/Makassar`.
17. Jangan menganggap aplikasi selesai hanya karena halaman sudah muncul. Itu hanya kosmetik digital, bukan sistem yang benar.

---

## 1. Tujuan Task Breakdown

Tujuan dokumen ini adalah:
- membagi pekerjaan pengembangan menjadi bagian kecil;
- menjaga urutan implementasi agar tidak berantakan;
- menghubungkan task dengan PRD, SRS, SDD, dan UI/UX Flow;
- menyediakan checklist dan definition of done;
- membantu AI coding memahami prioritas kerja;
- mencegah implementasi fitur yang tidak sesuai kebutuhan POS Apotek;
- memastikan Task Breakdown sinkron dengan route final, idempotency, audit log, refresh token, manajemen user, settings, dan testing kritis.

---

## 2. Legenda Task

### 2.1 Format ID Task

| Jenis Task | Format | Contoh |
|---|---|---|
| Setup | TASK-SETUP-001 | Setup repository |
| Database | TASK-DB-001 | Membuat tabel users |
| Backend | TASK-BE-001 | Membuat AuthService |
| Frontend | TASK-FE-001 | Membuat halaman login |
| UI/UX | TASK-UI-001 | Membuat AppShell |
| Testing | TASK-TEST-001 | Unit test FEFO |
| Deployment | TASK-DEPLOY-001 | Setup environment |
| Documentation | TASK-DOC-001 | Update README |

### 2.2 Prioritas

| Prioritas | Makna |
|---|---|
| P0 | Wajib untuk sistem berjalan |
| P1 | Wajib untuk MVP/V1 |
| P2 | Penting tetapi dapat dikerjakan setelah fitur utama |
| P3 | Opsional atau peningkatan berikutnya |

### 2.3 Kompleksitas

| Kompleksitas | Makna |
|---|---|
| S | Kecil |
| M | Sedang |
| L | Besar |
| XL | Sangat besar dan harus dipecah jika terlalu luas |

### 2.4 Status Checklist

Gunakan checklist berikut saat implementasi:

```md
- [ ] Belum dikerjakan
- [x] Selesai
```

---

## 3. Urutan Fase Implementasi

| Fase | Nama | Fokus |
|---|---|---|
| Phase 0 | Persiapan Proyek | Setup repo, environment, struktur folder |
| Phase 1 | Database Foundation | Migration tabel inti dan seed awal |
| Phase 2 | Auth, RBAC, User & Security Foundation | Login, token, refresh token, role, proteksi route, user API, audit dasar |
| Phase 3 | Master Data | Produk, kategori, supplier, satuan |
| Phase 4 | Batch & Pembelian | Batch, harga jual batch, pembelian supplier |
| Phase 5 | Stok & Mutasi | StockService, mutasi stok, koreksi stok |
| Phase 6 | Kasir & Transaksi | Halaman kasir, sales service, FEFO, split batch, idempotency checkout |
| Phase 7 | Diskon & Pembayaran | Diskon, alokasi diskon, metode pembayaran |
| Phase 8 | Retur | Retur penjualan dan retur pembelian |
| Phase 9 | Dashboard & Laporan | Dashboard, laporan penjualan, laporan laba |
| Phase 10 | Export | Export Excel/PDF |
| Phase 11 | User, Settings, Responsive & UX Polish | Manajemen user, pengaturan, loading, empty, error, responsive |
| Phase 12 | Testing | Unit, integration, E2E |
| Phase 13 | Deployment | Migration production, seed, env, backup |
| Phase 14 | Final Review | Audit requirement dan dokumentasi |

---

## 4. Milestone Utama

| Milestone | Target Output |
|---|---|
| M1 | Aplikasi bisa login, refresh token, role, dan proteksi route berjalan |
| M2 | Master data produk, satuan, supplier, kategori selesai |
| M3 | Pembelian dapat membuat batch dan stok |
| M4 | Kasir dapat menyimpan transaksi dengan FEFO dan mutasi stok |
| M5 | Retur penjualan dan retur pembelian berjalan |
| M6 | Dashboard dan laporan laba akurat |
| M7 | Export laporan dan responsive UI selesai |
| M8 | Testing kritis, audit requirement, dan deployment siap |

---

## 4.1 Route Frontend Final dan Endpoint API

Route frontend memakai istilah UI berbahasa Indonesia. Endpoint backend tetap memakai istilah teknis berbahasa Inggris dengan prefix `/api`. Jangan mencampur keduanya. Manusia sudah cukup sering mencampur hal sederhana sampai menjadi masalah arsitektur.

| Halaman UI | Route Frontend Final | Endpoint API Utama | Role |
|---|---|---|---|
| Login | `/login` | `POST /api/auth/login` | Publik |
| Dashboard | `/dashboard` | `/api/dashboard/*` | Manager, Pemilik opsional |
| Kasir | `/kasir` | `POST /api/sales`, `GET /api/cashier/products` | Kasir, Manager |
| Riwayat Transaksi | `/riwayat-transaksi` | `GET /api/sales` | Kasir terbatas, Manager |
| Retur Penjualan | `/retur-penjualan` | `POST /api/sales-returns` | Kasir, Manager |
| Produk | `/produk` | `/api/products` | Manager |
| Kategori | `/kategori` | `/api/categories` | Manager |
| Supplier | `/supplier` | `/api/suppliers` | Manager |
| Satuan | `/satuan` | `/api/units`, `/api/products/:productId/units` | Manager |
| Batch | `/batch` | `/api/batches` | Manager |
| Pembelian | `/pembelian` | `/api/purchases` | Manager |
| Stok | `/stok` | `/api/stock` | Manager, Kasir terbatas |
| Mutasi Stok | `/mutasi-stok` | `/api/stock/mutations` | Manager |
| Koreksi Stok | `/koreksi-stok` | `POST /api/stock/adjustments` | Manager |
| Retur Pembelian | `/retur-pembelian` | `/api/purchase-returns` | Manager |
| Laporan Penjualan | `/laporan/penjualan` | `/api/reports/sales` | Manager, Pemilik opsional |
| Laporan Laba | `/laporan/laba` | `/api/reports/profit` | Manager, Pemilik opsional |
| Export | `/export` | `/api/exports/*` | Manager, Pemilik opsional |
| Manajemen User | `/users` | `/api/users` | Manager |
| Pengaturan | `/settings` | `/api/settings` | Manager |

---

# PHASE 0 - Persiapan Proyek

## TASK-SETUP-001: Setup Repository dan Struktur Awal

**Type:** Setup  
**Priority:** P0  
**Complexity:** S  
**Related Documents:** SDD Section 7

### Description
Membuat repository proyek dan struktur folder dasar sesuai SDD.

### Checklist
- [ ] Buat repository proyek.
- [ ] Buat struktur folder frontend sesuai `06_FRONTEND_POS_APOTEK.md`.
- [ ] Buat struktur folder backend sesuai `07_BACKEND_POS_APOTEK.md`.
- [ ] Pisahkan folder frontend, backend, database, dan tests secara jelas.
- [ ] Buat file konfigurasi environment.
- [ ] Buat README awal.
- [ ] Pastikan aplikasi dapat dijalankan secara lokal.

### Definition of Done
- Struktur folder tersedia.
- Aplikasi dapat dijalankan tanpa error awal.
- README berisi cara menjalankan proyek.

---

## TASK-SETUP-002: Setup Environment Variables

**Type:** Setup  
**Priority:** P0  
**Complexity:** S  
**Related Documents:** SDD Section 21

### Checklist
- [ ] Buat `.env.example`.
- [ ] Tambahkan `DATABASE_URL`.
- [ ] Tambahkan `APP_URL`.
- [ ] Tambahkan `JWT_SECRET`.
- [ ] Tambahkan `JWT_REFRESH_SECRET`.
- [ ] Tambahkan `APP_TIMEZONE=Asia/Makassar`.
- [ ] Pastikan database menyimpan timestamp dalam UTC.
- [ ] Tambahkan konfigurasi export jika diperlukan.
- [ ] Tambahkan konfigurasi CORS dan API base URL sesuai environment.
- [ ] Pastikan `.env` tidak masuk version control.

### Definition of Done
- `.env.example` tersedia.
- Aplikasi membaca environment variable.
- Secret tidak bocor ke repository.

---

## TASK-SETUP-003: Setup Database Connection dan ORM

**Type:** Setup / Database  
**Priority:** P0  
**Complexity:** M  
**Related Documents:** SDD Section 4, Section 9

### Checklist
- [ ] Pilih ORM atau query builder.
- [ ] Konfigurasi koneksi database.
- [ ] Buat script migration.
- [ ] Buat script seed.
- [ ] Uji koneksi database lokal.
- [ ] Pastikan migration dapat dijalankan ulang secara aman.

### Definition of Done
- Database terkoneksi.
- Migration tool berjalan.
- Seed tool berjalan.

---

## TASK-SETUP-004: Setup Code Quality

**Type:** Setup  
**Priority:** P1  
**Complexity:** S

### Checklist
- [ ] Setup linting.
- [ ] Setup formatting.
- [ ] Setup type checking jika memakai TypeScript.
- [ ] Setup script test.
- [ ] Tambahkan aturan import yang konsisten.

### Definition of Done
- Script lint berjalan.
- Script format berjalan.
- Script test tersedia.

---

# PHASE 1 - Database Foundation

## TASK-DB-001: Membuat Tabel Roles dan Users

**Type:** Database  
**Priority:** P0  
**Complexity:** M  
**Related SRS:** SRS-AUTH-001, SRS-AUTH-003  
**Related SDD:** Tabel `roles`, `users`

### Checklist
- [ ] Buat migration tabel `roles`.
- [ ] Buat migration tabel `users`.
- [ ] Tambahkan foreign key `users.role_id`.
- [ ] Tambahkan unique constraint username.
- [ ] Tambahkan unique nullable email.
- [ ] Tambahkan field `password_hash`.
- [ ] Tambahkan field `is_active`.
- [ ] Tambahkan timestamp.
- [ ] Seed role `KASIR`, `MANAGER`, dan `PEMILIK` opsional.
- [ ] Seed user manager awal.

### Definition of Done
- Tabel roles dan users berhasil dibuat.
- Role awal tersedia.
- User manager awal dapat digunakan untuk login setelah Auth selesai.

---

## TASK-DB-002: Membuat Tabel Categories, Suppliers, dan Units

**Type:** Database  
**Priority:** P0  
**Complexity:** M  
**Related SRS:** SRS-CAT-001, SRS-SUP-001, SRS-UNIT-001  
**Related SDD:** Tabel `categories`, `suppliers`, `units`

### Checklist
- [ ] Buat tabel `categories`.
- [ ] Buat tabel `suppliers`.
- [ ] Buat tabel `units`.
- [ ] Tambahkan field `is_active`.
- [ ] Tambahkan soft delete jika diperlukan.
- [ ] Tambahkan unique constraint nama kategori.
- [ ] Tambahkan unique constraint nama supplier.
- [ ] Tambahkan unique constraint nama satuan.
- [ ] Seed satuan awal: tablet, kaplet, kapsul, strip, box, botol, tube, sachet, biji, pcs.

### Definition of Done
- Tabel master dasar tersedia.
- Seed satuan berhasil.
- Constraint unik berjalan.

---

## TASK-DB-003: Membuat Tabel Products dan Product Units

**Type:** Database  
**Priority:** P0  
**Complexity:** L  
**Related SRS:** SRS-PROD-001, SRS-UNIT-002  
**Related SDD:** Tabel `products`, `product_units`

### Checklist
- [ ] Buat tabel `products`.
- [ ] Tambahkan FK ke `categories`.
- [ ] Tambahkan FK `base_unit_id` ke `units`.
- [ ] Tambahkan field `code`, `barcode`, `name`, `generic_name`.
- [ ] Tambahkan field `min_stock_base`.
- [ ] Tambahkan field `is_active`.
- [ ] Buat tabel `product_units`.
- [ ] Tambahkan FK ke `products`.
- [ ] Tambahkan FK ke `units`.
- [ ] Tambahkan field `conversion_to_base`.
- [ ] Tambahkan field `is_default_sale_unit`.
- [ ] Tambahkan constraint `conversion_to_base > 0`.
- [ ] Tambahkan index pencarian produk.

### Definition of Done
- Produk dapat memiliki satuan dasar.
- Produk dapat memiliki banyak satuan jual.
- Konversi satuan tersimpan.
- Stok minimum tersimpan dalam satuan dasar.

---

## TASK-DB-004: Membuat Tabel Product Batches dan Batch Unit Prices

**Type:** Database  
**Priority:** P0  
**Complexity:** L  
**Related SRS:** SRS-BATCH-001, SRS-BATCH-002  
**Related SDD:** Tabel `product_batches`, `batch_unit_prices`

### Checklist
- [ ] Buat tabel `product_batches`.
- [ ] Tambahkan FK ke `products`.
- [ ] Tambahkan FK opsional ke `suppliers`.
- [ ] Tambahkan field `batch_number`.
- [ ] Tambahkan field `expired_date`.
- [ ] Tambahkan field `initial_stock_base`.
- [ ] Tambahkan field `current_stock_base`.
- [ ] Tambahkan field `hpp_base`.
- [ ] Tambahkan constraint stok tidak negatif.
- [ ] Tambahkan constraint HPP tidak negatif.
- [ ] Buat tabel `batch_unit_prices`.
- [ ] Tambahkan FK ke `product_batches`.
- [ ] Tambahkan FK ke `product_units`.
- [ ] Tambahkan field `selling_price`.
- [ ] Tambahkan unique constraint batch dan satuan jual.
- [ ] Tambahkan index FEFO.

### Definition of Done
- Batch menyimpan stok aktual.
- Harga jual disimpan per batch dan satuan jual.
- Batch dapat diurutkan untuk FEFO.

---

## TASK-DB-005: Membuat Tabel Purchases dan Purchase Items

**Type:** Database  
**Priority:** P0  
**Complexity:** L  
**Related SRS:** SRS-PUR-001, SRS-PUR-002  
**Related SDD:** Tabel `purchases`, `purchase_items`

### Checklist
- [ ] Buat tabel `purchases`.
- [ ] Tambahkan FK supplier.
- [ ] Tambahkan nomor pembelian unik.
- [ ] Tambahkan tanggal pembelian.
- [ ] Tambahkan subtotal.
- [ ] Buat tabel `purchase_items`.
- [ ] Tambahkan FK purchase.
- [ ] Tambahkan FK product.
- [ ] Tambahkan FK product unit.
- [ ] Tambahkan nomor batch dan expired date.
- [ ] Tambahkan qty pembelian.
- [ ] Tambahkan conversion snapshot.
- [ ] Tambahkan qty base.
- [ ] Tambahkan purchase price.
- [ ] Tambahkan hpp base.
- [ ] Tambahkan total price.

### Definition of Done
- Pembelian dapat menyimpan item.
- Data pembelian cukup untuk membuat batch dan menghitung HPP.

---

## TASK-DB-006: Membuat Tabel Sales, Sale Items, dan Sale Batch Allocations

**Type:** Database  
**Priority:** P0  
**Complexity:** XL  
**Related SRS:** SRS-SALE-005, SRS-FEFO-001, SRS-SPLIT-001  
**Related SDD:** Tabel `sales`, `sale_items`, `sale_batch_allocations`

### Checklist
- [ ] Buat tabel `sales`.
- [ ] Tambahkan nomor transaksi unik.
- [ ] Tambahkan cashier_id.
- [ ] Tambahkan payment_method.
- [ ] Tambahkan subtotal, discount, total.
- [ ] Tambahkan paid_amount dan change_amount.
- [ ] Tambahkan total_hpp dan total_profit.
- [ ] Buat tabel `sale_items`.
- [ ] Simpan snapshot nama produk.
- [ ] Simpan snapshot nama satuan.
- [ ] Simpan qty satuan jual dan qty base.
- [ ] Simpan harga jual final.
- [ ] Buat tabel `sale_batch_allocations`.
- [ ] Tambahkan FK sale item.
- [ ] Tambahkan FK batch.
- [ ] Simpan batch snapshot.
- [ ] Simpan expired snapshot.
- [ ] Simpan qty base.
- [ ] Simpan HPP snapshot.
- [ ] Simpan subtotal allocation.
- [ ] Simpan diskon allocation.
- [ ] Simpan profit allocation.
- [ ] Tambahkan returned_qty_base.

### Definition of Done
- Transaksi dapat menyimpan detail produk.
- Transaksi dapat menyimpan detail batch.
- Laporan laba dapat dihitung dari detail transaksi.
- Retur dapat mengacu ke allocation batch.

---

## TASK-DB-007: Membuat Tabel Returns

**Type:** Database  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-RETSALE-001, SRS-RETPUR-001  
**Related SDD:** Tabel `sales_returns`, `sales_return_items`, `purchase_returns`, `purchase_return_items`

### Checklist
- [ ] Buat tabel `sales_returns`.
- [ ] Buat tabel `sales_return_items`.
- [ ] Tambahkan FK ke sale.
- [ ] Tambahkan FK ke sale_batch_allocation.
- [ ] Tambahkan qty retur.
- [ ] Tambahkan refund amount.
- [ ] Tambahkan HPP dan profit reversed.
- [ ] Buat tabel `purchase_returns`.
- [ ] Buat tabel `purchase_return_items`.
- [ ] Tambahkan FK ke batch.
- [ ] Tambahkan qty retur pembelian.
- [ ] Tambahkan alasan retur.

### Definition of Done
- Retur penjualan dapat mengacu batch asal.
- Retur pembelian dapat mengurangi stok batch.
- Data retur cukup untuk koreksi laporan.

---

## TASK-DB-008: Membuat Tabel Stock Mutations dan Stock Adjustments

**Type:** Database  
**Priority:** P0  
**Complexity:** L  
**Related SRS:** SRS-STOCK-002, SRS-STOCK-003  
**Related SDD:** Tabel `stock_mutations`, `stock_adjustments`

### Checklist
- [ ] Buat tabel `stock_mutations`.
- [ ] Tambahkan FK product.
- [ ] Tambahkan FK batch.
- [ ] Tambahkan mutation_type.
- [ ] Tambahkan reference_type dan reference_id.
- [ ] Tambahkan qty_before, qty_change, qty_after.
- [ ] Tambahkan created_by.
- [ ] Tambahkan reason.
- [ ] Buat tabel `stock_adjustments`.
- [ ] Tambahkan old_qty, new_qty, difference.
- [ ] Tambahkan alasan koreksi.
- [ ] Tambahkan index batch, product, created_at.

### Definition of Done
- Setiap perubahan stok dapat dicatat.
- Mutasi stok dapat ditelusuri.
- Koreksi stok dapat diaudit.

---

## TASK-DB-009: Membuat App Settings dan View Ringkasan Stok

**Type:** Database  
**Priority:** P1  
**Complexity:** M  
**Related SRS:** SRS-STOCK-004, SRS-DASH-001  
**Related SDD:** `app_settings`, `v_product_stock_summary`

### Checklist
- [ ] Buat tabel `app_settings`.
- [ ] Tambahkan `expired_alert_days`.
- [ ] Tambahkan `app_timezone` atau `APP_TIMEZONE`.
- [ ] Tambahkan `currency`.
- [ ] Tambahkan profil apotek dasar: nama, alamat, telepon, dan catatan footer laporan.
- [ ] Seed setting awal.
- [ ] Buat view atau query ringkasan stok.
- [ ] Pastikan batch expired tidak dihitung sebagai stok tersedia normal.

### Definition of Done
- Setting dasar tersedia.
- Profil apotek dapat dipakai pada dashboard, export, dan tampilan laporan.
- Dashboard dapat membaca ringkasan stok.
- Alert stok minimum dapat dihitung.

---

## TASK-DB-010: Membuat Tabel Refresh Tokens

**Type:** Database / Security  
**Priority:** P0  
**Complexity:** M  
**Related SDD:** Tabel `refresh_tokens`

### Checklist
- [ ] Buat tabel `refresh_tokens`.
- [ ] Tambahkan FK `user_id` ke `users`.
- [ ] Tambahkan field `token_hash`.
- [ ] Tambahkan field `expires_at`.
- [ ] Tambahkan field `revoked_at`.
- [ ] Tambahkan timestamp.
- [ ] Tambahkan index `user_id` dan `expires_at`.
- [ ] Pastikan refresh token tidak disimpan plaintext.

### Definition of Done
- Refresh token dapat disimpan sebagai hash.
- Token dapat dicabut saat logout.
- Token user nonaktif dapat ditolak.

---

## TASK-DB-011: Membuat Tabel Idempotency Keys

**Type:** Database / Reliability  
**Priority:** P0  
**Complexity:** M  
**Related SDD:** Tabel `idempotency_keys`

### Checklist
- [ ] Buat tabel `idempotency_keys`.
- [ ] Tambahkan `key` unik.
- [ ] Tambahkan `user_id`.
- [ ] Tambahkan `action_type`, misalnya `SALE_CHECKOUT`, `PURCHASE_CREATE`, `SALES_RETURN`, `STOCK_ADJUSTMENT`.
- [ ] Tambahkan `request_hash`.
- [ ] Tambahkan `response_snapshot` jika request berhasil.
- [ ] Tambahkan `status`: `PROCESSING`, `SUCCESS`, `FAILED`.
- [ ] Tambahkan `expires_at`.
- [ ] Tambahkan unique constraint pada key aktif.

### Definition of Done
- Request penting dapat dicegah agar tidak tersimpan ganda.
- Retry request dengan key sama dapat mengembalikan hasil yang konsisten.
- Checkout tidak membuat transaksi duplikat akibat double click atau timeout.

---

## TASK-DB-012: Membuat Tabel Audit Logs

**Type:** Database / Audit  
**Priority:** P1  
**Complexity:** M  
**Related SDD:** Tabel `audit_logs`

### Checklist
- [ ] Buat tabel `audit_logs`.
- [ ] Tambahkan `actor_user_id`.
- [ ] Tambahkan `action`.
- [ ] Tambahkan `entity_type` dan `entity_id`.
- [ ] Tambahkan `before_data` dan `after_data` jika relevan.
- [ ] Tambahkan `ip_address` dan `user_agent` jika tersedia.
- [ ] Tambahkan `created_at`.
- [ ] Tambahkan index `actor_user_id`, `entity_type`, dan `created_at`.

### Definition of Done
- Aktivitas penting dapat diaudit.
- Perubahan sensitif dapat ditelusuri.
- Audit log tidak dapat diubah dari UI biasa.

---

# PHASE 2 - Auth, RBAC, User, dan Security Foundation

## TASK-BE-001: Membuat AuthService

**Type:** Backend  
**Priority:** P0  
**Complexity:** M  
**Related SRS:** SRS-AUTH-001, SRS-AUTH-002

### Checklist
- [ ] Buat fungsi login.
- [ ] Validasi username/email dan password.
- [ ] Hash dan verify password.
- [ ] Blokir user nonaktif.
- [ ] Buat access token.
- [ ] Buat refresh token dan simpan hash ke tabel `refresh_tokens`.
- [ ] Buat fungsi refresh access token.
- [ ] Buat fungsi logout dan revoke refresh token.
- [ ] Buat fungsi get current user.

### Definition of Done
- User aktif dapat login.
- User nonaktif tidak dapat login.
- Logout mengakhiri sesi dan mencabut refresh token.
- Refresh token tidak disimpan plaintext.
- Password tidak pernah dikirim ke frontend.

---

## TASK-BE-002: Membuat Middleware Authentication dan Authorization

**Type:** Backend  
**Priority:** P0  
**Complexity:** M  
**Related SRS:** SRS-AUTH-003  
**Related SDD:** Security Design

### Checklist
- [ ] Buat guard/middleware `requireAuth` atau `JwtAuthGuard`.
- [ ] Buat guard/middleware `requireRole` atau `RolesGuard`.
- [ ] Proteksi endpoint internal.
- [ ] Blokir akses tanpa login.
- [ ] Blokir role yang tidak berhak.
- [ ] Pastikan kasir tidak dapat akses laporan laba.

### Definition of Done
- Endpoint internal tidak dapat diakses tanpa login.
- Role salah mendapat error 403.
- Kasir tidak dapat membuka endpoint laporan laba.

---

## TASK-FE-001: Membuat Halaman Login

**Type:** Frontend  
**Priority:** P0  
**Complexity:** M  
**Related UI:** Login Flow  
**Related SRS:** SRS-AUTH-001

### Checklist
- [ ] Buat route `/login`.
- [ ] Buat input username/email.
- [ ] Buat input password.
- [ ] Buat tombol login.
- [ ] Tambahkan validasi field kosong.
- [ ] Tambahkan loading state.
- [ ] Tampilkan error login.
- [ ] Redirect berdasarkan role.

### Definition of Done
- Halaman login dapat digunakan.
- Error login tampil jelas.
- Kasir diarahkan ke `/kasir`.
- Manager diarahkan ke `/dashboard`.

---

## TASK-FE-002: Membuat AppShell dan Role-Based Navigation

**Type:** Frontend / UI  
**Priority:** P0  
**Complexity:** L  
**Related UI:** Layout Global, Sidebar

### Checklist
- [ ] Buat layout global.
- [ ] Buat topbar.
- [ ] Buat sidebar manager.
- [ ] Buat sidebar kasir.
- [ ] Buat sidebar pemilik.
- [ ] Tambahkan tombol logout.
- [ ] Tambahkan jam lokal Asia/Makassar untuk tampilan.
- [ ] Sembunyikan menu berdasarkan role.
- [ ] Buat sidebar responsive.

### Definition of Done
- Navigasi berubah berdasarkan role.
- Kasir tidak melihat menu laporan laba.
- Sidebar dapat digunakan di desktop dan mobile.

---

## TASK-BE-025: Membuat User Management API

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** Manajemen user dan role  
**Related UI:** UI Flow Manajemen User

### Checklist
- [ ] GET daftar user.
- [ ] GET detail user.
- [ ] POST user baru.
- [ ] PATCH data user.
- [ ] PATCH aktif/nonaktif user.
- [ ] PATCH role user.
- [ ] Validasi username unik.
- [ ] Validasi email unik jika diisi.
- [ ] Hash password.
- [ ] Cegah manager menonaktifkan akun sendiri tanpa fallback admin.
- [ ] Proteksi endpoint hanya untuk Manager.

### Definition of Done
- Manager dapat mengelola user.
- User nonaktif tidak dapat login.
- Role user menentukan akses halaman dan endpoint.

---

## TASK-BE-026: Membuat AuditLogService

**Type:** Backend / Audit  
**Priority:** P1  
**Complexity:** M

### Checklist
- [ ] Buat fungsi `recordAuditLog`.
- [ ] Catat login gagal berulang jika diperlukan.
- [ ] Catat perubahan user, produk, batch, harga, pembelian, transaksi, retur, dan koreksi stok.
- [ ] Simpan actor user.
- [ ] Simpan entity dan action.
- [ ] Pastikan audit log tidak mengganggu transaksi utama jika logging non-kritis gagal, kecuali untuk mutasi stok yang wajib tercatat.

### Definition of Done
- Aktivitas penting terekam.
- Perubahan sensitif dapat ditelusuri.
- Audit log tersedia untuk pemeriksaan internal.

---

# PHASE 3 - Master Data

## TASK-BE-003: Membuat API Categories

**Type:** Backend  
**Priority:** P1  
**Complexity:** M  
**Related SRS:** SRS-CAT-001

### Checklist
- [ ] GET daftar kategori.
- [ ] POST kategori.
- [ ] PATCH kategori.
- [ ] PATCH nonaktifkan kategori.
- [ ] Validasi nama wajib.
- [ ] Validasi nama unik.
- [ ] Cegah hard delete kategori historis.

### Definition of Done
- Kategori dapat dibuat, diubah, dinonaktifkan.
- Kategori aktif dapat dipakai produk.

---

## TASK-FE-003: Membuat UI Kategori

**Type:** Frontend  
**Priority:** P1  
**Complexity:** M  
**Related UI:** UI Flow Kategori

### Checklist
- [ ] Buat halaman `/kategori`.
- [ ] Buat tabel kategori.
- [ ] Buat search kategori.
- [ ] Buat modal/form tambah kategori.
- [ ] Buat edit kategori.
- [ ] Buat aksi nonaktifkan.
- [ ] Tambahkan empty state.
- [ ] Tambahkan loading state.
- [ ] Tambahkan error state.

### Definition of Done
- Manager dapat mengelola kategori dari UI.
- Empty state muncul jika data kosong.

---

## TASK-BE-004: Membuat API Suppliers

**Type:** Backend  
**Priority:** P1  
**Complexity:** M  
**Related SRS:** SRS-SUP-001

### Checklist
- [ ] GET supplier.
- [ ] POST supplier.
- [ ] PATCH supplier.
- [ ] PATCH nonaktifkan supplier.
- [ ] Validasi nama wajib.
- [ ] Validasi nama unik.
- [ ] Cegah hard delete supplier historis.

### Definition of Done
- Supplier dapat dikelola.
- Supplier aktif dapat dipakai pembelian.

---

## TASK-FE-004: Membuat UI Supplier

**Type:** Frontend  
**Priority:** P1  
**Complexity:** M  
**Related UI:** UI Flow Supplier

### Checklist
- [ ] Buat halaman `/supplier`.
- [ ] Buat tabel supplier.
- [ ] Buat search supplier.
- [ ] Buat form tambah/edit supplier.
- [ ] Buat aksi nonaktifkan.
- [ ] Tambahkan validasi field.
- [ ] Tambahkan empty/loading/error state.

### Definition of Done
- Manager dapat mengelola supplier.
- Supplier nonaktif tidak dipakai pembelian baru.

---

## TASK-BE-005: Membuat API Units dan Product Units

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-UNIT-001, SRS-UNIT-002

### Checklist
- [ ] GET daftar satuan.
- [ ] POST satuan.
- [ ] PATCH satuan.
- [ ] GET satuan jual produk.
- [ ] POST satuan jual produk.
- [ ] PATCH satuan jual produk.
- [ ] PATCH nonaktifkan satuan jual produk.
- [ ] Validasi conversion_to_base > 0.
- [ ] Cegah duplikat satuan jual per produk.

### Definition of Done
- Produk dapat memiliki satuan jual.
- Konversi satuan dapat dipakai transaksi.

---

## TASK-FE-005: Membuat UI Satuan dan Konversi

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Satuan dan Konversi

### Checklist
- [ ] Buat halaman `/satuan`.
- [ ] Buat daftar satuan.
- [ ] Buat form tambah/edit satuan.
- [ ] Buat UI konversi satuan pada detail produk.
- [ ] Tambahkan input conversion_to_base.
- [ ] Tambahkan toggle satuan default.
- [ ] Tambahkan validasi angka.
- [ ] Tambahkan error konversi duplikat.

### Definition of Done
- Manager dapat mengatur satuan.
- Manager dapat mengatur satuan jual produk.

---

## TASK-BE-006: Membuat API Products

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-PROD-001 sampai SRS-PROD-004

### Checklist
- [ ] GET daftar produk dengan search dan filter.
- [ ] GET detail produk.
- [ ] POST produk.
- [ ] PATCH produk.
- [ ] PATCH nonaktifkan produk.
- [ ] PATCH aktifkan kembali produk.
- [ ] Validasi kode unik.
- [ ] Validasi barcode unik jika diisi.
- [ ] Validasi kategori dan satuan dasar.
- [ ] Tambahkan ringkasan stok jika dibutuhkan.

### Definition of Done
- Produk dapat dibuat dan diubah.
- Produk nonaktif tidak muncul di kasir.
- Produk dapat dicari berdasarkan nama, kode, barcode, kategori.

---

## TASK-FE-006: Membuat UI Produk

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Produk

### Checklist
- [ ] Buat halaman `/produk`.
- [ ] Buat tabel produk.
- [ ] Buat search produk.
- [ ] Buat filter kategori dan status.
- [ ] Buat form tambah produk.
- [ ] Buat form edit produk.
- [ ] Buat detail produk.
- [ ] Tambahkan badge aktif/nonaktif.
- [ ] Tambahkan badge stok rendah.
- [ ] Tambahkan aksi nonaktifkan/aktifkan.
- [ ] Tambahkan empty/loading/error state.

### Definition of Done
- Manager dapat mengelola produk dari UI.
- Produk dapat dikaitkan dengan kategori dan satuan dasar.
- Produk siap digunakan untuk batch dan pembelian.

---

# PHASE 4 - Batch dan Pembelian

## TASK-BE-007: Membuat BatchService dan API Batch

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-BATCH-001 sampai SRS-BATCH-003

### Checklist
- [ ] Buat BatchService.
- [ ] GET daftar batch.
- [ ] GET batch per produk.
- [ ] GET batch mendekati expired.
- [ ] POST batch manual jika diperlukan.
- [ ] PATCH status batch.
- [ ] Validasi expired date.
- [ ] Validasi stok tidak negatif.
- [ ] Validasi HPP tidak negatif.
- [ ] Validasi harga jual tidak negatif.
- [ ] Pastikan batch expired tidak dipakai transaksi.

### Definition of Done
- Batch dapat dibuat dan dilihat.
- Batch memiliki stok, HPP, expired date, dan harga jual.
- Expired alert dapat dibaca.

---

## TASK-FE-007: Membuat UI Batch

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Batch Obat

### Checklist
- [ ] Buat halaman `/batch`.
- [ ] Buat search produk/batch.
- [ ] Buat filter status batch.
- [ ] Buat filter expired.
- [ ] Buat tabel batch.
- [ ] Buat detail batch.
- [ ] Tampilkan HPP hanya untuk manager/pemilik.
- [ ] Tampilkan harga jual per satuan.
- [ ] Tampilkan mutasi stok batch.
- [ ] Tambahkan badge expired/mendekati expired/stok habis.

### Definition of Done
- Manager dapat melihat batch secara rinci.
- Batch expired dan mendekati expired terlihat jelas.
- Kasir tidak melihat HPP.

---

## TASK-BE-008: Membuat PurchaseService

**Type:** Backend  
**Priority:** P1  
**Complexity:** XL  
**Related SRS:** SRS-PUR-001, SRS-PUR-002  
**Related SDD:** PurchaseService

### Checklist
- [ ] Buat fungsi createPurchase.
- [ ] Validasi supplier aktif.
- [ ] Validasi item pembelian minimal satu.
- [ ] Validasi produk aktif.
- [ ] Validasi satuan pembelian.
- [ ] Hitung qty_base.
- [ ] Hitung hpp_base.
- [ ] Buat purchase.
- [ ] Buat purchase_items.
- [ ] Buat product_batches.
- [ ] Buat batch_unit_prices.
- [ ] Tambahkan stok batch.
- [ ] Buat stock_mutation PURCHASE_IN.
- [ ] Gunakan idempotency key untuk mencegah pembelian ganda akibat retry.
- [ ] Jalankan semua dalam database transaction.

### Definition of Done
- Pembelian valid membuat batch.
- Stok batch bertambah.
- HPP tersimpan.
- Mutasi stok masuk tercatat.
- Jika gagal, tidak ada data parsial.

---

## TASK-BE-009: Membuat API Purchases

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-PUR-001

### Checklist
- [ ] GET daftar pembelian.
- [ ] GET detail pembelian.
- [ ] POST pembelian.
- [ ] Tambahkan filter tanggal.
- [ ] Tambahkan filter supplier.
- [ ] Tambahkan search nomor invoice/pembelian.
- [ ] Proteksi endpoint hanya manager.

### Definition of Done
- Manager dapat mencatat pembelian.
- Pembelian dapat dilihat kembali.
- Kasir tidak dapat akses pembelian.

---

## TASK-FE-008: Membuat UI Pembelian Supplier

**Type:** Frontend  
**Priority:** P1  
**Complexity:** XL  
**Related UI:** UI Flow Pembelian Supplier

### Checklist
- [ ] Buat halaman `/pembelian`.
- [ ] Buat daftar pembelian.
- [ ] Buat filter tanggal dan supplier.
- [ ] Buat form pembelian baru.
- [ ] Buat item pembelian dinamis.
- [ ] Buat pilih produk.
- [ ] Buat pilih satuan pembelian.
- [ ] Buat input qty dan harga beli.
- [ ] Buat input nomor batch dan expired date.
- [ ] Buat input harga jual per satuan.
- [ ] Hitung subtotal sementara di UI.
- [ ] Tampilkan validasi field.
- [ ] Tampilkan success state.
- [ ] Redirect ke detail pembelian setelah sukses.

### Definition of Done
- Manager dapat mencatat pembelian dari UI.
- Batch dan stok bertambah setelah pembelian berhasil.
- Error validasi tampil jelas.

---

# PHASE 5 - Stok dan Mutasi

## TASK-BE-010: Membuat StockService

**Type:** Backend  
**Priority:** P0  
**Complexity:** XL  
**Related SRS:** SRS-STOCK-001 sampai SRS-STOCK-004  
**Related SDD:** StockService

### Checklist
- [ ] Buat fungsi increaseStock.
- [ ] Buat fungsi decreaseStock.
- [ ] Buat fungsi adjustStock.
- [ ] Buat fungsi createMutation.
- [ ] Validasi stok tidak negatif.
- [ ] Simpan qty_before, qty_change, qty_after.
- [ ] Simpan reference_type dan reference_id.
- [ ] Simpan created_by.
- [ ] Wajib dipakai oleh PurchaseService, SalesService, ReturnService.
- [ ] Cegah update stok langsung dari modul lain.

### Definition of Done
- Semua perubahan stok melalui StockService.
- Mutasi stok tercatat.
- Stok batch tidak pernah negatif.

---

## TASK-BE-011: Membuat API Stock dan Mutations

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-STOCK-001, SRS-STOCK-002

### Checklist
- [ ] GET daftar stok.
- [ ] GET stok per produk.
- [ ] GET mutasi stok.
- [ ] GET stok rendah.
- [ ] Tambahkan filter produk, batch, tanggal, tipe mutasi.
- [ ] Proteksi mutasi penuh hanya untuk manager.
- [ ] Kasir hanya dapat melihat stok relevan.

### Definition of Done
- Manager dapat melihat stok dan mutasi.
- Kasir tidak melihat informasi sensitif.
- Stok rendah dapat ditampilkan dashboard.

---

## TASK-BE-012: Membuat API Stock Adjustment

**Type:** Backend  
**Priority:** P2  
**Complexity:** M  
**Related SRS:** SRS-STOCK-003

### Checklist
- [ ] POST koreksi stok.
- [ ] Validasi batch.
- [ ] Validasi new_qty tidak negatif.
- [ ] Validasi alasan wajib.
- [ ] Hitung difference.
- [ ] Update stok batch.
- [ ] Buat stock_adjustment.
- [ ] Buat stock_mutation adjustment.
- [ ] Proteksi hanya manager.
- [ ] Jalankan dalam transaksi database.

### Definition of Done
- Manager dapat koreksi stok.
- Koreksi tercatat dan dapat diaudit.
- Kasir tidak dapat koreksi stok.

---

## TASK-FE-009: Membuat UI Stok dan Mutasi

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Stok dan Mutasi

### Checklist
- [ ] Buat halaman `/stok`.
- [ ] Buat daftar stok.
- [ ] Buat filter kategori dan status stok.
- [ ] Buat detail stok per batch.
- [ ] Buat halaman `/mutasi-stok`.
- [ ] Buat filter tanggal, produk, batch, tipe mutasi.
- [ ] Buat tabel mutasi.
- [ ] Buat empty/loading/error state.
- [ ] Sembunyikan data sensitif dari kasir.

### Definition of Done
- Manager dapat memantau stok dan mutasi.
- Stok kritis terlihat jelas.
- Mutasi dapat ditelusuri.

---

## TASK-FE-010: Membuat UI Koreksi Stok

**Type:** Frontend  
**Priority:** P2  
**Complexity:** M  
**Related UI:** UI Flow Koreksi Stok

### Checklist
- [ ] Buat route `/koreksi-stok`.
- [ ] Buat pilih produk.
- [ ] Buat pilih batch.
- [ ] Tampilkan stok saat ini.
- [ ] Input stok baru.
- [ ] Input alasan koreksi.
- [ ] Tambahkan dialog konfirmasi.
- [ ] Tambahkan validasi.
- [ ] Tampilkan success/error state.

### Definition of Done
- Manager dapat melakukan koreksi stok.
- UI memberi peringatan sebelum simpan.
- Koreksi berhasil membuat mutasi.

---

# PHASE 6 - Kasir, FEFO, dan Transaksi

## TASK-BE-013: Membuat FefoService

**Type:** Backend  
**Priority:** P0  
**Complexity:** XL  
**Related SRS:** SRS-FEFO-001  
**Related SDD:** FefoService

### Checklist
- [ ] Buat fungsi allocateBatches(productId, requiredQtyBase).
- [ ] Ambil batch aktif.
- [ ] Abaikan batch expired.
- [ ] Abaikan batch stok nol.
- [ ] Urutkan expired_date ascending.
- [ ] Jika tanggal sama, urutkan received_at ascending.
- [ ] Gunakan row-level locking saat transaksi.
- [ ] Split alokasi jika batch pertama tidak cukup.
- [ ] Lempar error jika stok total tidak cukup.
- [ ] Buat unit test FEFO.

### Definition of Done
- FEFO memilih batch expired terdekat.
- FEFO mengabaikan batch expired.
- FEFO dapat split multi-batch.
- FEFO aman terhadap race condition.

---

## TASK-BE-014: Membuat SalesService

**Type:** Backend  
**Priority:** P0  
**Complexity:** XL  
**Related SRS:** SRS-SALE-001 sampai SRS-SALE-006  
**Related SDD:** SalesService

### Checklist
- [ ] Validasi keranjang tidak kosong.
- [ ] Validasi produk aktif.
- [ ] Validasi satuan jual aktif.
- [ ] Hitung qty_base.
- [ ] Hitung subtotal.
- [ ] Validasi diskon.
- [ ] Validasi pembayaran.
- [ ] Jalankan FefoService.
- [ ] Buat sale.
- [ ] Buat sale_items.
- [ ] Buat sale_batch_allocations.
- [ ] Hitung HPP detail.
- [ ] Hitung laba detail.
- [ ] Update stok batch.
- [ ] Buat stock_mutation SALE_OUT.
- [ ] Jalankan semua dalam database transaction.
- [ ] Pastikan rollback jika gagal.

### Definition of Done
- Transaksi valid tersimpan.
- Stok batch berkurang.
- Mutasi stok keluar tercatat.
- Split batch tersimpan.
- Laba tersimpan dari detail transaksi.
- Transaksi gagal tidak mengubah stok.

---

## TASK-BE-027: Membuat IdempotencyService untuk Transaksi Penting

**Type:** Backend / Reliability  
**Priority:** P0  
**Complexity:** L  
**Related SDD:** Idempotency, transaksi atomic

### Checklist
- [ ] Buat fungsi validasi idempotency key.
- [ ] Simpan request hash sebelum proses transaksi.
- [ ] Tandai status key sebagai `PROCESSING`, `SUCCESS`, atau `FAILED`.
- [ ] Kembalikan response snapshot jika key yang sama sudah berhasil.
- [ ] Tolak key sama dengan payload berbeda.
- [ ] Terapkan pada checkout penjualan.
- [ ] Terapkan pada pembelian supplier.
- [ ] Terapkan pada retur penjualan.
- [ ] Terapkan pada retur pembelian jika fitur aktif.
- [ ] Terapkan pada koreksi stok.

### Definition of Done
- Checkout tidak membuat transaksi ganda.
- Retry request aman memakai key yang sama.
- Double click tidak menghasilkan data duplikat.

---

## TASK-BE-015: Membuat API Sales dan Cashier Products

**Type:** Backend  
**Priority:** P0  
**Complexity:** L  
**Related SRS:** SRS-SALE-001 sampai SRS-SALE-006

### Checklist
- [ ] GET `/api/cashier/products`.
- [ ] POST `/api/sales/preview` jika diperlukan.
- [ ] POST `/api/sales` wajib menerima `idempotencyKey`.
- [ ] GET daftar sales.
- [ ] GET detail sales.
- [ ] Role kasir hanya melihat data transaksi yang aman.
- [ ] Manager dapat melihat detail batch dan laba.
- [ ] Kasir tidak menerima HPP/laba pada response.

### Definition of Done
- Halaman kasir dapat mengambil produk.
- Transaksi dapat disimpan dari API.
- Detail transaksi dapat dibaca sesuai role.

---

## TASK-FE-011: Membuat Halaman Kasir - Layout Dasar

**Type:** Frontend  
**Priority:** P0  
**Complexity:** L  
**Related UI:** UI Flow Halaman Kasir

### Checklist
- [ ] Buat route `/kasir`.
- [ ] Buat layout panel produk dan keranjang.
- [ ] Buat search produk.
- [ ] Buat filter kategori cepat.
- [ ] Buat daftar produk.
- [ ] Buat panel detail produk terpilih.
- [ ] Buat pilihan satuan jual.
- [ ] Buat input qty.
- [ ] Buat tombol tambah ke keranjang.
- [ ] Buat responsive layout.

### Definition of Done
- Kasir dapat membuka halaman kasir.
- Produk dapat dicari.
- Produk dapat dipilih.
- UI dasar kasir siap untuk transaksi.

---

## TASK-FE-012: Membuat Keranjang Kasir

**Type:** Frontend  
**Priority:** P0  
**Complexity:** L  
**Related UI:** Flow Tambah Produk ke Keranjang

### Checklist
- [ ] Buat state cartItems.
- [ ] Tambahkan item ke keranjang.
- [ ] Ubah qty item.
- [ ] Ubah satuan item.
- [ ] Hapus item.
- [ ] Hitung subtotal sementara.
- [ ] Tampilkan error stok estimasi.
- [ ] Pastikan keranjang belum mengurangi stok.
- [ ] Tambahkan empty state keranjang.

### Definition of Done
- Kasir dapat mengelola keranjang.
- Subtotal sementara berubah sesuai item.
- Keranjang kosong memiliki empty state.

---

## TASK-FE-013: Membuat Panel Pembayaran Kasir

**Type:** Frontend  
**Priority:** P0  
**Complexity:** M  
**Related UI:** Flow Pembayaran

### Checklist
- [ ] Buat field diskon.
- [ ] Buat pilihan tipe diskon.
- [ ] Buat metode pembayaran.
- [ ] Buat input uang diterima untuk cash.
- [ ] Hitung total sementara.
- [ ] Hitung kembalian sementara.
- [ ] Disable tombol submit jika cash kurang.
- [ ] Tampilkan pesan error pembayaran.

### Definition of Done
- Kasir dapat memilih metode pembayaran.
- Cash menghitung kembalian.
- Cash kurang tidak bisa submit.

---

## TASK-FE-014: Integrasi Simpan Transaksi

**Type:** Frontend  
**Priority:** P0  
**Complexity:** L  
**Related UI:** Flow Simpan Transaksi

### Checklist
- [ ] Hubungkan tombol simpan ke POST `/api/sales`.
- [ ] Kirim cart, payment, dan `idempotencyKey`.
- [ ] Tampilkan loading saat submit.
- [ ] Disable tombol saat loading.
- [ ] Tampilkan modal sukses.
- [ ] Tampilkan error stok tidak cukup.
- [ ] Reset keranjang setelah sukses.
- [ ] Fokus kembali ke search produk.
- [ ] Cegah double submit dengan disable tombol.
- [ ] Jika request timeout, ulangi request memakai `idempotencyKey` yang sama.
- [ ] Jangan membuat key baru sebelum status transaksi lama dikonfirmasi.

### Definition of Done
- Transaksi dapat dibuat dari UI.
- UI menampilkan hasil transaksi.
- Error backend ditampilkan jelas.
- Double click dan retry jaringan tidak membuat transaksi ganda.

---

# PHASE 7 - Diskon dan Pembayaran

## TASK-BE-016: Membuat DiscountService

**Type:** Backend  
**Priority:** P0  
**Complexity:** L  
**Related SRS:** SRS-DISC-001, SRS-DISC-002

### Checklist
- [ ] Hitung diskon persen.
- [ ] Hitung diskon nominal.
- [ ] Validasi diskon tidak negatif.
- [ ] Validasi diskon tidak lebih dari subtotal.
- [ ] Alokasikan diskon ke detail batch.
- [ ] Tangani pembulatan.
- [ ] Pastikan total alokasi sama dengan total diskon.
- [ ] Buat unit test diskon.

### Definition of Done
- Diskon persen benar.
- Diskon nominal benar.
- Diskon alokasi proporsional.
- Selisih pembulatan tertangani.

---

## TASK-BE-017: Validasi Metode Pembayaran

**Type:** Backend  
**Priority:** P1  
**Complexity:** M  
**Related SRS:** SRS-SALE-006

### Checklist
- [ ] Definisikan enum CASH, TRANSFER, QRIS, DEBIT.
- [ ] Validasi metode pembayaran wajib.
- [ ] Validasi cash wajib paid_amount.
- [ ] Validasi paid_amount cash >= total.
- [ ] Hitung change_amount.
- [ ] Non-cash tidak wajib paid_amount.
- [ ] Simpan payment_method pada transaksi.

### Definition of Done
- Pembayaran cash tervalidasi.
- Kembalian cash benar.
- Non-cash dapat diproses sesuai aturan.

---

# PHASE 8 - Retur

## TASK-BE-018: Membuat Sales Return Service

**Type:** Backend  
**Priority:** P1  
**Complexity:** XL  
**Related SRS:** SRS-RETSALE-001  
**Related SDD:** ReturnService

### Checklist
- [ ] Cari transaksi asal.
- [ ] Ambil sale_batch_allocations.
- [ ] Hitung qty yang masih bisa diretur.
- [ ] Validasi qty retur > 0.
- [ ] Validasi qty retur tidak melebihi sisa.
- [ ] Validasi alasan wajib.
- [ ] Buat sales_return.
- [ ] Buat sales_return_items.
- [ ] Update returned_qty_base.
- [ ] Tambah stok ke batch asal.
- [ ] Buat stock_mutation SALES_RETURN_IN.
- [ ] Hitung refund, HPP reversed, profit reversed.
- [ ] Jalankan dalam transaksi database.

### Definition of Done
- Retur penjualan dapat dilakukan.
- Stok kembali ke batch asal.
- Laporan laba terkoreksi.
- Retur berlebih ditolak.

---

## TASK-BE-019: Membuat API Sales Returns

**Type:** Backend  
**Priority:** P1  
**Complexity:** L

### Checklist
- [ ] GET returnable items.
- [ ] POST sales return.
- [ ] GET daftar retur.
- [ ] GET detail retur.
- [ ] Role kasir dapat retur penjualan.
- [ ] Role manager dapat melihat daftar retur lengkap.

### Definition of Done
- UI retur dapat mencari transaksi.
- Retur dapat diproses.
- Detail retur dapat dilihat.

---

## TASK-FE-015: Membuat UI Retur Penjualan

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Retur Penjualan

### Checklist
- [ ] Buat halaman `/retur-penjualan`.
- [ ] Buat pencarian transaksi asal.
- [ ] Tampilkan item yang dapat diretur.
- [ ] Buat input qty retur.
- [ ] Buat input alasan retur.
- [ ] Tampilkan ringkasan refund.
- [ ] Tambahkan validasi field.
- [ ] Submit retur.
- [ ] Tampilkan success/error state.

### Definition of Done
- Kasir dapat memproses retur penjualan.
- Qty retur tidak dapat melebihi sisa.
- Stok kembali setelah retur berhasil.

---

## TASK-BE-020: Membuat Purchase Return Service dan API

**Type:** Backend  
**Priority:** P2  
**Complexity:** L  
**Related SRS:** SRS-RETPUR-001

### Checklist
- [ ] Buat service retur pembelian.
- [ ] Validasi batch.
- [ ] Validasi qty retur > 0.
- [ ] Validasi qty retur <= stok batch.
- [ ] Validasi alasan wajib.
- [ ] Buat purchase_return.
- [ ] Buat purchase_return_items.
- [ ] Kurangi stok batch.
- [ ] Buat stock_mutation PURCHASE_RETURN_OUT.
- [ ] Jalankan dalam transaksi database.
- [ ] Buat API daftar dan detail retur pembelian.

### Definition of Done
- Manager dapat retur pembelian.
- Stok batch berkurang.
- Retur berlebih ditolak.

---

## TASK-FE-016: Membuat UI Retur Pembelian

**Type:** Frontend  
**Priority:** P2  
**Complexity:** M  
**Related UI:** UI Flow Retur Pembelian

### Checklist
- [ ] Buat halaman `/retur-pembelian`.
- [ ] Buat pilih pembelian/batch.
- [ ] Buat input qty retur.
- [ ] Buat input alasan.
- [ ] Tampilkan stok batch tersedia.
- [ ] Tambahkan validasi field.
- [ ] Submit retur pembelian.
- [ ] Tampilkan success/error state.

### Definition of Done
- Manager dapat melakukan retur pembelian dari UI.
- Stok batch berkurang setelah retur berhasil.

---

# PHASE 9 - Dashboard dan Laporan

## TASK-BE-021: Membuat Dashboard Service dan API

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-DASH-001

### Checklist
- [ ] Hitung omzet hari ini.
- [ ] Hitung laba hari ini.
- [ ] Hitung laba minggu ini.
- [ ] Hitung laba bulan ini.
- [ ] Hitung laba tahun ini.
- [ ] Hitung jumlah transaksi hari ini.
- [ ] Hitung stok kritis.
- [ ] Hitung batch mendekati expired.
- [ ] Ambil transaksi terbaru.
- [ ] Ambil daftar stok kritis.
- [ ] Ambil daftar batch mendekati expired.
- [ ] Proteksi laba dari role kasir.

### Definition of Done
- Dashboard manager menampilkan ringkasan.
- Nilai laba berasal dari detail transaksi.
- Alert stok dan expired tampil.

---

## TASK-FE-017: Membuat UI Dashboard

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Dashboard

### Checklist
- [ ] Buat halaman `/dashboard`.
- [ ] Buat card omzet hari ini.
- [ ] Buat card laba hari ini.
- [ ] Buat card laba minggu/bulan/tahun.
- [ ] Buat card transaksi hari ini.
- [ ] Buat card stok kritis.
- [ ] Buat card expired alert.
- [ ] Buat daftar transaksi terbaru.
- [ ] Buat daftar stok kritis.
- [ ] Buat daftar batch mendekati expired.
- [ ] Tambahkan loading/empty/error state.

### Definition of Done
- Manager melihat dashboard lengkap.
- Kasir tidak melihat laba.
- Data dashboard mudah dibaca.

---

## TASK-BE-022: Membuat ReportService Laporan Penjualan

**Type:** Backend  
**Priority:** P1  
**Complexity:** L  
**Related SRS:** SRS-REPORT-001

### Checklist
- [ ] Filter tanggal.
- [ ] Filter metode pembayaran.
- [ ] Filter kasir.
- [ ] Filter produk/kategori jika diperlukan.
- [ ] Hitung omzet.
- [ ] Hitung diskon.
- [ ] Hitung total transaksi.
- [ ] Hitung retur terkait.
- [ ] Ambil detail transaksi.
- [ ] Tambahkan pagination.

### Definition of Done
- Laporan penjualan dapat difilter.
- Data transaksi tampil sesuai periode.
- Retur diperhitungkan.

---

## TASK-BE-023: Membuat ReportService Laporan Laba

**Type:** Backend  
**Priority:** P1  
**Complexity:** XL  
**Related SRS:** SRS-REPORT-002  
**Related SDD:** ReportService

### Checklist
- [ ] Ambil data dari sale_batch_allocations.
- [ ] Hitung gross revenue.
- [ ] Hitung total HPP.
- [ ] Hitung total diskon.
- [ ] Hitung gross profit.
- [ ] Ambil sales_return_items.
- [ ] Hitung return revenue.
- [ ] Hitung return HPP.
- [ ] Hitung return profit.
- [ ] Hitung net revenue.
- [ ] Hitung net profit.
- [ ] Buat filter periode.
- [ ] Proteksi hanya manager/pemilik.
- [ ] Pastikan perubahan harga baru tidak mengubah laporan lama.

### Definition of Done
- Laporan laba akurat berdasarkan detail transaksi.
- Retur mengoreksi laporan.
- Kasir tidak dapat akses laporan laba.

---

## TASK-FE-018: Membuat UI Laporan Penjualan

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Laporan Penjualan

### Checklist
- [ ] Buat halaman `/laporan/penjualan`.
- [ ] Buat filter periode.
- [ ] Buat filter metode pembayaran.
- [ ] Buat filter kasir.
- [ ] Buat card ringkasan.
- [ ] Buat tabel transaksi.
- [ ] Tambahkan pagination.
- [ ] Tambahkan loading/empty/error state.
- [ ] Tambahkan tombol export jika fitur export aktif.

### Definition of Done
- Manager dapat membaca laporan penjualan.
- Filter bekerja.
- Empty state tampil jika data kosong.

---

## TASK-FE-019: Membuat UI Laporan Laba

**Type:** Frontend  
**Priority:** P1  
**Complexity:** L  
**Related UI:** UI Flow Laporan Laba

### Checklist
- [ ] Buat halaman `/laporan/laba`.
- [ ] Proteksi route dari kasir.
- [ ] Buat filter periode.
- [ ] Buat card omzet.
- [ ] Buat card HPP.
- [ ] Buat card diskon.
- [ ] Buat card laba.
- [ ] Tampilkan koreksi retur.
- [ ] Buat tabel laba per transaksi/produk.
- [ ] Tambahkan loading/empty/error state.
- [ ] Tambahkan tombol export jika aktif.

### Definition of Done
- Laporan laba tampil untuk manager/pemilik.
- Kasir tidak bisa membuka halaman.
- Angka laba sesuai API.

---

# PHASE 10 - Export

## TASK-BE-024: Membuat ExportService

**Type:** Backend  
**Priority:** P2  
**Complexity:** L  
**Related SRS:** SRS-EXPORT-001

### Checklist
- [ ] Buat export Excel untuk laporan penjualan.
- [ ] Buat export PDF untuk laporan penjualan.
- [ ] Buat export Excel untuk laporan laba.
- [ ] Buat export PDF untuk laporan laba.
- [ ] Gunakan filter aktif.
- [ ] Tambahkan metadata periode laporan.
- [ ] Proteksi role.
- [ ] Tangani error export.

### Definition of Done
- File `.xlsx` dapat dibuat.
- File `.pdf` dapat dibuat.
- Isi file sesuai filter.
- Kasir tidak dapat export laporan laba.

---

## TASK-FE-020: Integrasi Tombol Export Laporan

**Type:** Frontend  
**Priority:** P2  
**Complexity:** M

### Checklist
- [ ] Tambahkan tombol Excel.
- [ ] Tambahkan tombol PDF.
- [ ] Kirim filter aktif ke API export.
- [ ] Tampilkan loading saat export.
- [ ] Tampilkan error jika export gagal.
- [ ] Pastikan tombol export tidak muncul untuk role yang tidak berhak.

### Definition of Done
- Manager dapat mengunduh laporan.
- Export memakai filter aktif.
- Error export ditampilkan jelas.

---

# PHASE 11B - Responsive dan UX Polish

## TASK-UI-001: Finalisasi Empty, Loading, Error, dan Success State

**Type:** UI/UX  
**Priority:** P1  
**Complexity:** M  
**Related UI:** State Global UI

### Checklist
- [ ] Buat komponen EmptyState.
- [ ] Buat komponen ErrorState.
- [ ] Buat komponen LoadingSkeleton.
- [ ] Buat Toast notification.
- [ ] Terapkan pada semua halaman data.
- [ ] Terapkan pada form submit.
- [ ] Terapkan pada halaman kasir.
- [ ] Terapkan pada laporan.

### Definition of Done
- Tidak ada halaman kosong tanpa pesan.
- Tidak ada proses async tanpa loading.
- Error tampil jelas.

---

## TASK-UI-002: Finalisasi Responsive Layout

**Type:** UI/UX  
**Priority:** P1  
**Complexity:** L  
**Related UI:** Responsive Behavior Detail

### Checklist
- [ ] Uji layout desktop.
- [ ] Uji layout tablet.
- [ ] Uji layout mobile.
- [ ] Sidebar berubah menjadi drawer di layar kecil.
- [ ] Tabel besar berubah menjadi card/list pada mobile.
- [ ] Halaman kasir tetap bisa digunakan di mobile.
- [ ] Hilangkan horizontal scroll tidak perlu.
- [ ] Pastikan tombol utama mudah dijangkau.

### Definition of Done
- Layout tidak pecah.
- Tidak ada horizontal scroll tidak perlu.
- Halaman kasir tetap terbaca.

---

## TASK-UI-003: Standardisasi Format Data

**Type:** UI/UX  
**Priority:** P1  
**Complexity:** S

### Checklist
- [ ] Buat formatter Rupiah.
- [ ] Buat formatter tanggal.
- [ ] Buat formatter tanggal dan jam WITA.
- [ ] Buat formatter qty dan satuan.
- [ ] Terapkan formatter ke dashboard.
- [ ] Terapkan formatter ke kasir.
- [ ] Terapkan formatter ke laporan.
- [ ] Terapkan formatter ke transaksi.

### Definition of Done
- Format uang konsisten.
- Format tanggal konsisten.
- Format qty konsisten.

---

# PHASE 12 - Testing

## TASK-TEST-001: Unit Test FEFO

**Type:** Testing  
**Priority:** P0  
**Complexity:** L  
**Related SDD:** FefoService

### Checklist
- [ ] Test memilih batch expired terdekat.
- [ ] Test mengabaikan batch expired.
- [ ] Test mengabaikan batch stok nol.
- [ ] Test split multi-batch.
- [ ] Test error stok tidak cukup.
- [ ] Test urutan jika expired date sama.

### Definition of Done
- Semua skenario FEFO lulus.
- FEFO tidak bergantung frontend.

---

## TASK-TEST-002: Unit Test DiscountService

**Type:** Testing  
**Priority:** P0  
**Complexity:** M

### Checklist
- [ ] Test diskon persen.
- [ ] Test diskon nominal.
- [ ] Test diskon lebih dari subtotal ditolak.
- [ ] Test alokasi diskon proporsional.
- [ ] Test pembulatan alokasi.
- [ ] Test total alokasi sama dengan total diskon.

### Definition of Done
- Perhitungan diskon stabil.
- Tidak ada selisih alokasi diskon.

---

## TASK-TEST-003: Integration Test Pembelian

**Type:** Testing  
**Priority:** P1  
**Complexity:** L

### Checklist
- [ ] Buat pembelian valid.
- [ ] Pastikan purchase tersimpan.
- [ ] Pastikan purchase_items tersimpan.
- [ ] Pastikan batch dibuat.
- [ ] Pastikan stok batch bertambah.
- [ ] Pastikan HPP benar.
- [ ] Pastikan mutasi PURCHASE_IN tercatat.
- [ ] Test rollback jika item invalid.

### Definition of Done
- Pembelian bekerja end-to-end.
- Data parsial tidak tersimpan jika gagal.

---

## TASK-TEST-004: Integration Test Penjualan

**Type:** Testing  
**Priority:** P0  
**Complexity:** XL

### Checklist
- [ ] Buat transaksi satu batch.
- [ ] Buat transaksi multi-batch.
- [ ] Test stok berkurang.
- [ ] Test sale_items tersimpan.
- [ ] Test sale_batch_allocations tersimpan.
- [ ] Test mutasi SALE_OUT tercatat.
- [ ] Test laba detail benar.
- [ ] Test diskon alokasi benar.
- [ ] Test cash kurang ditolak.
- [ ] Test stok tidak cukup ditolak.
- [ ] Test rollback jika gagal.

### Definition of Done
- Penjualan benar-benar mengubah stok.
- Transaksi gagal tidak mengubah stok.
- Laba dihitung dari detail batch.

---

## TASK-TEST-005: Integration Test Retur

**Type:** Testing  
**Priority:** P1  
**Complexity:** L

### Checklist
- [ ] Retur penjualan sebagian.
- [ ] Retur penjualan penuh.
- [ ] Retur melebihi qty ditolak.
- [ ] Stok kembali ke batch asal.
- [ ] Mutasi SALES_RETURN_IN tercatat.
- [ ] Laporan laba terkoreksi.
- [ ] Retur pembelian mengurangi stok.
- [ ] Retur pembelian melebihi stok ditolak.

### Definition of Done
- Retur aman dan auditable.
- Stok kembali atau berkurang sesuai aturan.

---

## TASK-TEST-006: E2E Test Alur Utama

**Type:** Testing  
**Priority:** P1  
**Complexity:** XL

### Checklist
- [ ] Login manager.
- [ ] Buat kategori.
- [ ] Buat satuan.
- [ ] Buat produk.
- [ ] Atur satuan jual.
- [ ] Buat supplier.
- [ ] Buat pembelian.
- [ ] Login kasir.
- [ ] Buat transaksi kasir.
- [ ] Retur penjualan.
- [ ] Login manager.
- [ ] Cek dashboard.
- [ ] Cek laporan laba.
- [ ] Export laporan jika tersedia.

### Definition of Done
- Alur operasional utama berjalan dari awal sampai akhir.
- Role kasir dan manager berjalan sesuai hak akses.

---

# PHASE 13 - Deployment

## TASK-DEPLOY-001: Setup Environment Deployment

**Type:** Deployment  
**Priority:** P1  
**Complexity:** M

### Checklist
- [ ] Siapkan environment production.
- [ ] Set environment variables.
- [ ] Set database production.
- [ ] Jalankan migration.
- [ ] Jalankan seed roles dan admin awal.
- [ ] Pastikan secret aman.
- [ ] Pastikan `APP_TIMEZONE=Asia/Makassar`.
- [ ] Pastikan database menyimpan timestamp UTC.
- [ ] Pastikan idempotency dan backup berjalan.

### Definition of Done
- Aplikasi dapat berjalan di production.
- Database production siap.
- Admin awal dapat login.

---

## TASK-DEPLOY-002: Setup Backup dan Recovery

**Type:** Deployment  
**Priority:** P1  
**Complexity:** M

### Checklist
- [ ] Buat strategi backup database.
- [ ] Dokumentasikan cara restore.
- [ ] Uji restore pada environment non-production.
- [ ] Pastikan backup tidak menyimpan secret di tempat publik.
- [ ] Tentukan jadwal backup.

### Definition of Done
- Backup tersedia.
- Restore pernah diuji.
- Risiko kehilangan data berkurang.

---

## TASK-DEPLOY-003: Final Production Checklist

**Type:** Deployment  
**Priority:** P1  
**Complexity:** M

### Checklist
- [ ] Semua migration berhasil.
- [ ] Semua seed berhasil.
- [ ] Login admin berhasil.
- [ ] Role kasir berhasil.
- [ ] Transaksi kasir berhasil.
- [ ] Pembelian berhasil.
- [ ] Retur berhasil.
- [ ] Dashboard tampil.
- [ ] Laporan laba tampil.
- [ ] Kasir tidak bisa akses laporan laba.
- [ ] Error page tampil aman.
- [ ] Tidak ada secret di frontend.
- [ ] Tidak ada console error fatal.
- [ ] Idempotency checkout lolos uji.
- [ ] Audit log aktivitas penting tercatat.

### Definition of Done
- Sistem siap digunakan untuk uji operasional.
- Fitur utama V1 berjalan.

---

# PHASE 14 - Final Review dan Audit Requirement

## TASK-DOC-001: Review Traceability PRD-SRS-SDD-UI-Task

**Type:** Documentation / QA  
**Priority:** P1  
**Complexity:** M

### Checklist
- [ ] Cocokkan task dengan PRD.
- [ ] Cocokkan task dengan SRS.
- [ ] Cocokkan task dengan SDD.
- [ ] Cocokkan task dengan UI/UX Flow.
- [ ] Cocokkan task dengan dokumen frontend.
- [ ] Cocokkan task dengan dokumen backend.
- [ ] Tandai requirement yang belum memiliki task.
- [ ] Tandai task yang tidak punya requirement.
- [ ] Hapus atau pindahkan task out of scope.

### Definition of Done
- Tidak ada fitur wajib yang tertinggal.
- Tidak ada task liar di luar scope V1.

---

## TASK-DOC-002: Membuat Dokumentasi Penggunaan Internal

**Type:** Documentation  
**Priority:** P2  
**Complexity:** M

### Checklist
- [ ] Dokumentasikan cara login.
- [ ] Dokumentasikan cara membuat produk.
- [ ] Dokumentasikan cara mengatur satuan.
- [ ] Dokumentasikan cara mencatat pembelian.
- [ ] Dokumentasikan cara transaksi kasir.
- [ ] Dokumentasikan cara retur.
- [ ] Dokumentasikan cara melihat laporan.
- [ ] Dokumentasikan cara backup dasar jika diperlukan.

### Definition of Done
- Pengguna internal memiliki panduan dasar.
- Fitur utama dapat dipahami tanpa membaca kode, sebuah kemewahan yang tampaknya sering diremehkan.

---

# 5. Dependency Map

## 5.1 Urutan Kritis Backend

```mermaid
flowchart TD
    A[Setup Project] --> B[Database Foundation]
    B --> C[Auth & RBAC]
    C --> C1[Refresh Token & User Management]
    B --> D[Master Data API]
    D --> E[Product Units]
    E --> F[Batch API]
    F --> G[PurchaseService]
    G --> H[StockService]
    H --> I[FefoService]
    I --> J[SalesService]
    J --> J1[IdempotencyService]
    J --> K[DiscountService]
    J --> L[ReturnService]
    L --> M[ReportService]
    M --> N[ExportService]
```

## 5.2 Urutan Kritis Frontend

```mermaid
flowchart TD
    A[Login UI] --> B[AppShell]
    B --> C[Master Data UI]
    C --> D[Batch UI]
    D --> E[Purchase UI]
    E --> F[Stock UI]
    F --> G[Cashier UI]
    G --> H[Sales Return UI]
    H --> I[Dashboard UI]
    I --> J[Reports UI]
    J --> J1[User & Settings UI]
    J1 --> K[Export UI]
    K --> L[Responsive Polish]
```

---

# 6. Prioritas MVP V1

## 6.1 Task Wajib MVP

Task berikut wajib selesai agar aplikasi layak disebut V1:

| Task ID | Nama |
|---|---|
| TASK-SETUP-001 | Setup repository |
| TASK-SETUP-002 | Setup env |
| TASK-SETUP-003 | Setup database |
| TASK-DB-001 | Roles dan users |
| TASK-DB-002 | Master dasar |
| TASK-DB-003 | Products dan units |
| TASK-DB-004 | Batch dan harga batch |
| TASK-DB-005 | Purchases |
| TASK-DB-006 | Sales dan allocations |
| TASK-DB-008 | Stock mutations |
| TASK-DB-010 | Refresh tokens |
| TASK-DB-011 | Idempotency keys |
| TASK-DB-012 | Audit logs |
| TASK-BE-001 | AuthService |
| TASK-BE-002 | Middleware RBAC |
| TASK-BE-025 | User Management API |
| TASK-BE-026 | AuditLogService |
| TASK-BE-006 | API Products |
| TASK-BE-008 | PurchaseService |
| TASK-BE-010 | StockService |
| TASK-BE-013 | FefoService |
| TASK-BE-014 | SalesService |
| TASK-BE-015 | API Sales |
| TASK-BE-027 | IdempotencyService |
| TASK-BE-016 | DiscountService |
| TASK-BE-018 | Sales Return Service |
| TASK-BE-021 | Dashboard API |
| TASK-BE-022 | Sales Report |
| TASK-BE-023 | Profit Report |
| TASK-FE-001 | Login UI |
| TASK-FE-002 | AppShell |
| TASK-FE-006 | Produk UI |
| TASK-FE-008 | Pembelian UI |
| TASK-FE-011 | Kasir layout |
| TASK-FE-012 | Keranjang kasir |
| TASK-FE-013 | Pembayaran kasir |
| TASK-FE-014 | Submit transaksi |
| TASK-FE-015 | Retur penjualan UI |
| TASK-FE-017 | Dashboard UI |
| TASK-FE-018 | Laporan penjualan UI |
| TASK-FE-019 | Laporan laba UI |
| TASK-FE-021 | UI manajemen user |
| TASK-FE-022 | UI pengaturan profil apotek |
| TASK-TEST-001 | Test FEFO |
| TASK-TEST-002 | Test diskon |
| TASK-TEST-004 | Test penjualan |
| TASK-TEST-007 | Test concurrent sale |
| TASK-TEST-008 | Test idempotency checkout |
| TASK-TEST-009 | Test role sanitization |
| TASK-TEST-010 | Test histori dan retur sebagian |

## 6.2 Task Bisa Menyusul Setelah MVP

| Task ID | Nama |
|---|---|
| TASK-BE-012 | Stock adjustment |
| TASK-BE-020 | Purchase return |
| TASK-FE-010 | UI koreksi stok |
| TASK-FE-016 | UI retur pembelian |
| TASK-BE-024 | ExportService |
| TASK-FE-020 | Tombol export |
| TASK-DOC-002 | Dokumentasi penggunaan |

---

# 7. Checklist Global Definition of Done V1

Aplikasi POS Apotek V1 dianggap selesai jika:

- [ ] User dapat login dan logout.
- [ ] Role kasir dan manager berjalan.
- [ ] Refresh token tersimpan sebagai hash dan dapat dicabut saat logout.
- [ ] User nonaktif tidak dapat login.
- [ ] Kasir tidak dapat mengakses laporan laba.
- [ ] Manager dapat membuat kategori.
- [ ] Manager dapat membuat supplier.
- [ ] Manager dapat membuat satuan.
- [ ] Manager dapat membuat produk.
- [ ] Manager dapat mengatur satuan jual produk.
- [ ] Manager dapat mencatat pembelian.
- [ ] Pembelian membuat batch.
- [ ] Pembelian menambah stok batch.
- [ ] Pembelian mencatat mutasi stok masuk.
- [ ] Kasir dapat mencari produk.
- [ ] Kasir dapat memilih satuan jual.
- [ ] Kasir dapat menambahkan item ke keranjang.
- [ ] Kasir dapat memilih metode pembayaran.
- [ ] Kasir dapat menyimpan transaksi.
- [ ] Checkout memakai idempotency key.
- [ ] Transaksi menjalankan FEFO server-side.
- [ ] Transaksi melakukan split batch jika perlu.
- [ ] Transaksi mengurangi stok batch.
- [ ] Transaksi mencatat mutasi stok keluar.
- [ ] Detail transaksi menyimpan HPP dan laba.
- [ ] Diskon persen dan nominal berjalan.
- [ ] Diskon dialokasikan ke detail batch.
- [ ] Retur penjualan dapat diproses.
- [ ] Retur penjualan mengembalikan stok ke batch asal.
- [ ] Retur penjualan mengoreksi laporan laba.
- [ ] Retur dan koreksi stok memakai idempotency key jika mengubah stok.
- [ ] Dashboard tampil.
- [ ] Laporan penjualan tampil.
- [ ] Laporan laba tampil.
- [ ] Perubahan harga tidak mengubah laporan lama.
- [ ] Empty state tersedia.
- [ ] Loading state tersedia.
- [ ] Error state tersedia.
- [ ] UI responsif.
- [ ] Manajemen user tersedia untuk Manager.
- [ ] Pengaturan profil apotek tersedia.
- [ ] Audit log aktivitas penting tercatat.
- [ ] Unit test FEFO lulus.
- [ ] Unit test diskon lulus.
- [ ] Integration test penjualan lulus.
- [ ] Tidak ada fitur out of scope V1 yang menyusup diam-diam.

---

# 8. Guardrail Implementasi

AI coding tidak boleh:

1. Membuat transaksi tanpa `sale_batch_allocations`.
2. Menghapus `stock_mutations`.
3. Menyimpan stok hanya pada tabel produk.
4. Mengabaikan batch expired.
5. Mengabaikan FEFO.
6. Menghitung laba dari harga produk terbaru.
7. Mengirim HPP/laba ke role kasir.
8. Menyimpan password plaintext.
9. Membuat fitur payment gateway otomatis.
10. Membuat fitur BPJS.
11. Membuat fitur multi-cabang.
12. Menghapus transaksi final secara permanen.
13. Menghapus batch historis secara permanen.
14. Mengizinkan stok negatif.
15. Mengizinkan retur tanpa transaksi asal.
16. Mengizinkan retur melebihi qty yang belum diretur.
17. Membuat UI tanpa empty/loading/error state.
18. Membuat halaman kasir yang memaksa kasir berpindah-pindah halaman untuk transaksi normal.
19. Menggunakan waktu browser sebagai waktu final transaksi.
20. Membuat checkout tanpa idempotency key.
21. Menyimpan refresh token plaintext.
22. Mengirim field sensitif ke kasir hanya karena UI tidak menampilkannya.
23. Menganggap test tidak perlu karena aplikasi “sudah jalan”. Frasa itu biasanya berarti bug sedang menunggu giliran tampil.

---

# 9. Catatan untuk AI Coding Saat Eksekusi

Gunakan urutan kerja berikut jika harus membangun aplikasi secara bertahap:

```text
1. Setup project
2. Database migration
3. Seed role dan admin
4. Auth, refresh token, RBAC, user foundation, dan audit log
5. Master data
6. Satuan dan konversi
7. Batch
8. Pembelian
9. StockService dan mutasi
10. FEFO
11. SalesService dan IdempotencyService
12. Halaman kasir
13. Retur penjualan
14. Dashboard
15. Laporan laba
16. User management dan settings
17. Export
18. Testing
19. Deployment
```

Jika suatu fitur membutuhkan data dari fitur sebelumnya, jangan membuat mock permanen. Mock hanya boleh sementara dan harus dihapus saat API tersedia.

---

# 10. Definition of Done Dokumen Task Breakdown

Dokumen ini dianggap selesai jika:

- semua fase implementasi tersedia;
- task memiliki ID;
- task memiliki prioritas;
- task memiliki checklist;
- task memiliki definition of done;
- task memiliki relasi ke PRD/SRS/SDD/UI jika relevan;
- urutan dependensi jelas;
- MVP task ditandai;
- guardrail implementasi tersedia;
- dokumen dapat langsung digunakan AI coding sebagai panduan kerja bertahap;
- route frontend final sinkron dengan SDD dan UI/UX Flow;
- task idempotency, refresh token, audit log, manajemen user, settings, dan testing kritis tersedia.
