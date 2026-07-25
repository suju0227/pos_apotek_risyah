# Panduan Kustomisasi Template Surat Pesanan (PO)

Aplikasi POS Apotek V2 memberikan kebebasan bagi Manager untuk mengubah desain Surat Pesanan (PO) yang akan dicetak dan diberikan kepada distributor (PBF).

## 📌 Cara Mengakses Pengaturan Template

1. Login menggunakan akun dengan role **MANAGER**.
2. Pada Sidebar menu di sebelah kiri, pilih menu **Admin > Settings**.
3. Gulir ke bagian paling bawah ke bagian **Template Dokumen**.
4. Anda akan melihat sebuah area teks (textarea) berisi kode HTML. Di sinilah Anda dapat memodifikasi desain dan konten surat pesanan.
5. Setelah selesai mengubah, klik tombol **Simpan Pengaturan** di bagian bawah form.

---

## 🔧 Variabel Otomatis (Placeholder)

Sistem akan otomatis mengganti teks variabel (diapit kurung kurawal ganda `{{ }}`) dengan data transaksi nyata dari *database* saat surat dicetak. Anda dapat menempatkan variabel ini di mana saja di dalam HTML:

| Variabel | Keterangan | Contoh Output |
| :--- | :--- | :--- |
| `{{pharmacyName}}` | Nama Apotek (Diambil dari pengaturan) | Apotek Sehat Selalu |
| `{{pharmacyAddress}}`| Alamat Apotek (Diambil dari pengaturan) | Jl. Mawar No. 123, Kota X |
| `{{pharmacyPhone}}` | No. Telepon Apotek (Diambil dari pengaturan)| 08123456789 |
| `{{poNumber}}` | Nomor Dokumen Surat Pesanan (Otomatis) | PO-20260708-0001 |
| `{{supplierName}}` | Nama PBF / Distributor / Supplier | PT. Anugerah Pharmindo Lestari |
| `{{orderDate}}` | Tanggal Pemesanan | 08 Jul 2026 |
| `{{itemsTable}}` | Tabel berisi rincian barang yang dipesan (Tabel HTML baku) | *(Otomatis merender tabel baris)* |

---

## 📝 Contoh Praktis Penambahan SIPA & Nama Apoteker

Distributor PBF biasanya mewajibkan surat pesanan (SP) mencantumkan nama Apoteker Penanggung Jawab, Nomor SIPA, dan SIA. Mengingat data ini **jarang berubah**, Anda **cukup menuliskannya secara manual/statis** langsung di dalam *template* HTML.

### Contoh Template Lengkap Siap Pakai

Berikut adalah contoh modifikasi HTML yang menyertakan data izin apotek dan kolom tanda tangan ganda. Anda bisa menyalin kode di bawah ini lalu menempelkannya ke kotak **Template Dokumen** di halaman *Settings*:

```html
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #000; line-height: 1.5;">
  <!-- KOP SURAT -->
  <div style="border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 24px; text-transform: uppercase;">{{pharmacyName}}</h2>
    <p style="margin: 5px 0 0; font-size: 14px;">
      {{pharmacyAddress}}<br/>
      Telp: {{pharmacyPhone}}
    </p>
    <p style="margin: 5px 0 0; font-size: 12px; font-weight: bold;">
      SIA: 503/SIA-001/DPMPTSP/2023 | SIPA: 19900101/SIPA-002/2023
    </p>
  </div>

  <!-- JUDUL & DATA SUPPLIER -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h3 style="margin: 0; font-size: 18px; text-decoration: underline;">SURAT PESANAN OBAT</h3>
    <p style="margin: 5px 0 0; font-size: 14px;">No. SP: <b>{{poNumber}}</b></p>
  </div>

  <div style="margin-bottom: 20px;">
    <p style="margin: 0 0 5px;">Kepada Yth,</p>
    <p style="margin: 0 0 5px; font-weight: bold;">Pimpinan PBF {{supplierName}}</p>
    <p style="margin: 0;">Di Tempat</p>
  </div>

  <p>Harap dikirimkan barang-barang di bawah ini untuk keperluan Apotek kami:</p>

  <!-- TABEL RINCIAN BARANG -->
  <div style="margin: 20px 0;">
    {{itemsTable}}
  </div>

  <!-- TANDA TANGAN -->
  <div style="display: flex; justify-content: space-between; margin-top: 50px;">
    <div style="text-align: center; width: 250px;">
      <p style="margin-bottom: 60px;">Penerima / Pemesan,</p>
      <p style="margin: 0; font-weight: bold; text-decoration: underline;">( ..................................... )</p>
    </div>
    
    <div style="text-align: center; width: 250px;">
      <p style="margin: 0;">Kota Anda, {{orderDate}}</p>
      <p style="margin-bottom: 60px;">Apoteker Penanggung Jawab,</p>
      <p style="margin: 0; font-weight: bold; text-decoration: underline;">Risyah, S.Farm., Apt.</p>
      <p style="margin: 0; font-size: 12px;">SIPA: 19900101/SIPA-002/2023</p>
    </div>
  </div>
</div>
```

### Tips & Trik Tambahan:
- **Tabel Daftar Obat (`{{itemsTable}}`)**: Tabel ini sudah dibentuk secara otomatis oleh sistem menjadi tag `<table>` standar yang rapi. Anda tidak perlu membuat tag `<table>` sendiri untuk rincian barang.
- **Menguji Tampilan**: Setelah menempelkan kode ke menu Settings dan menyimpannya, masuk ke menu **Pemesanan**, lalu klik opsi **Print Preview** (ikon mata/cetak) pada salah satu transaksi untuk melihat hasil nyatanya.
