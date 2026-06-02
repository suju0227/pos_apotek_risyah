# POS Apotek Risyah

POS Apotek Risyah adalah aplikasi point of sale internal untuk operasional apotek. Repository ini mengikuti dokumen kebutuhan di folder `docs` dan dikerjakan bertahap sesuai `05_TASK_BREAKDOWN_POS_APOTEK.md`.

## Status

Phase 1 - Database Foundation.

Repository sudah memiliki struktur awal dan fondasi database PostgreSQL + Prisma. Belum ada frontend, endpoint API, atau UI kasir.

## Struktur Folder

```text
pos_apotek_risyah/
+-- backend/
|   +-- prisma/
|       +-- migrations/
|       +-- schema.prisma
|       +-- seed.js
+-- database/
+-- docs/
+-- frontend/
+-- tests/
```

## Stack Target V1

- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: NestJS, TypeScript, Prisma.
- Database: PostgreSQL.
- Testing: Jest/Vitest, Supertest, dan E2E sesuai fase implementasi.

## Environment

Salin `.env.example` menjadi `.env` saat development lokal, lalu sesuaikan nilainya.

```powershell
Copy-Item .env.example .env
Copy-Item .env.example backend/.env
```

Catatan:

- `.env` tidak boleh masuk version control.
- Timestamp database disimpan dalam UTC.
- Timezone aplikasi menggunakan `Asia/Makassar`.

## Menjalankan Lokal

Phase 1 hanya menyediakan tooling database. Jalankan perintah dari folder `backend`.

```powershell
cd backend
npm.cmd install
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
```

Seed awal membuat role `KASIR` dan `MANAGER`, satuan dasar, serta user manager awal:

```text
username: manager
password: ChangeMe123!
```

Ganti password awal saat modul auth/user sudah tersedia.
