# Design Specification - Documentation Refactor POS Apotek V2

Dokumen ini berisi rancangan refactor dan penyinkronan total dokumentasi POS Apotek V2 agar sesuai dengan implementasi backend/frontend terbaru per Juli 2026.

## 1. Ruang Lingkup Refactor Dokumentasi

Pembaruan dokumentasi akan dilakukan secara sistematis tanpa mengubah aturan bisnis inti (seperti stok batch, FEFO, decimal HPP, RBAC, dan transactional safety).

### Dokumen yang Diperbarui (Existing Documents)
1. `docs/01_PRD_POS_APOTEK.md`: Menambahkan fitur Kategori Hirarki, Notification Center real-time berbasis RBAC, dan User Profile Menu pada scope V1.
2. `docs/02_SRS_POS_APOTEK.md`: Menambahkan FR-CAT-002 (Kategori Hirarki) dan FR-NOTIF-001 (Pusat Notifikasi Operasional), memperbarui daftar endpoint API & validasi input.
3. `docs/03_SDD_SYSTEM_DESIGN_POS_APOTEK.md`: Memperbarui schema Prisma/ERD untuk self-referencing `Category`, strategi cache Redis (`categories:tree`, `categories:flat`), dan arsitektur `NotificationsModule`.
4. `docs/business-rules.md`: Menambahkan aturan hirarki kategori dan visibility notifikasi RBAC.
5. `docs/04_UI_UX_FLOW_POS_APOTEK.md`: Menambahkan flow UI Tree View Category Management dan Notification Center Bell & Panel.
6. `docs/05_TASK_BREAKDOWN_POS_APOTEK.md`: Menyelaraskan status checklist hingga audit rilis Juli 2026.
7. `docs/06_FRONTEND_POS_APOTEK.md`: Menambahkan spesifikasi komponen `CategoryTreeView`, `NotificationCenter`, `UserProfileMenu`, dan LocalStorage sync.
8. `docs/07_BACKEND_POS_APOTEK.md`: Menambahkan detail `CategoriesService` (tree traversal & cycle detection) dan `NotificationsService` (dynamic parallel query).

### Dokumen Baru yang Dibuat (New Documents)
1. `docs/domains/PRODUCT_DOMAIN_SPEC.md`: Spesifikasi domain produk, kategori hirarki, satuan aktif, dan presisi harga modal vs harga jual.
2. `docs/domains/INVENTORY_DOMAIN_SPEC.md`: Spesifikasi domain inventaris, stok batch, FEFO, mutasi stok, dan koreksi stok.
3. `docs/domains/PURCHASING_DOMAIN_SPEC.md`: Spesifikasi domain pemesanan (PO), conversion ke pembelian supplier, dan retur pembelian.
4. `docs/domains/SALES_DOMAIN_SPEC.md`: Spesifikasi domain transaksi kasir, pelayanan resep, konseling, split batch allocation, HPP/laba historis, dan retur penjualan.
5. `docs/adr/0001-hierarchical-category-system.md`: ADR arsitektur Kategori Hirarki berbasis Self-Referencing Relation Prisma.
6. `docs/adr/0002-notification-center-dynamic-synthesis.md`: ADR arsitektur Notification Center berbasis State-Based Dynamic Synthesis & LocalStorage.

---

## 2. Roadmap Eksekusi per Sprint

### Sprint 1: Core Specs Sync (Dokumen Induk)
- Update `01_PRD_POS_APOTEK.md`
- Update `02_SRS_POS_APOTEK.md`
- Update `03_SDD_SYSTEM_DESIGN_POS_APOTEK.md`

### Sprint 2: Flow & Rules Sync
- Update `business-rules.md`
- Update `04_UI_UX_FLOW_POS_APOTEK.md`
- Update `05_TASK_BREAKDOWN_POS_APOTEK.md`

### Sprint 3: Domain Specifications
- Buat `docs/domains/PRODUCT_DOMAIN_SPEC.md`
- Buat `docs/domains/INVENTORY_DOMAIN_SPEC.md`

### Sprint 4: Purchasing, Sales & Architecture Decision Records (ADR)
- Buat `docs/domains/PURCHASING_DOMAIN_SPEC.md`
- Buat `docs/domains/SALES_DOMAIN_SPEC.md`
- Buat `docs/adr/0001-hierarchical-category-system.md`
- Buat `docs/adr/0002-notification-center-dynamic-synthesis.md`
- Update `docs/06_FRONTEND_POS_APOTEK.md`, `docs/07_BACKEND_POS_APOTEK.md`, dan `docs/12_TRACEABILITY_PRD_SRS_SDD_UI_TASK_POS_APOTEK.md`
