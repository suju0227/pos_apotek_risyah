# POS Apotek Risyah

POS Apotek Risyah adalah aplikasi point of sale internal untuk operasional apotek. Repository ini mengikuti dokumen kebutuhan di folder `docs` dan dikerjakan bertahap sesuai `docs/05_TASK_BREAKDOWN_POS_APOTEK.md`.

## Status Aktual

Audit verifikasi terakhir: 2026-06-06.

- Backend sudah memiliki modul utama untuk auth/RBAC, master data, batch, purchase order, pembelian, stok/mutasi, sales FEFO, idempotency, resep, konseling, retur, dashboard, laporan, export, dan user management.
- Verifikasi backend lulus: `18` test suite, `78` test.
- Frontend build lulus dan sudah memiliki login, app shell, kasir, master data, batch, pemesanan/PO, dashboard, laporan penjualan, dan laporan laba.
- Banyak route frontend operasional masih placeholder, termasuk pembelian, stok, retur, users, settings, dan export.
- Audit log dan settings belum terlihat sebagai implementasi lengkap, sehingga belum dinyatakan selesai.

## Struktur Folder

```text
pos_apotek_risyah/
+-- backend/
|   +-- prisma/
|   +-- src/
+-- database/
+-- docs/
+-- frontend/
|   +-- src/
+-- tests/
```

## Stack Target V1

- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Recharts.
- Backend: NestJS, TypeScript, Prisma.
- Database: PostgreSQL.
- Testing: Jest, Supertest, dan E2E sesuai fase implementasi.

## Environment

Salin `.env.example` menjadi `.env` saat development lokal, lalu sesuaikan nilainya.

```powershell
Copy-Item .env.example .env
Copy-Item .env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Catatan:

- `.env` tidak boleh masuk version control.
- Timestamp database disimpan dalam UTC.
- Timezone aplikasi menggunakan `Asia/Makassar`.
- Database development default memakai PostgreSQL di `127.0.0.1:55432`.

## Menjalankan Database Lokal

Pastikan Docker Desktop berjalan, lalu dari root repository:

```powershell
docker compose -f database/docker-compose.yml up -d
```

## Menjalankan Backend

Jalankan perintah dari folder `backend`.

```powershell
cd backend
npm.cmd install
npm.cmd run db:validate
npm.cmd run db:deploy
npm.cmd run db:generate
npm.cmd run db:seed
npm.cmd test -- --runInBand
```

Seed awal membuat role dan user development. Kredensial manager awal:

```text
username: manager
password: ChangeMe123!
```

## Menjalankan Frontend

Jalankan perintah dari folder `frontend`.

```powershell
cd frontend
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

## Deployment

Deployment production dipisah:

- Frontend: Vercel dari folder `frontend`.
- Backend: Railway dari folder `backend`.
- Database: PostgreSQL service di Railway.

Panduan lengkap environment variable, CORS, Prisma migration production, dan healthcheck ada di [DEPLOYMENT.md](DEPLOYMENT.md).

## Hasil Verifikasi Terakhir

```text
Backend:
npm.cmd run db:validate  -> passed
npm.cmd run db:deploy    -> passed, no pending migrations
npm.cmd run db:generate  -> passed
npm.cmd run db:seed      -> passed
npm.cmd test -- --runInBand -> 18 passed, 78 tests passed
API smoke test -> passed: manager login/dashboard/reports, temporary cashier blocked from profit report

Frontend:
npm.cmd run build -> passed
```

## Langkah Berikutnya

1. Implementasikan UI frontend yang masih placeholder sesuai route Bahasa Indonesia di dokumen proyek.
2. Tambahkan audit log service/model jika tetap menjadi requirement V1.
3. Tambahkan settings/profile apotek bila tetap menjadi requirement V1.
4. Jalankan manual smoke test end-to-end: login manager, master data, pembelian, kasir, retur, dashboard, laporan, export, dan akses role kasir.
