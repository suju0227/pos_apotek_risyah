# POS Apotek Risyah

POS Apotek Risyah adalah aplikasi point of sale internal untuk operasional apotek. Target deployment utama V1 saat ini adalah **Local Network Server / LAN Deployment**: satu laptop/PC menjadi server lokal, lalu perangkat kasir/manager lain mengakses aplikasi melalui browser pada jaringan Wi-Fi/LAN yang sama.

Cloud deployment seperti Vercel/Railway tidak menjadi target utama V1. Konfigurasi cloud yang masih ada diperlakukan sebagai `future-cloud-deployment` dan tidak boleh menjadi default aktif.

Mode operasional utama adalah **Docker Full Local Mode**. PC server tidak wajib menginstal Node.js, npm, atau PostgreSQL langsung di host; runtime tersebut berjalan di container Docker.

## Arsitektur LAN

```text
Laptop/PC Server Lokal
+-- PostgreSQL database pusat
+-- Backend NestJS API
+-- Frontend React build
+-- Nginx static server + proxy /api

Client Kasir / Manager
+-- Browser membuka http://IP_SERVER
```

Contoh:

```text
Server lokal:
IP: 192.168.1.10

Client kasir membuka:
http://192.168.1.10

Backend API:
http://192.168.1.10/api
```

Backend tetap menjadi sumber kebenaran final untuk stok, batch, FEFO, HPP, laba, diskon alokasi, retur, dan mutasi stok. Frontend hanya menghitung estimasi tampilan dan tidak menyimpan transaksi final di localStorage.

## Struktur Folder

```text
pos_apotek_risyah/
+-- backend/
+-- database/
+-- docs/
+-- frontend/
+-- tests/
+-- docker-compose.local.yml
+-- scripts/
```

## Environment

Salin file contoh environment. Untuk local production, frontend memakai same-origin `/api` melalui Nginx sehingga `VITE_API_BASE_URL` tidak perlu diubah ketika IP server berubah.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Backend penting:

```env
APP_HOST=0.0.0.0
APP_PORT=3000
APP_TIMEZONE=Asia/Makassar
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pos_apotek?schema=public
CORS_ORIGIN=http://localhost,http://127.0.0.1,http://localhost:5173,http://192.168.1.10,http://192.168.1.10:5173
```

Frontend penting:

```env
VITE_API_BASE_URL=/api
VITE_APP_TIMEZONE=Asia/Makassar
```

Untuk local production melalui Nginx, gunakan `VITE_API_BASE_URL=/api`. Untuk development langsung ke backend, gunakan `http://localhost:3000/api`. Untuk akses langsung backend dari LAN tanpa Nginx, gunakan `http://IP_SERVER:3000/api`. `192.168.1.10` hanya contoh dokumentasi, bukan nilai source code.

## Mengetahui IP Server Lokal

Di Windows server lokal, jalankan:

```powershell
ipconfig
```

Cari bagian Wi-Fi atau Ethernet:

```text
IPv4 Address . . . . . . . . . . : 192.168.1.10
```

Untuk operasional harian, gunakan DHCP reservation di router atau IP statis yang stabil. Jika IP berubah, client hanya perlu membuka URL server yang baru, misalnya `http://IP_SERVER`. Local production tetap memakai `VITE_API_BASE_URL=/api` karena request API diproxy oleh Nginx pada origin yang sama.

## Local Production Dengan Docker Compose

Prasyarat host:

- Docker Desktop aktif.
- WSL 2 aktif jika memakai Windows.
- Browser untuk membuka aplikasi.
- Node.js tidak wajib untuk menjalankan local production.

Dari root repository:

```powershell
docker compose up -d --build
```

Perintah eksplisit yang sama:

```powershell
docker compose -f docker-compose.local.yml up -d --build
```

Atau gunakan script Windows:

```powershell
scripts\start-local.bat
```

Service yang berjalan:

- Frontend Nginx + proxy `/api`: `http://localhost`
- Backend API internal: `backend:3000`
- PostgreSQL internal: `postgres:5432`

Backend dan PostgreSQL tidak diekspos langsung ke LAN pada local production. Client kasir/manager cukup mengakses frontend pada port 80, lalu frontend memanggil API melalui `/api`.

Client dalam LAN membuka:

```text
http://IP_SERVER
```

Cek health API:

```powershell
Invoke-RestMethod http://localhost/api/health
```

Melihat log:

```powershell
docker compose -f docker-compose.local.yml logs -f
```

Mematikan service:

```powershell
docker compose -f docker-compose.local.yml down
```

Atau:

```powershell
scripts\stop-local.bat
```

Log backend:

```powershell
scripts\logs-backend.bat
```

Migration dan seed dari container backend:

```powershell
docker compose -f docker-compose.local.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.local.yml exec backend npx prisma db seed
```

Catatan: container backend juga menjalankan migration deploy dan seed saat start. Perintah manual di atas berguna untuk verifikasi atau maintenance.

PgAdmin opsional:

```powershell
docker compose -f docker-compose.local.yml --profile tools up -d pgadmin
```

Akses dari server:

```text
http://localhost:5050
```

## Menjalankan Manual Saat Development

Database saja:

```powershell
docker compose -f database/docker-compose.yml up -d
```

Backend:

```powershell
cd backend
npm.cmd install
npm.cmd run db:validate
npm.cmd run db:deploy
npm.cmd run db:generate
npm.cmd run db:seed
npm.cmd run start:dev
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev:lan
```

Development mode boleh memakai Vite dev server dan hot reload. Local production untuk operasional kasir memakai Docker Compose, frontend static build, dan Nginx reverse proxy.

Mode preview build:

```powershell
cd frontend
npm.cmd run build
npm.cmd run preview:lan
```

## Firewall Windows

Izinkan port berikut pada PC server lokal:

| Port | Fungsi |
|---:|---|
| 80 | Aplikasi web via Nginx local production |
| 3000 | Backend API jika tanpa reverse proxy |
| 5173 | Frontend Vite dev LAN, hanya development |
| 4173 | Frontend preview build LAN |
| 5432 | PostgreSQL, hanya untuk server/admin dan tidak perlu dibuka ke client kasir |

Client kasir/manager cukup mengakses port 80 pada local production. Jangan beri akses langsung PostgreSQL ke perangkat kasir.

## Backup Database

Buat folder backup:

```powershell
New-Item -ItemType Directory -Force backups
New-Item -ItemType Directory -Force backups\daily
New-Item -ItemType Directory -Force backups\weekly
New-Item -ItemType Directory -Force backups\monthly
```

Backup PostgreSQL dari Docker:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
docker exec -t pos_apotek_postgres pg_dump -U postgres pos_apotek > "backups/pos_apotek_$timestamp.sql"
```

Atau gunakan script:

```powershell
scripts\backup-db.bat
```

Restore ke database Docker:

```powershell
Get-Content backups/pos_apotek_YYYYMMDD_HHMMSS.sql | docker exec -i pos_apotek_postgres psql -U postgres -d pos_apotek
```

Atau gunakan script:

```powershell
scripts\restore-db.bat backups\pos_apotek_YYYYMMDD_HHMMSS.sql
```

Backup minimal harian, mingguan, bulanan, sebelum update aplikasi, dan simpan salinan di media eksternal atau cloud storage. Volume Docker bukan backup. Jangan hanya menyimpan satu backup di laptop server yang sama.

## Checklist Manual LAN

- Server dapat membuka `http://localhost`.
- Client dapat membuka `http://IP_SERVER`.
- Client dapat login.
- Client dapat memanggil `http://IP_SERVER/api/health`.
- Indikator koneksi menampilkan server terhubung.
- Jika backend dimatikan, frontend menampilkan pesan server lokal tidak terhubung.
- Dua client kasir tidak dapat membuat stok batch negatif.
- Retry checkout/pembelian/retur/koreksi stok memakai idempotency key.

## Future Cloud Deployment

Vercel/Railway dapat dipertimbangkan sebagai opsi masa depan, tetapi bukan target utama V1. Jangan memakai URL Vercel/Railway sebagai default environment dan jangan mengunci source code ke provider cloud tertentu.
