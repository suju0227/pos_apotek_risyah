# Panduan Integrasi Hardware Kasir - POS Apotek

Dokumen ini berisi panduan untuk mengonfigurasi dan menguji integrasi hardware kasir (Barcode Scanner dan Printer Thermal Struk) pada aplikasi POS Apotek V2.

---

## 1. Barcode Scanner

Hampir semua barcode scanner modern mendukung mode **USB HID Keyboard Emulation** secara default. Ini berarti barcode scanner akan bertindak sebagai keyboard eksternal yang mengetikkan karakter barcode dengan sangat cepat diikuti oleh karakter penutup (suffix).

### Konfigurasi Barcode Scanner:
1. **Suffix "Enter" (Wajib)**: 
   Pastikan barcode scanner dikonfigurasi untuk menambahkan suffix **Enter** (Carriage Return / `CR` / `\r` atau Line Feed / `LF` / `\n`) setelah memindai barcode.
   * *Cara:* Pindai barcode konfigurasi *"Add Enter Suffix"* yang ada pada manual book/lembar panduan bawaan dus barcode scanner Anda.
2. **Keyboard Layout**:
   Pastikan bahasa keyboard di OS Windows kasir disetel ke **English (US)** untuk menghindari kesalahan konversi karakter simbol/angka barcode.

### Verifikasi Alur Input Kasir:
1. Buka halaman Kasir (`/kasir`).
2. Klik kolom pencarian produk (pencarian utama).
3. Pindai barcode obat (misalnya barcode *Paracetamol* atau *Amoxicillin*).
4. Aplikasi harus secara otomatis mendeteksi input, melakukan pencarian, dan langsung memasukkan item tersebut ke dalam keranjang belanja tanpa perlu menekan tombol tombol keyboard lainnya.

---

## 2. Printer Thermal Struk (80mm & 58mm)

Struk kasir dioptimalkan menggunakan CSS khusus print (`@media print`) sehingga browser dapat mencetak struk secara bersih tanpa menampilkan komponen visual navigasi website (sidebar, button, header, dll.).

### Pengaturan Driver Printer di Windows:
1. Buka **Settings > Devices > Printers & Scanners** di Windows.
2. Pilih printer thermal Anda, klik **Manage > Printer Properties**.
3. Di tab **Device Settings** atau **Preferences**:
   * Set ukuran kertas default ke **Roll Paper 80mm x Receipt** atau **Roll Paper 58mm x Receipt** sesuai ukuran fisik kertas printer Anda.
   * Set margin minimum ke `0` atau `minimum` untuk mencegah text struk terpotong atau membungkuk ke baris baru.
4. Di tab **Advanced**:
   * Aktifkan fitur *Paper Cut* (jika printer mendukung auto-cutter) setelah dokumen selesai dicetak.

### CSS Print Rules dalam Aplikasi:
Aplikasi POS Apotek menggunakan rule CSS berikut untuk menjamin pencetakan struk bersih:
```css
@media print {
  /* Sembunyikan semua elemen layout web */
  body * {
    visibility: hidden;
  }
  /* Hanya tampilkan area struk kasir */
  #receipt-print-area, #receipt-print-area * {
    visibility: visible;
  }
  #receipt-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
  }
  /* Hilangkan header & footer cetakan browser default */
  @page {
    size: auto;
    margin: 0mm;
  }
}
```

### Verifikasi Pencetakan Struk:
1. Lakukan transaksi simulasi di halaman Kasir (`/kasir`).
2. Tekan tombol **Bayar & Cetak Struk** setelah pembayaran berhasil.
3. Jendela browser print dialog akan muncul:
   * **Destination**: Pilih nama printer thermal Anda.
   * **Margins**: Set ke **None** atau **Minimum**.
   * **Header and footers**: Hilangkan centang (wajib dinonaktifkan agar tanggal dan URL web browser tidak ikut tercetak di atas/bawah struk).
   * **Background graphics**: Centang (jika ada logo/warna shading ringan yang ingin ditampilkan).
4. Klik **Print** dan pastikan struk tercetak rapi tanpa ada teks yang terpotong di margin kanan.

---

## 3. Checklist Uji Coba Lapangan (UAT)

Jalankan checklist ini secara manual dengan hardware terhubung sebelum melepas aplikasi untuk operasional harian:

- [ ] Barcode scanner berhasil mendeteksi barcode 1D (EAN-13 / UPC) dengan cepat.
- [ ] Barcode scanner memicu pencarian dan otomatis input item ke keranjang kasir.
- [ ] Printer thermal berhasil mencetak struk kasir tanpa menampilkan menu navigasi sidebar aplikasi.
- [ ] Font struk terbaca dengan jelas (disarankan menggunakan font monospaced seperti Courier New).
- [ ] Tanggal dan waktu transaksi pada struk sesuai dengan zona waktu lokal (Asia/Makassar).
- [ ] Kertas terpotong rapi secara otomatis atau manual pada garis potong struk yang tepat.
