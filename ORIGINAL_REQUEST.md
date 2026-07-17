# Original User Request

## Initial Request — 2026-07-10T10:55:25+08:00

Implementasi Rantai Satuan (Chained Units) pada Produk untuk mengotomasi konversi satuan bertingkat (misal: Box -> Strip -> Tablet) dan menjamin akurasi perhitungan HPP (Harga Pokok Penjualan) serta laba kotor di apotek Risyah.

Working directory: d:\pos_apotek_risyah
Integrity mode: development

## Requirements

### R1. Database Schema Update (Chained Units)
Ubah skema database pada model `ProductUnit` di [schema.prisma](file:///d:/pos_apotek_risyah/backend/prisma/schema.prisma):
- Tambahkan field `parentProductUnitId` (Uuid, opsional) sebagai relasi mandiri (self-relation) ke `ProductUnit.id` untuk merujuk ke satuan induk.
- Tambahkan field `multiplier` (Decimal, 18, 4) untuk menyimpan pengali relatif terhadap satuan induk.
- Lakukan regenerasi Prisma Client dan buat berkas migrasi database PostgreSQL.

### R2. Logika Hitung Konversi Otomatis di Backend
Perbarui service produk saat penciptaan atau pengubahan satuan produk (`ProductUnit`):
- Jika `parentProductUnitId` dan `multiplier` ditentukan, sistem harus menghitung `conversionToBase` secara dinamis dengan melacak rantai satuan secara rekursif hingga mencapai satuan dasar (base unit).
- Contoh: Jika Tablet adalah base unit (conversion = 1), Strip berinduk Tablet (multiplier = 10), dan Box berinduk Strip (multiplier = 10), maka Box otomatis mendapatkan `conversionToBase = 10 * 10 = 100`.
- Tambahkan validasi untuk mencegah dependensi melingkar (*circular dependency*) pada rantai satuan.

### R3. Pembaruan API DTO & Controller
- Perbarui `CreateProductUnitDto` dan `UpdateProductUnitDto` untuk menerima parameter `parentProductUnitId` and `multiplier`.
- Pastikan endpoint pengontrol master data mengizinkan parameter baru ini dan mengembalikannya pada respons detail produk.

### R4. Antarmuka Pengguna (Frontend UI)
Perbarui form manajemen satuan produk di halaman [MasterDataPages.tsx](file:///d:/pos_apotek_risyah/frontend/src/features/master-data/MasterDataPages.tsx):
- Saat menambah/mengedit satuan produk, tampilkan pilihan dropdown "Satuan Induk" yang berisi daftar satuan produk tersebut yang sudah didaftarkan sebelumnya.
- Tampilkan input field "Kuantitas Pengali" (multiplier, misal: isi 10).
- Secara otomatis tampilkan preview teks penjelasan konversi (misal: "1 Box = 10 Strip (setara dengan 100 Tablet)") agar pengguna tidak salah menginput data.

## Acceptance Criteria

### Unit Chain Integrity
- [ ] Berhasil membuat produk baru dengan satuan bertingkat: Tablet (dasar), Strip (induk: Tablet, pengali: 10), dan Box (induk: Strip, pengali: 10).
- [ ] Database mencatat `conversionToBase` dari Box bernilai `100.0000` secara otomatis di tabel `product_units`.
- [ ] Mencegah penyimpanan satuan jika terjadi circular dependency (misal: Tablet berinduk ke Box, Box berinduk ke Tablet) dan melempar error `400 Bad Request`.

### HPP Accuracy
- [ ] Transaksi pembelian 1 Box obat seharga Rp100.000 mencatat `hppBase` di database sebesar Rp1.000 (100 tablet).
- [ ] Transaksi penjualan kasir untuk 1 Strip obat dengan harga jual Rp15.000 mencatat snapshot HPP pada `SaleBatchAllocation` sebesar Rp10.000 (10 tablet x Rp1.000) dan laba kotor Rp5.000.

### Test Compliance
- [ ] Menambahkan integration test baru yang memvalidasi rantai satuan di `master-data.integration.spec.ts`.
- [ ] Seluruh 19 test suites Jest backend lulus 100% tanpa regresi.
