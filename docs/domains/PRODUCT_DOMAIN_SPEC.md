# Product Domain Specification — POS Apotek V2

## Document Metadata
- **Document Title:** Product Domain Specification — POS Apotek V2
- **Version:** 1.0.0
- **Date:** July 2026
- **Status:** Approved Architecture Specification
- **Target Audience:** Backend Developers, Frontend Developers, QA Engineers, System Architects

---

## 1. Overview & Business Purpose

Domain Produk dalam **POS Apotek V2** mengelola master data obat, suplemen, dan barang kesehatan yang dijual di apotek. Domain ini menjadi fondasi bagi seluruh proses operasional apotek, mulai dari katalogisasi produk, pengelompokan hierarki kategori, pengaturan satuan dasar dan satuan jual, hingga penentuan kebijakan presisi harga modal dan harga jual.

### Key Objectives
1. **Master Catalog & Standardization:** Memastikan setiap produk terdaftar secara unik dengan SKU/kode produk, nama (termasuk nama generik), kategori, bentuk sediaan (*dosage form*), dan pabrikan (*manufacturer*).
2. **Flexible Multi-Unit Management:** Memisahkan secara tegas antara **satuan dasar stok** (*base unit*) yang digunakan untuk pencatatan pergudangan, dengan **satuan jual aktif** (*active sales units*) yang memiliki faktor konversi presisi.
3. **Strict Price & Margin Separation:** Menerapkan prinsip **Presisi Harga Modal & HPP vs Selling Price**, di mana HPP/harga modal dihitung hingga presisi desimal tinggi (internal backend), sementara harga jual pelanggan ditentukan secara manual oleh Manager dalam Rupiah bulat.
4. **Role-Based Data Sanitization:** Menyembunyikan seluruh informasi harga modal, HPP, margin, dan laba dari peran **Kasir** dan **Apoteker**, serta memberikan kontrol penuh kepada **Manager**.
5. **High-Performance Caching:** Memanfaatkan Redis untuk caching master data yang *read-heavy* (seperti kategori dan satuan) untuk respon API ultra-cepat.

---

## 2. Master Product Data Model & Attributes

Tabel utama `products` menyimpan metadata produk tanpa menyimpan angka stok langsung (stok secara ketat dikelola di level batch pada domain Inventory).

### 2.1 Attribute Specifications

| Attribute Name | Database Field | Data Type | Nullable | Default | Description & Business Validation |
|---|---|---|:---:|---|---|
| **ID** | `id` | `UUID` | No | `uuid()` | Primary key unik produk. |
| **SKU / Product Code** | `code` | `VARCHAR(100)` | No | - | Kode unik produk (SKU). Terindeks unik untuk produk aktif. |
| **Product Name** | `name` | `VARCHAR(200)` | No | - | Nama dagang / merk obat (misal: "Sanmol 500mg Tablet"). |
| **Generic Name** | `generic_name` | `VARCHAR(200)` | Yes | `NULL` | Nama kandungan zat aktif (misal: "Paracetamol"). |
| **Category ID** | `category_id` | `UUID` | No | - | Foreign key ke tabel `categories`. |
| **Base Unit ID** | `base_unit_id` | `UUID` | No | - | Foreign key ke tabel `units` sebagai satuan terkecil penyimpan stok. |
| **Min Stock Base** | `min_stock_base` | `NUMERIC(14,3)` | No | `0` | Ambang batas stok minimum dalam satuan dasar untuk memicu alert stok tipis. |
| **Is Active** | `is_active` | `BOOLEAN` | No | `true` | Status keaktifan produk. Produk non-aktif tidak dapat ditransaksikan di kasir. |
| **Barcode** | `barcode` | `VARCHAR(150)` | Yes | `NULL` | Kode barcode EAN-13/UPC/QR. Terindeks unik jika diisi. |
| **Dosage Form** | `dosage_form` | `VARCHAR(100)` | Yes | `NULL` | Bentuk sediaan obat (contoh: Tablet, Sirup, Injeksi, Salep, Kapsul). |
| **Manufacturer** | `manufacturer` | `VARCHAR(150)` | Yes | `NULL` | Pabrik produsen obat (contoh: "PT Kalbe Farma", "PT Sanbe Farma"). |
| **Description** | `description` | `TEXT` | Yes | `NULL` | Deskripsi, aturan pakai, atau instruksi penyimpanan produk. |
| **Created At** | `created_at` | `TIMESTAMP` | No | `now()` | Waktu pembuatan record (UTC). |
| **Updated At** | `updated_at` | `TIMESTAMP` | No | `now()` | Waktu pembaruan record (UTC). |
| **Deleted At** | `deleted_at` | `TIMESTAMP` | Yes | `NULL` | Waktu soft delete. jika non-null, record dianggap dihapus. |

### 2.2 Database Indexes & Constraints
```sql
-- Unique index untuk SKU/Code pada produk yang belum dihapus (soft-delete safe)
CREATE UNIQUE INDEX uq_products_code_active 
ON products(code) 
WHERE deleted_at IS NULL;

-- Unique index untuk Barcode (hanya jika barcode terisi)
CREATE UNIQUE INDEX uq_products_barcode_active 
ON products(barcode) 
WHERE barcode IS NOT NULL AND deleted_at IS NULL;

-- Query performance indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_base_unit_id ON products(base_unit_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);
```

---

## 3. Hierarchical Category System

Apotek membutuhkan kategorisasi bertingkat untuk pengelompokan produk yang terstruktur (misalnya: *Obat Bebas -> Analgesik -> Paracetamol*).

### 3.1 Tree Structure & Rules
1. **Self-Referencing Parent ID:** Tabel `categories` memiliki relasi `parentId` (`parent_id`) yang menunjuk ke kategori induknya sendiri.
2. **Depth Limit (Kedalaman Maksimum 3):**
   - **Level 1 (Root):** Kategori Utama (misal: *Obat Resep*, *Obat Bebas*, *Alkes*).
   - **Level 2 (Sub-category):** Sub-Kategori (misal: *Analgesik & Antipiretik*, *Antibiotik*).
   - **Level 3 (Leaf):** Sub-Sub-Kategori spesifik (misal: *Paracetamol & Turunannya*).
   - *Validasi Backend:* Pembuatan atau pemindahan node kategori yang melebihi kedalaman 3 akan ditolak dengan HTTP `422 Unprocessable Entity` (`CATEGORY_DEPTH_EXCEEDED`).
3. **Sort Order (`sortOrder`):** Kolom `sort_order` (`INT`, default `0`) menentukan urutan penampilan kategori di UI.
4. **Cascade Rules:**
   - Kategori tidak boleh dihapus secara permanen jika masih memiliki produk aktif terikat (`CATEGORY_HAS_PRODUCTS`).
   - Jika kategori dihapus (*soft delete*), anak-anak kategorinya (*children*) wajib dinonaktifkan atau ditangani secara bertahap (*soft-delete cascade*).
   - Pencegahan *Circular Reference*: Suatu kategori tidak boleh dijadikan `parentId` untuk dirinya sendiri atau untuk leluhurnya (*ancestors*).

### 3.2 Category Caching Strategy (Redis)
Karena data kategori sangat sering dibaca (*read-heavy*) namun jarang berubah, backend mengimplementasikan caching Redis:
- **`categories:tree`**: Menyimpan representasi JSON lengkap berbentuk struktur pohon (*hierarchical tree array*).
- **`categories:flat`**: Menyimpan representasi JSON daftar kategori *flat* terurut untuk dropdown selector.
- **Cache Invalidation:** Setiap operasi mutasi kategori (`POST`, `PUT`, `PATCH`, `DELETE` pada `/api/categories`) secara otomatis menghapus key Redis `categories:tree` dan `categories:flat`.

---

## 4. Active Sales Units & Unit Conversion

Apotek sering membeli obat dalam kemasan besar (misal: Box/Dus) dan menjualnya dalam satuan eceran (misal: Strip atau Tablet/Biji).

### 4.1 Base Unit vs Active Sales Units
- **Base Unit (`base_unit_id`):** Satuan terkecil yang tidak dapat dipecah lagi (misal: *tablet*, *kapsul*, *ml*, *gram*). Seluruh perhitungan stok internal dan HPP disimpan dalam satuan dasar ini.
- **Active Sales Units (`product_units`):** Satuan yang diizinkan untuk dijual di Kasir.
  - Tabel `product_units` memetakan hubungan antara `product_id` dan `unit_id`.
  - Aturan Bisnis: Satuan dasar produk **tidak otomatis** menjadi satuan jual. Manager wajib menentukan secara manual satuan jual apa saja yang aktif (`is_sale_unit = true` dan `is_active = true`).

### 4.2 Unit Conversion Data Model (`product_units`)

| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | `UUID` | PK | ID unik konversi unit. |
| `product_id` | `UUID` | FK `products.id` | Produk terkait. |
| `unit_id` | `UUID` | FK `units.id` | Satuan jual (misal: Strip, Box). |
| `conversion_to_base` | `NUMERIC(14,3)` | CHECK `> 0` | Jumlah satuan dasar dalam 1 satuan jual ini (misal: 1 Strip = 10 Tablet, maka nilainya `10.000`). |
| `is_default_sale_unit` | `BOOLEAN` | Default `false` | Menandakan satuan jual default di kasir. |
| `is_sale_unit` | `BOOLEAN` | Default `true` | Menentukan apakah satuan ini aktif dipakai jual di kasir. |
| `is_active` | `BOOLEAN` | Default `true` | Status keaktifan relasi unit ini. |
| `min_sale_qty` | `NUMERIC(14,3)` | Default `1` | Minimal kuantitas jual untuk satuan ini. |

### 4.3 Contoh Formula Konversi
```text
Produk: Paracetamol 500mg
Base Unit: Tablet (conversion = 1.000)

Konversi Satuan Jual:
1. Strip  -> conversion_to_base = 10.000 (1 Strip = 10 Tablet)
2. Box    -> conversion_to_base = 100.000 (1 Box = 100 Tablet)

Formula Konversi Qty Jual ke Qty Dasar:
Qty_Base = Qty_Sale_Unit * Conversion_To_Base
Contoh: Kasir menjual 2 Strip Paracetamol -> Qty_Base = 2 * 10.000 = 20.000 Tablet.
```

---

## 5. Presisi Harga Modal & HPP vs Selling Price

POS Apotek V2 membedakan secara mutlak antara harga internal (modal/HPP) dan harga eksternal (harga jual pelanggan).

### 5.1 Business & Architectural Rules
1. **High-Precision Cost & Internal HPP:**
   - Seluruh nilai harga beli (*buy price*), diskon supplier, PPN pembelian, dan HPP internal disimput dan dihitung menggunakan desimal presisi tinggi (`NUMERIC(18,8)` di database).
   - Hal ini mencegah akumulasi pembulatan rugi (*rounding drift*) saat terjadi pemecahan satuan dari Box ke Strip/Tablet.
2. **Manual Manager-Set Selling Price (Rounded Rupiah):**
   - **Harga Jual TIDAK DIHITUNG OTOMATIS** dari harga modal atau margin mark-up otomatis.
   - Manager menentukan secara manual harga jual final untuk setiap satuan jual pada tabel `batch_unit_prices` dalam **Rupiah bulat** (`NUMERIC(18,0)`).
   - Kasir hanya menerima harga jual final snapshot yang sudah ditetapkan Manager.
3. **No Automatic Repricing:**
   - Perubahan harga modal pada pembelian baru tidak boleh secara otomatis mengubah harga jual produk atau batch yang sudah ada, kecuali Manager memperbaruinya secara manual.

---

## 6. Role & Security Access Rules for Product Data

Keamanan dan privasi data keuangan apotek dijaga ketat di backend melalui **Role-Based Access Control (RBAC)** dan **Data Sanitization Response Interceptor**.

### 6.1 Matrix Peran & Hak Akses Data Produk

| Fitur / Data | Manager | Apoteker | Kasir | Pemilik |
|---|:---:|:---:|:---:|:---:|
| Lihat Katalog Produk & Satuan Jual | ✅ | ✅ | ✅ | ✅ |
| Lihat Harga Jual Kasir | ✅ | ✅ | ✅ | ✅ |
| Lihat Harga Beli / Harga Modal | ✅ | ❌ (Di-sanitize) | ❌ (Di-sanitize) | ✅ |
| Lihat HPP Internal & Margin Profit | ✅ | ❌ (Di-sanitize) | ❌ (Di-sanitize) | ✅ |
| Tambah / Edit / Nonaktifkan Produk | ✅ | ❌ | ❌ | ❌ |
| Kelola Kategori & Satuan | ✅ | ❌ | ❌ | ❌ |
| Ubah Harga Jual (`batch_unit_prices`) | ✅ | ❌ | ❌ | ❌ |

### 6.2 Backend Data Sanitization Rules
- Ketika endpoint API produk dipanggil oleh user dengan role `KASIR` atau `APOTEKER`:
  - Field `buyPrice`, `buyPriceBase`, `hppBase`, `margin`, `profit`, `supplierId` wajib **dihapus/dinullkan** dari payload JSON respon HTTP oleh Interceptor/Serializer backend NestJS.
  - Kasir dan Apoteker yang mencoba mengakses endpoint manajemen produk (misal: `POST /api/products`) akan menerima respon `403 Forbidden`.

---

## 7. API Endpoints & Interfaces

Seluruh endpoint backend menggunakan prefix `/api` dan standar RESTful JSON `camelCase`.

### 7.1 Product Management Endpoints

#### `GET /api/products`
- **Access:** `MANAGER`, `PEMILIK`, `APOTEKER`, `KASIR` (dengan data sanitization).
- **Query Params:** `page`, `limit`, `search`, `categoryId`, `isActive`, `sortBy`, `sortOrder`.
- **Response `200 OK` (Manager View):**
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "c39a8f21-7b3e-4f1a-b6d8-912e4fbc5101",
      "code": "PRD-PCT-500",
      "barcode": "8999901234567",
      "name": "Paracetamol 500mg Tablet",
      "genericName": "Paracetamol",
      "categoryId": "d12f4e56-1234-4a5b-bcde-111122223333",
      "categoryName": "Analgesik & Antipiretik",
      "baseUnitId": "u1111111-2222-3333-4444-555555555555",
      "baseUnitName": "tablet",
      "minStockBase": 100.0,
      "dosageForm": "Tablet",
      "manufacturer": "PT Kalbe Farma",
      "isActive": true,
      "salesUnits": [
        {
          "productUnitId": "pu-101",
          "unitId": "u-strip",
          "unitName": "strip",
          "conversionToBase": 10.0,
          "isDefaultSaleUnit": true,
          "isSaleUnit": true
        }
      ]
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### `POST /api/products`
- **Access:** `MANAGER` only.
- **Request Body:**
```json
{
  "code": "PRD-PCT-500",
  "barcode": "8999901234567",
  "name": "Paracetamol 500mg Tablet",
  "genericName": "Paracetamol",
  "categoryId": "d12f4e56-1234-4a5b-bcde-111122223333",
  "baseUnitId": "u1111111-2222-3333-4444-555555555555",
  "minStockBase": 100.0,
  "dosageForm": "Tablet",
  "manufacturer": "PT Kalbe Farma",
  "description": "Obat penurun panas dan pereda nyeri",
  "salesUnits": [
    {
      "unitId": "u-strip",
      "conversionToBase": 10.0,
      "isDefaultSaleUnit": true,
      "isSaleUnit": true
    }
  ]
}
```

#### `GET /api/products/:id`
- **Access:** `MANAGER`, `PEMILIK`, `APOTEKER`, `KASIR`.

#### `PUT /api/products/:id`
- **Access:** `MANAGER` only.

#### `DELETE /api/products/:id`
- **Access:** `MANAGER` only (Soft delete).

---

### 7.2 Category Endpoints

#### `GET /api/categories/tree`
- **Access:** `MANAGER`, `APOTEKER`, `KASIR`, `PEMILIK`.
- **Description:** Mengembalikan hierarki kategori bertingkat (cached di Redis `categories:tree`).
- **Response `200 OK`:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "cat-root-1",
      "name": "Obat Bebas",
      "sortOrder": 1,
      "depth": 1,
      "children": [
        {
          "id": "cat-sub-1",
          "name": "Analgesik & Antipiretik",
          "parentId": "cat-root-1",
          "sortOrder": 1,
          "depth": 2,
          "children": []
        }
      ]
    }
  ]
}
```

#### `GET /api/categories/flat`
- **Access:** `MANAGER`, `APOTEKER`, `KASIR`, `PEMILIK`.
- **Description:** Mengembalikan daftar kategori flat terurut (cached di Redis `categories:flat`).

#### `POST /api/categories`
- **Access:** `MANAGER` only. Validasi kedalaman max 3 (`CATEGORY_DEPTH_EXCEEDED`). Invalidates Redis cache.

#### `PUT /api/categories/:id`
- **Access:** `MANAGER` only. Invalidates Redis cache.

#### `DELETE /api/categories/:id`
- **Access:** `MANAGER` only. Ditolak jika masih ada produk aktif (`CATEGORY_HAS_PRODUCTS`). Invalidates Redis cache.

---

### 7.3 Unit Endpoints

#### `GET /api/units`
- **Access:** `MANAGER`, `APOTEKER`, `KASIR`, `PEMILIK`.
- **Description:** Mengambil master list satuan (misal: tablet, kapsul, strip, box, botol, tube, pcs).

#### `POST /api/units`
- **Access:** `MANAGER` only. Membuat unit master baru.

---

## 8. Data Integrity & Verification Checklist
- [x] Schema Prisma & Migration script menggunakan `snake_case` untuk database dan `camelCase` untuk JSON API.
- [x] Constraint unik SKU dan Barcode aman dari soft-deleted records (`WHERE deleted_at IS NULL`).
- [x] Redis Cache automatic invalidation pada operasi mutasi kategori & produk.
- [x] HPP dan harga modal diisolasi penuh dari peranan Kasir.
