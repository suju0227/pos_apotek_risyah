# ADR 0001: Hierarchical Category System

- **Status:** Accepted
- **Date:** July 2026
- **Deciders:** Software Architecture Team, Lead Developer
- **Technical Story:** Support multi-level product categorization for pharmacy inventory while maintaining high query performance.

---

## Context & Problem Statement

POS Apotek V2 membutuhkan struktur kategorisasi produk bertingkat (hierarki) untuk mengelompokkan berbagai jenis obat, suplemen, dan alat kesehatan (contoh: *Obat Bebas -> Analgesik -> Paracetamol*). 

Sistem awal hanya mendukung kategori 1 tingkat (*flat category*). Hal ini menimbulkan kendala:
1. Kesulitan mengelompokkan produk secara spesifik sesuai standar kefarmasian.
2. Kesulitan pencarian produk pada inventaris apotek yang besar.
3. Kurangnya struktur visual berurut pada navigasi UI kasir dan manajemen produk.

Sistem membutuhkan solusi kategorisasi bertingkat yang efisien dalam query database, mudah dikelola, dan tidak membebani performa response API.

---

## Decision Driver

- **Sederhana & Maintainable:** Menggunakan model data relational baku tanpa kerumitan berlebih (*Adjacency List*).
- **Pembatasan Kedalaman (Depth Limit):** Membatasi hirarki maksimal 3 level untuk mencegah query komputasi rekursif tak terbatas.
- **Urutan Tampilan (Sorting):** Mendukung pengurutan kategori kustom melalui kolom `sortOrder`.
- **Performa Ultra Cepat:** Caching Redis untuk data kategori yang *read-heavy*.

---

## Decision

Kami memutuskan untuk mengimplementasikan **Self-Referencing Category System** pada Prisma Schema dengan strategi caching Redis sebagai berikut:

### 1. Database Schema Design (Prisma ORM)
Tabel `Category` menggunakan pola *Adjacency List* dengan relasi mandiri (*self-referencing relation*):
```prisma
model Category {
  id          String     @id @default(uuid())
  code        String     @unique
  name        String
  description String?
  parentId    String?    @map("parent_id")
  sortOrder   Int        @default(0) @map("sort_order")
  isActive    Boolean    @default(true) @map("is_active")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  deletedAt   DateTime?  @map("deleted_at")

  parent      Category?  @relation("CategoryParent", fields: [parentId], references: [id], onDelete: Restrict)
  children    Category[] @relation("CategoryParent")
  products    Product[]

  @@map("categories")
}
```

### 2. NestJS Tree Traversal & Validation Logic
- **Depth Validation:** Saat `create` atau `update` kategori, backend melakukan kalkulasi kedalaman parent. Jika kedalaman total melebihi 3 level, request ditolak dengan HTTP `422 Unprocessable Entity` (`CATEGORY_DEPTH_EXCEEDED`).
- **Circular Dependency Prevention:** Validasi memastikan `parentId` tidak menunjuk pada ID kategori itu sendiri atau keturunannya.

### 3. Redis Caching Strategy
Karena kategori bersifat *read-heavy* dan *write-rare*, dua struktur cache disimpan di Redis:
- **`categories:tree`**: Menyimpan representasi JSON hirarki lengkap (*tree structure*) yang sudah diurutkan berdasarkan `sortOrder`.
- **`categories:flat`**: Menyimpan JSON daftar kategori *flat* terurut untuk dropdown selector.
- **Invalidation:** Setiap aksi mutasi data kategori (`create`, `update`, `delete`) secara otomatis menghapus key Redis `categories:tree` dan `categories:flat`.

---

## Consequences

### Positive
- **Struktur Rapi & Standar:** Memudahkan pengelompokan produk obat sesuai kategori farmasi hingga 3 level.
- **Performa Ultra Cepat:** Respon API `GET /api/categories/tree` hampir instan (< 5ms) karena diambil langsung dari Redis cache.
- **Skalabilitas & Keamanan:** Pembatasan kedalaman 3 level mencegah *infinite loops* atau *stack overflow* pada traversal tree.

### Negative / Trade-offs
- **Batas Kedalaman Kaku:** Maksimal 3 level kedalaman (cukup untuk apotek V1, namun jika butuh >3 level di masa depan perlu refactoring).
- **Manajemen Cache:** Perlu dipastikan invalidasi Redis cache berjalan konsisten pada setiap mutasi data agar data UI selalu presisi.
