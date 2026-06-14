# Task Completed Log - POS Apotek

## 0. Metadata Dokumen

| Item | Isi |
|---|---|
| Nama proyek | POS Apotek V2 |
| Nama file | `08_TASK_COMPLETED_LOG_POS_APOTEK.md` |
| Versi dokumen | 0.2.0 |
| Status dokumen | Audit Backend Tervalidasi, Frontend V1 Build-Level, Deployment Local Parsial |
| Tanggal dibuat | 2026-06-05 |
| Tanggal terakhir diperbarui | 2026-06-14 |
| Penyusun | Codex GPT |
| Dokumen rujukan | `01_PRD_POS_APOTEK.md`, `02_SRS_POS_APOTEK.md`, `03_SDD_SYSTEM_DESIGN_POS_APOTEK.md`, `04_UI_UX_FLOW_POS_APOTEK.md`, `05_TASK_BREAKDOWN_POS_APOTEK.md`, `06_FRONTEND_POS_APOTEK.md`, `07_BACKEND_POS_APOTEK.md` |

## 1. Ringkasan Audit 2026-06-06

Audit ini memverifikasi progres aktual repository setelah PostgreSQL development dijalankan melalui Docker Compose pada port `55432`.

| Area | Status | Bukti |
|---|---|---|
| Database dan Prisma | Selesai Terverifikasi | `db:validate`, `db:deploy`, `db:generate`, dan `db:seed` berhasil. |
| Backend API utama | Selesai Terverifikasi | `npm.cmd test -- --runInBand`: 18 test suite lulus, 78 test lulus. |
| API smoke test | Selesai Terverifikasi | Manager login/dashboard/reports berhasil; user kasir sementara dapat akses cashier products dan ditolak dari profit report; user kasir smoke dinonaktifkan setelah test. |
| Frontend build | Selesai Parsial | `npm.cmd run build` berhasil setelah UI pemesanan/PO ditambahkan. |
| Frontend halaman operasional | Selesai Build-Level, Perlu Smoke Manual | UI master data, batch, PO, pembelian, kasir, resep, konseling, retur, laporan, export, users, settings, dan audit log tersedia; smoke operasional penuh belum dicatat. |
| Audit log | Selesai Build-Level, Perlu Smoke Manual | Migration `audit_logs`, backend `AuditLogsModule`, dan halaman Manager read-only `/audit-log` tersedia. |
| Settings profil apotek | Selesai Build-Level, Perlu Smoke Manual | Migration `app_settings`, backend `SettingsModule`, dan UI `/settings` tersedia. |

## 2. Hasil Command Verifikasi

```text
docker compose -f database/docker-compose.yml up -d
Container pos_apotek_risyah_postgres Running

npm.cmd run db:validate
The schema at prisma\schema.prisma is valid

npm.cmd run db:deploy
11 migrations found
No pending migrations to apply

npm.cmd run db:generate
Generated Prisma Client

npm.cmd run db:seed
The seed command has been executed

npm.cmd test -- --runInBand
Test Suites: 18 passed, 18 total
Tests: 78 passed, 78 total

API smoke test
manager login -> passed
GET /api/dashboard/summary as manager -> passed
GET /api/reports/sales as manager -> passed
GET /api/reports/profit as manager -> passed
GET /api/cashier/products as temporary cashier -> passed
GET /api/reports/profit as temporary cashier -> blocked with 403
temporary cashier smoke user -> deactivated

npm.cmd run build
vite build completed successfully
```

## 3. Ringkasan Progres Per Fase

| Fase | Nama Fase | Status Audit | Catatan |
|---|---|---|---|
| Phase 0 | Persiapan Proyek | Selesai Terverifikasi | Struktur repo, package, env example, Docker Compose, README, dan script tersedia. |
| Phase 1 | Database Foundation | Selesai Terverifikasi | Migration Prisma tersedia dan deploy berhasil. |
| Phase 2 | Auth, RBAC, User & Security Foundation | Selesai Build-Level | Auth, refresh token, RBAC, users, dan audit log tersedia; smoke role UI dan audit log penuh masih masuk sesi testing. |
| Phase 3 | Master Data | Selesai Terverifikasi Backend, Frontend Selesai | API dan integration test master data lulus; UI kategori, supplier, satuan, produk, dan pengaturan satuan jual produk tersedia. |
| Phase 4 | Batch, PO & Pembelian | Selesai Terverifikasi Backend, Frontend Selesai Build-Level | Batch, PO, dan pembelian memiliki backend/UI; pembelian UI build-level lulus, smoke test operasional masih perlu. |
| Phase 5 | Stok & Mutasi | Selesai Terverifikasi Backend | Stock summary, mutation, dan stock adjustment teruji. |
| Phase 6 | Kasir & Transaksi | Selesai Terverifikasi Backend, Frontend Parsial | FEFO, split batch, checkout, idempotency, dan cashier-safe response teruji; UI kasir tersedia. |
| Phase 6C | Pelayanan Resep dan Konseling | Selesai Terverifikasi Backend, Frontend Selesai Build-Level | Backend resep/konseling teruji; UI resep, integrasi kasir resep siap bayar, dan UI konseling tersedia. |
| Phase 7 | Diskon & Pembayaran | Selesai Terverifikasi Backend | Unit/integration test diskon dan pembayaran lulus. |
| Phase 8 | Retur | Selesai Terverifikasi Backend, Frontend Selesai Build-Level | Retur penjualan dan retur pembelian memiliki UI; backend tetap sumber mutasi stok. |
| Phase 9 | Dashboard & Laporan | Selesai Terverifikasi Backend dan Frontend Parsial | Dashboard/reports backend teruji; halaman dashboard dan laporan tersedia. |
| Phase 10 | Export | Selesai Terverifikasi Backend, Frontend Selesai Build-Level | Export xlsx/pdf teruji dan UI download laporan tersedia. |
| Phase 11 | User, Settings, Responsive & UX Polish | Selesai Build-Level, Perlu Smoke Manual | UI users, settings, dan audit log Manager tersedia; validasi ringan frontend perlu dijalankan setelah polish. |
| Phase 12 | Testing | Selesai Sebagian | Backend Jest/Supertest lulus; E2E browser/manual smoke test belum dicatat. |
| Phase 13 | Deployment | Selesai Parsial | Docker Full Local Mode menjadi target utama V1; healthcheck, CORS env, Docker Compose lokal, reverse proxy, dan script backup/restore tersedia; checklist produksi dan restore formal belum masuk sesi testing. |
| Phase 14 | Final Review | Sedang Dikerjakan | Audit progres aktual sudah dibuat; traceability penuh masih perlu dilanjutkan setelah UI selesai. |

## 4. Daftar Task Selesai Terverifikasi

| No | Task ID | Nama Task | Fase | Bukti Implementasi | Cara Verifikasi | Catatan |
|---:|---|---|---|---|---|---|
| 1 | TASK-SETUP-001 | Setup repository dan struktur awal | Phase 0 | Folder `backend`, `frontend`, `database`, `docs`, `tests`; README diperbarui. | `Get-ChildItem`, build/test command. | Selesai. |
| 2 | TASK-SETUP-002 | Setup environment variables | Phase 0 | `.env.example` memuat DB, JWT, CORS, Vite API, timezone, export dir. | `Get-Content .env.example`; app config validation. | Selesai untuk development. |
| 3 | TASK-SETUP-003 | Setup database connection dan ORM | Phase 0 | Prisma schema, migrations, seed, PostgreSQL Docker Compose. | `db:validate`, `db:deploy`, `db:generate`, `db:seed`. | Selesai. |
| 4 | TASK-DB-001 | Roles dan users | Phase 1 | Prisma models, seed roles/users, auth tests. | Auth integration tests lulus. | Selesai. |
| 5 | TASK-DB-002 | Categories, suppliers, units | Phase 1 | Prisma models dan master-data tests. | Master Data API tests lulus. | Selesai. |
| 6 | TASK-DB-003 | Products dan product units | Phase 1 | Product/ProductUnit schema dan APIs. | Master Data API + sales unit tests lulus. | Selesai. |
| 7 | TASK-DB-004 | Product batches dan batch unit prices | Phase 1 | ProductBatch/BatchUnitPrice schema dan batch APIs. | Batches API tests lulus. | Selesai. |
| 8 | TASK-DB-005 | Purchases dan purchase items | Phase 1 | Purchase/PurchaseItem schema dan purchase service. | Purchases API tests lulus. | Selesai. |
| 9 | TASK-DB-006 | Sales, sale items, dan sale batch allocations | Phase 1 | Sale/SaleItem/SaleBatchAllocation schema dan sales service. | Sales API tests lulus. | Selesai. |
| 10 | TASK-DB-007 | Returns | Phase 1 | SalesReturn dan PurchaseReturn schema/services. | Sales Returns dan Purchase Returns API tests lulus. | Selesai. |
| 11 | TASK-DB-008 | Stock mutations dan stock adjustments | Phase 1 | StockMutation/StockAdjustment schema dan services. | Stock API tests lulus. | Selesai. |
| 12 | TASK-DB-010 | Refresh tokens | Phase 1/2 | RefreshToken schema dan auth service. | Refresh rotation/revoke tests lulus. | Selesai. |
| 13 | TASK-DB-011 | Idempotency keys | Phase 1/6 | IdempotencyKey schema dan service. | Idempotency unit/integration tests lulus. | Selesai. |
| 14 | TASK-DB-013 | Presisi harga modal dan HPP | Phase 4C | Decimal schema untuk purchase price, HPP, profit; sales precision tests. | Precision sales tests lulus. | Selesai. |
| 15 | TASK-DB-PO-001 | Purchase orders dan items | Phase 4D | PurchaseOrder/PurchaseOrderItem schema dan service. | Purchase Orders API tests lulus. | Selesai. |
| 16 | TASK-DB-PRESC-001 | Prescriptions dan items | Phase 6C | Prescription/PrescriptionItem schema dan service. | Prescriptions API tests lulus. | Selesai. |
| 17 | TASK-DB-COUNS-001 | Counseling records | Phase 6C | CounselingRecord schema dan service. | Counseling API tests lulus. | Selesai. |
| 18 | TASK-BE-001 | AuthService | Phase 2 | Auth module/controller/service. | Auth integration tests lulus. | Selesai. |
| 19 | TASK-BE-002 | Middleware/guard RBAC | Phase 2 | JWT guard, roles guard, controller role decorators. | Auth/RBAC integration tests lulus. | Selesai. |
| 20 | TASK-BE-025 | User Management API | Phase 2/11 | Users module/controller/service. | Manager-only users endpoint test lulus. | Selesai. |
| 21 | TASK-BE-006 | API Products dan master data | Phase 3 | Categories, suppliers, units, products modules. | Master Data API tests lulus. | Selesai. |
| 22 | TASK-BE-UNIT-REV-001 | Revisi satuan jual aktif | Phase 3/6 | Product units dengan `isSaleUnit`, `minSaleQty`; cashier filtering. | Sales API unit restriction tests lulus. | Selesai. |
| 23 | TASK-BE-PO-001 | PurchaseOrderService | Phase 4D | Purchase orders module. | PO tests lulus. | Selesai. |
| 24 | TASK-BE-PO-002 | Convert PO ke pembelian | Phase 4D | Convert endpoint dan purchase draft/finalization integration. | PO conversion tests lulus. | Selesai. |
| 25 | TASK-BE-008 | PurchaseService | Phase 4 | Purchases module/service. | Purchases API tests lulus. | Selesai. |
| 26 | TASK-BE-PUR-REV-001 | PurchaseService untuk PO, diskon, PPN, faktur | Phase 4D | Purchase discount/tax/invoice behavior. | Purchase discount/PPN/invoice tests lulus. | Selesai. |
| 27 | TASK-BE-010 | StockService | Phase 5 | Stock module/services/controllers. | Stock API tests lulus. | Selesai. |
| 28 | TASK-BE-012 | Stock adjustment | Phase 5 | Stock adjustment endpoint/service. | Stock adjustment tests lulus. | Selesai walau MVP table menyebut bisa menyusul. |
| 29 | TASK-BE-013 | FefoService | Phase 6 | FEFO service. | FEFO unit tests lulus. | Selesai. |
| 30 | TASK-BE-014 | SalesService | Phase 6 | Sales service checkout flow. | Sales integration tests lulus. | Selesai. |
| 31 | TASK-BE-015 | API Sales | Phase 6 | Sales and cashier products controllers. | Sales API tests lulus. | Selesai. |
| 32 | TASK-BE-027 | IdempotencyService | Phase 6 | Idempotency service. | Idempotency tests lulus. | Selesai. |
| 33 | TASK-BE-PRESC-001 | PrescriptionService | Phase 6C | Prescriptions module/service. | Prescription tests lulus. | Selesai. |
| 34 | TASK-BE-PRESC-002 | Tarik resep ke checkout | Phase 6C | Sales from prescription endpoint. | Prescription checkout test lulus. | Selesai. |
| 35 | TASK-BE-COUNS-001 | CounselingService | Phase 6C | Counseling records module/service. | Counseling test lulus. | Selesai. |
| 36 | TASK-BE-016 | DiscountService | Phase 7 | Discount service. | Discount unit tests lulus. | Selesai. |
| 37 | TASK-BE-018 | Sales Return Service | Phase 8 | Sales returns module/service. | Sales Returns API tests lulus. | Selesai. |
| 38 | TASK-BE-020 | Purchase return | Phase 8 | Purchase returns module/service. | Purchase Returns API tests lulus. | Selesai walau MVP table menyebut bisa menyusul. |
| 39 | TASK-BE-021 | Dashboard API | Phase 9 | Dashboard module/service/controller. | Dashboard API tests lulus. | Selesai. |
| 40 | TASK-BE-022 | Sales Report | Phase 9 | Reports sales endpoint/service. | Reports API tests lulus. | Selesai. |
| 41 | TASK-BE-023 | Profit Report | Phase 9 | Reports profit endpoint/service. | Reports API tests lulus. | Selesai. |
| 42 | TASK-BE-024 | ExportService | Phase 10 | Export service xlsx/pdf endpoints. | Exports API tests lulus. | Selesai walau MVP table menyebut bisa menyusul. |
| 43 | TASK-FE-001 | Login UI | Phase 2 | Login page, auth store, API client. | Frontend build lulus. | Selesai build-level; smoke test manual belum dicatat. |
| 44 | TASK-FE-002 | AppShell | Phase 2 | AppShell/protected routes. | Frontend build lulus. | Selesai build-level; role smoke test manual belum dicatat. |
| 45 | TASK-FE-011 | Kasir layout | Phase 6 | CashierPage tersedia. | Frontend build lulus. | Selesai build-level. |
| 46 | TASK-FE-012 | Keranjang kasir | Phase 6 | Cashier cart store tersedia. | Frontend build lulus. | Selesai build-level. |
| 47 | TASK-FE-013 | Pembayaran kasir | Phase 7 | Cashier payment flow pada CashierPage/API. | Frontend build lulus. | Selesai build-level. |
| 48 | TASK-FE-014 | Submit transaksi | Phase 6/7 | Cashier API/hooks tersedia. | Frontend build lulus. | Selesai build-level. |
| 49 | TASK-FE-006 | Produk UI | Phase 3 | ProductsPage tersambung ke `/produk` dengan list, search, create, deactivate, dan panel satuan jual produk. | Frontend build lulus. | Selesai. |
| 50 | TASK-FE-UNIT-REV-001 | UI satuan jual aktif | Phase 3 | UnitsPage tersambung ke `/satuan`; Product detail mendukung tambah, default, boleh jual/nonjual, minimum qty, catatan, dan deactivate satuan produk. | Frontend build lulus. | Selesai. |
| 51 | TASK-FE-MASTER-CAT | Kategori UI | Phase 3 | CategoriesPage tersambung ke `/kategori` dengan list, create, deactivate. | Frontend build lulus. | Task pendukung karena breakdown merinci master data lewat produk/satuan. |
| 52 | TASK-FE-MASTER-SUP | Supplier UI | Phase 3 | SuppliersPage tersambung ke `/supplier` dengan list, create, deactivate. | Frontend build lulus. | Task pendukung karena breakdown merinci master data lewat pembelian. |
| 53 | TASK-FE-007 | Batch UI | Phase 4 | BatchPage tersambung ke `/batch` dengan create batch, harga jual per satuan aktif, search, filter status/expired, detail batch, mutasi stok batch, dan deactivate. | Frontend build lulus. | Selesai. |
| 54 | TASK-FE-PO-001 | UI PO obat | Phase 4D | PurchaseOrderPage tersambung ke `/pemesanan` dengan create PO, item produk/satuan, list, status, mark sent, cancel, print preview, dan convert draft pembelian. | Frontend build lulus. | Selesai. |
| 55 | TASK-FE-PO-002 | UI convert PO ke pembelian | Phase 4D | Tombol Convert memanggil `/api/purchase-orders/:id/convert-to-purchase` dan menampilkan draft pembelian dari backend. | Frontend build lulus. | Selesai awal; integrasi ke halaman pembelian final menunggu UI pembelian. |
| 56 | TASK-FE-017 | Dashboard UI | Phase 9 | DashboardPage tersedia. | Frontend build lulus. | Selesai build-level. |
| 57 | TASK-FE-018 | Laporan penjualan UI | Phase 9 | SalesReportPage tersedia. | Frontend build lulus. | Selesai build-level. |
| 58 | TASK-FE-019 | Laporan laba UI | Phase 9 | ProfitReportPage tersedia. | Frontend build lulus. | Selesai build-level. |
| 59 | TASK-FE-008 | Pembelian UI | Phase 4 | PurchasePage tersambung ke `/pembelian` dengan daftar pembelian, filter client-side, form pembelian manual, item dinamis, batch, expired date, harga beli, diskon, harga jual manual, dan detail pembelian. | Frontend build lulus. | Selesai build-level; smoke test operasional dengan backend hidup masih perlu. |
| 60 | TASK-FE-PUR-REV-001 | UI pembelian faktur, diskon, PPN | Phase 4D | PurchasePage mendukung faktur supplier, tanggal faktur, mode PPN, total faktur input, pembulatan/koreksi, catatan selisih, diskon item, dan pembelian dari PO. | Frontend build lulus. | Selesai build-level; final stock mutation tetap backend. |
| 61 | TASK-DEPLOY-001 | Setup environment deployment | Phase 13 | Docker Full Local Mode, `/api/health`, CORS env, compose lokal, frontend Nginx proxy, dan dokumentasi local network deployment. | Build/checkpoint Docker sudah dilakukan pada sesi deployment sebelumnya. | Selesai parsial untuk local mode; production checklist dan restore formal masih pending. |
| 62 | TASK-TEST-001 | Test FEFO | Phase 12 | `fefo.service.spec.ts`. | Backend test lulus. | Selesai. |
| 63 | TASK-TEST-002 | Test diskon | Phase 12 | `discount.service.spec.ts`. | Backend test lulus. | Selesai. |
| 64 | TASK-TEST-004 | Integration test penjualan | Phase 12 | `sales.integration.spec.ts`. | Backend test lulus. | Selesai. |
| 65 | TASK-TEST-008 | Test idempotency checkout | Phase 12 | Sales/idempotency tests. | Backend test lulus. | Selesai. |
| 66 | TASK-TEST-009 | Test role sanitization | Phase 12 | Sales/Auth/Reports role tests. | Backend test lulus. | Selesai. |
| 67 | TASK-TEST-010 | Test histori dan retur sebagian | Phase 12 | Sales returns/reports tests. | Backend test lulus. | Selesai. |
| 68 | TASK-TEST-PO-001 | Test PO tidak mengubah stok | Phase 12 | Purchase Orders API tests. | Backend test lulus. | Selesai. |
| 69 | TASK-TEST-PUR-001 | Test pembelian dari PO, diskon, PPN, dan faktur | Phase 12 | Purchases and PO tests. | Backend test lulus. | Selesai. |
| 70 | TASK-TEST-PRECISION-001 | Test presisi harga modal, HPP, laba internal | Phase 12 | Sales precision tests. | Backend test lulus. | Selesai. |
| 71 | TASK-TEST-PRESC-001 | Test pelayanan resep dasar | Phase 12 | Prescriptions integration tests. | Backend test lulus. | Selesai. |
| 72 | TASK-TEST-UNIT-001 | Test pembatasan satuan jual aktif | Phase 12 | Sales API unit restriction tests. | Backend test lulus. | Selesai. |

## 5. Task Belum Selesai / Perlu Lanjutan

| Task ID | Nama Task | Status | Alasan |
|---|---|---|---|
| TASK-BE-026 | AuditLogService | Selesai Build-Level, Perlu Smoke Manual | `AuditLogsService` dan endpoint Manager `/api/audit-logs` tersedia; cakupan event audit penuh perlu diverifikasi di sesi testing. |
| TASK-DB-012 | Audit logs | Selesai Build-Level | Migration dan Prisma model `AuditLog` tersedia. |
| TASK-FE-PRESC-001 | UI pelayanan resep | Selesai Build-Level | `/pelayanan/resep` tersedia untuk daftar, form resep, mark ready, dan cancel. |
| TASK-FE-PRESC-002 | Integrasi resep ke kasir | Selesai Build-Level | `/kasir` menampilkan resep siap bayar dan checkout via backend. |
| TASK-FE-COUNS-001 | UI konseling dasar | Selesai Build-Level | `/pelayanan/konseling` tersedia untuk list dan create catatan konseling. |
| TASK-FE-015 | Retur penjualan UI | Selesai Build-Level | `/retur-penjualan` tersedia dan memakai idempotency key. |
| TASK-FE-016 | UI retur pembelian | Selesai Build-Level | `/retur-pembelian` tersedia dan memakai idempotency key. |
| TASK-FE-020 | Tombol export | Selesai Build-Level | `/export` tersedia untuk download laporan penjualan/laba XLSX/PDF. |
| TASK-FE-021 | UI manajemen user | Selesai Build-Level, Perlu Smoke Manual | `/users` tersedia untuk create user, ubah role, aktif/nonaktif akun, dan feedback operator. |
| TASK-FE-022 | UI pengaturan profil apotek | Selesai Build-Level, Perlu Smoke Manual | `/settings` tersedia dan tersambung ke backend settings Manager-only. |
| TASK-FE-AUDIT-001 | UI audit log Manager | Selesai Build-Level, Perlu Smoke Manual | `/audit-log` tersedia read-only untuk 200 aktivitas terbaru dari backend. |
| TASK-TEST-006 | E2E test alur utama | Belum Selesai | Belum ada E2E browser/manual smoke test tercatat. |
| TASK-TEST-007 | Test concurrent sale | Belum Terbukti | Tidak ditemukan bukti eksplisit dari nama test audit ini. |
| TASK-DEPLOY-001 | Setup environment deployment | Selesai Parsial | Konfigurasi local network deployment siap; checklist produksi local dan restore formal belum dijalankan di sesi testing. |
| TASK-DEPLOY-002 | Setup backup dan recovery | Selesai Parsial | Script backup/restore lokal tersedia; restore test formal tetap masuk sesi deployment/testing. |
| TASK-DEPLOY-003 | Final production checklist | Belum Dikerjakan | Menunggu UI, audit log/settings, E2E, dan deployment. |
| TASK-DOC-001 | Review traceability penuh | Sedang Dikerjakan | Audit progres sudah dibuat, traceability detail penuh belum selesai. |
| TASK-DOC-002 | Dokumentasi penggunaan internal | Belum Dikerjakan | Belum ada panduan pengguna akhir. |

## 6. Catatan Risiko

- Backend test membutuhkan PostgreSQL development berjalan di `127.0.0.1:55432`.
- `prisma generate` sempat gagal karena lock file DLL Windows, lalu berhasil setelah test selesai. Jika terulang, tutup proses Node yang memegang Prisma Client dan ulangi command.
- Frontend build lulus pada checkpoint sebelumnya, tetapi build bukan pengganti smoke test operasional dengan backend hidup.
- Target deployment utama V1 saat ini adalah Docker Full Local Mode; Vercel/Railway hanya future-cloud-deployment dan tidak menjadi default aktif.
- Task frontend yang selesai build-level tetap perlu smoke manual sebelum ditandai siap operasional.
- Audit log/settings/users sudah ada di source, tetapi cakupan event audit, role UI, dan alur operator perlu diverifikasi di sesi testing khusus.

## 7. Riwayat Perubahan Log

| Tanggal | Perubahan | Task Terkait | Catatan |
|---|---|---|---|
| 2026-06-05 | Membuat dokumen awal Task Completed Log. | - | Versi awal dibuat konservatif. |
| 2026-06-06 | Audit backend/frontend, menjalankan database, migration, seed, backend test, frontend build, mencatat task selesai/gap, dan menambahkan UI master data awal. | Banyak task Phase 0-12 | Backend tervalidasi; frontend master data awal selesai; route operasional lain masih perlu dilanjutkan. |
| 2026-06-06 | Menambahkan UI pengaturan satuan jual aktif per produk dan verifikasi frontend build. | TASK-FE-006, TASK-FE-UNIT-REV-001 | Produk UI sekarang mendukung panel satuan jual produk. |
| 2026-06-06 | Menambahkan UI Batch dan verifikasi frontend build. | TASK-FE-007 | `/batch` sekarang mendukung create/list/search/filter/detail/mutasi/deactivate. |
| 2026-06-06 | Menambahkan UI Pemesanan/PO dan verifikasi frontend build. | TASK-FE-PO-001, TASK-FE-PO-002 | `/pemesanan` sekarang mendukung create/list/status/preview/convert draft. |
| 2026-06-06 | Menambahkan UI Pembelian Supplier dan konfigurasi deployment awal. | TASK-FE-008, TASK-FE-PUR-REV-001, TASK-DEPLOY-001 | `/pembelian` dan `/pembelian/dari-po/:poId` tersambung ke PurchasePage; deployment config, healthcheck, CORS env, dan dokumentasi tersedia. |
| 2026-06-12 | Menutup gap UI operasional V1 untuk resep, konseling, retur pembelian, export, dan integrasi resep siap bayar di kasir. | TASK-FE-PRESC-001, TASK-FE-PRESC-002, TASK-FE-COUNS-001, TASK-FE-016, TASK-FE-020 | Frontend build lulus; backend regression prescriptions, purchase returns, sales, reports, exports lulus di database test sementara. |
| 2026-06-14 | Menyinkronkan status Phase 11, polish UI Manager, dan menambahkan halaman audit log read-only. | TASK-FE-021, TASK-FE-022, TASK-FE-AUDIT-001, TASK-BE-026, TASK-DB-012 | Validasi ringan frontend dilakukan pada sesi implementasi; smoke manual penuh tetap masuk sesi testing khusus. |
