# Deployment POS Apotek

Panduan ini menyiapkan deployment terpisah:

- Frontend React + Vite di Vercel.
- Backend NestJS API di Railway.
- PostgreSQL production memakai Railway PostgreSQL.

Backend tetap menjadi sumber kebenaran transaksi, stok, batch, FEFO, HPP, laba, retur, mutasi stok, auth, dan RBAC. Frontend hanya memanggil API backend melalui `VITE_API_BASE_URL`.

## Frontend Vercel

1. Buat project Vercel dari repository ini.
2. Set **Root Directory** ke `frontend`.
3. Gunakan command default Vite:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Set environment variable:

```env
VITE_API_BASE_URL=https://URL-BACKEND-RAILWAY.up.railway.app/api
VITE_APP_TIMEZONE=Asia/Makassar
```

5. Pastikan `frontend/vercel.json` berisi rewrite SPA ke `index.html`, sehingga refresh route seperti `/login`, `/dashboard`, `/kasir`, dan `/pembelian` tidak menghasilkan 404.

Catatan: root `vercel.json` juga dibuat frontend-only sebagai fallback jika project Vercel memakai root repository. Tidak ada Vercel Functions untuk backend.

## Backend Railway

1. Buat service Railway dari folder `backend`.
2. Tambahkan Railway PostgreSQL dan gunakan `DATABASE_URL` dari service PostgreSQL Railway.
3. Set build/start:
   - Build command: `npm run build`
   - Start command: `npm run prisma:migrate:deploy && npm run start:prod`
4. Set healthcheck path Railway ke:

```text
/health
```

5. Endpoint healthcheck mengembalikan:

```json
{ "status": "ok" }
```

## Environment Backend Railway

```env
NODE_ENV=production
PORT=<diisi otomatis oleh Railway>
DATABASE_URL=<Railway PostgreSQL DATABASE_URL>
JWT_SECRET=<secret panjang dan acak>
JWT_REFRESH_SECRET=<secret panjang dan acak yang berbeda>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APP_TIMEZONE=Asia/Makassar
FRONTEND_URL=https://URL-FRONTEND-VERCEL.vercel.app
CORS_ORIGIN=https://URL-FRONTEND-VERCEL.vercel.app
EXPORT_DIR=storage/exports
```

`JWT_ACCESS_SECRET` masih didukung untuk kompatibilitas, tetapi production dapat memakai `JWT_SECRET` sebagai access token secret jika `JWT_ACCESS_SECRET` tidak diisi.

## Prisma Migration Production

Jalankan migration production dengan:

```bash
npx prisma migrate deploy
```

Di repository ini tersedia script:

```bash
npm run prisma:migrate:deploy
```

Jangan memakai `prisma migrate dev` untuk production. Prisma Client digenerate saat `npm run build` melalui `prisma generate`.

## CORS

Backend membaca origin dari `CORS_ORIGIN`. Untuk satu frontend Vercel:

```env
CORS_ORIGIN=https://URL-FRONTEND-VERCEL.vercel.app
```

Untuk beberapa origin, pisahkan dengan koma:

```env
CORS_ORIGIN=https://app.example.com,https://preview.example.com
```

Pastikan nilai `VITE_API_BASE_URL` di Vercel mengarah ke backend Railway dengan suffix `/api`.

## Verifikasi Setelah Deploy

1. Cek backend:

```bash
curl https://URL-BACKEND-RAILWAY.up.railway.app/health
```

2. Cek frontend dapat login dan memanggil API Railway.
3. Smoke test minimal:
   - Login Manager.
   - Buka dashboard.
   - Buka pembelian.
   - Buka kasir.
   - Pastikan Kasir tetap ditolak dari laporan laba.

## Risiko Deployment

- Jangan commit `.env` atau secret ke GitHub.
- Jangan reset database production tanpa instruksi eksplisit dan backup.
- Backup database production sebelum migration besar.
- `DATABASE_URL` production harus berasal dari Railway PostgreSQL, bukan SQLite atau database lokal.
- Jika CORS salah, frontend Vercel akan gagal memanggil API Railway meskipun backend hidup.
- Jika `VITE_API_BASE_URL` tidak memakai `/api`, request frontend akan salah endpoint.
- File export pada Railway filesystem bisa bersifat ephemeral; laporan sebaiknya dapat dibuat ulang dari database.
- Jangan memindahkan logic backend ke frontend hanya untuk menyelesaikan masalah deployment.
