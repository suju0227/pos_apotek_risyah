# AGENTS.md - POS Apotek V2

## 1. Project Identity
Nama proyek: POS Apotek V2  
Jenis aplikasi: Web-based Point of Sale untuk apotek  
Target utama: transaksi kasir, stok batch, pembelian, retur, dashboard, laporan penjualan, dan laporan laba.

## 2. Required Reading Order
Sebelum mengubah kode, baca dokumen berikut secara berurutan:

1. docs/01_PRD_POS_APOTEK.md
2. docs/02_SRS_POS_APOTEK.md
3. docs/03_SDD_SYSTEM_DESIGN_POS_APOTEK.md
4. docs/06_FRONTEND_POS_APOTEK.md
5. docs/07_BACKEND_POS_APOTEK.md
6. docs/04_UI_UX_FLOW_POS_APOTEK.md
7. docs/05_TASK_BREAKDOWN_POS_APOTEK.md

Jika terjadi konflik:
1. PRD dan SRS mengatur kebutuhan bisnis dan perilaku sistem.
2. SDD mengatur desain teknis final.
3. Backend document mengatur implementasi backend.
4. Frontend document mengatur implementasi frontend.
5. UI/UX Flow dan Task Breakdown mengatur alur dan urutan kerja.

## 3. Final Tech Stack

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Recharts

Backend:
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Raw SQL untuk query stok kritis
- JWT + Refresh Token
- Role-Based Access Control

Deployment:
- Docker
- PostgreSQL container
- Environment variable berbasis .env

## 4. Core Architecture Rules

- Backend adalah sumber kebenaran untuk stok, batch, FEFO, harga final, HPP, laba, diskon alokasi, retur, dan mutasi stok.
- Frontend hanya boleh menghitung estimasi subtotal, diskon, total, kembalian, dan tampilan stok sementara.
- Semua transaksi yang mengubah stok wajib berjalan dalam database transaction.
- Stok wajib disimpan pada level batch dalam satuan dasar.
- Stok batch tidak boleh negatif.
- FEFO wajib dilakukan di backend.
- Split batch wajib disimpan pada detail transaksi.
- Laporan laba wajib berdasarkan detail transaksi historis, bukan harga produk terbaru.

## 5. Role and Security Rules

Role minimum V1:
- KASIR
- MANAGER

Kasir tidak boleh:
- melihat HPP;
- melihat laba;
- melihat margin;
- melihat harga beli;
- mengubah harga jual;
- mengakses pembelian supplier;
- melakukan koreksi stok;
- membuka laporan laba;
- mengakses endpoint Manager melalui URL langsung.

Frontend boleh menyembunyikan menu berdasarkan role, tetapi backend tetap wajib melakukan authorization.

## 6. Business Rules That Must Not Be Violated

- Jangan membuat transaksi tanpa batch.
- Jangan membuat transaksi tanpa mutasi stok.
- Jangan mengurangi stok dari frontend.
- Jangan menghapus permanen transaksi final.
- Jangan menghapus permanen batch yang memiliki histori.
- Jangan mengubah histori transaksi lama ketika harga produk berubah.
- Jangan memakai batch expired untuk transaksi normal.
- Jangan membuat retur tanpa referensi transaksi atau pembelian asal.
- Jangan membuat fitur BPJS, payment gateway otomatis, multi-cabang, loyalty program, atau akuntansi penuh pada V1.

## 7. Timezone Rules

- Database menyimpan timestamp dalam UTC.
- Tampilan waktu menggunakan Asia/Makassar.
- Waktu transaksi final berasal dari backend.
- Jam realtime frontend hanya informasi visual.
- Gunakan APP_TIMEZONE=Asia/Makassar pada backend.

## 8. Route and API Rules

Frontend route menggunakan Bahasa Indonesia:
- /login
- /dashboard
- /kasir
- /riwayat-transaksi
- /retur-penjualan
- /produk
- /kategori
- /supplier
- /satuan
- /batch
- /pembelian
- /stok
- /mutasi-stok
- /laporan/penjualan
- /laporan/laba
- /users
- /settings

Backend endpoint menggunakan Bahasa Inggris teknis dengan prefix /api:
- POST /api/auth/login
- POST /api/sales
- GET /api/sales
- GET /api/products
- GET /api/reports/sales
- GET /api/reports/profit

Jangan mencampur route frontend dan endpoint backend.

## 9. Implementation Workflow

Ikuti urutan implementasi dari Task Breakdown:
1. Setup project
2. Database foundation
3. Auth, RBAC, user, security
4. Master data
5. Batch dan pembelian
6. Stok dan mutasi
7. Kasir dan transaksi
8. Diskon dan pembayaran
9. Retur
10. Dashboard dan laporan
11. Export
12. User, settings, responsive polish
13. Testing
14. Deployment
15. Final review

Jangan melompat langsung ke UI kasir sebelum database, auth, batch, stok, dan service transaksi siap.

## 10. Testing Rules

Wajib uji:
- login dan role;
- proteksi endpoint;
- produk dan satuan;
- batch dan pembelian;
- FEFO;
- split batch;
- transaksi kasir;
- stok tidak negatif;
- retur penjualan;
- laporan laba;
- idempotency checkout;
- role sanitization agar kasir tidak menerima HPP/laba.

## 11. Coding Behavior

- Ikuti struktur folder frontend dan backend yang sudah didefinisikan.
- Jangan mengganti stack tanpa alasan kuat dan pembaruan dokumen.
- Jangan membuat dependency baru tanpa kebutuhan jelas.
- Jangan menulis secret ke repository.
- Jangan mengubah scope V1 tanpa memperbarui dokumen terkait.
- Jika requirement belum jelas, cari di PRD, SRS, SDD, Frontend, Backend, UI/UX, dan Task Breakdown terlebih dahulu.