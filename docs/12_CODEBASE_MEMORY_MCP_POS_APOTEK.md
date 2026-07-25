# Integrasi Codebase Memory MCP - POS Apotek

## 1. Pendahuluan

`codebase-memory-mcp` adalah mesin kecerdasan kode (code intelligence engine) berbasis tree-sitter AST dan LSP tipe-semantik yang berjalan 100% lokal. Alat ini memetakan seluruh file source code di repositori kita ke dalam sebuah knowledge graph yang disimpan dalam database SQLite terkompresi.

Dengan mengintegrasikan alat ini, AI coding agents (seperti Antigravity atau Gemini CLI) dapat memahami dependensi, alur panggilan, arsitektur, dan perubahan kode menggunakan query terstruktur dengan konsumsi token yang jauh lebih efisien (**menghemat token hingga 99%** dibandingkan dengan grep tradisional atau membaca file secara berulang).

## 2. Struktur Integrasi di Repositori

Kami telah mengonfigurasi integrasi lokal berikut di repositori POS Apotek:
1. **`.cbmignore`**: Ignore list untuk indexer guna mengecualikan file data/log, database backups, file konfigurasi sensitif `.env`, visualisasi, serta direktori `.agents/` dan `.codex/`.
2. **`.codebase-memory/`**: Folder yang menyimpan graph database terkompresi:
   - `graph.db.zst`: Snapshot biner database graph terkompresi dengan zstd.
   - `artifact.json`: Metadata commit dan versi schema index.
   - `.gitattributes`: Mencegah konflik merge Git pada biner `graph.db.zst` dengan menetapkan filter `merge=ours binary`.

Dengan adanya kompresi biner `.codebase-memory/graph.db.zst` (sekitar ~300 KB), developer lain atau agen baru yang melakukan clone repositori dapat langsung memuat (bootstrap) indeks dalam milidetik tanpa perlu melakukan re-indexing penuh.

## 3. Daftar 14 Tools codebase-memory-mcp

Berikut adalah daftar tools MCP yang tersedia setelah instalasi, beserta kegunaannya bagi agen AI:

| Nama Tool | Deskripsi Fungsi | Rekomendasi Waktu Penggunaan |
|---|---|---|
| `index_repository` | Membuat indeks baru atau memperbarui indeks repository secara lokal. Mendukung `--persistence` untuk menulis biner tim. | Dipanggil saat pertama kali membuka workspace atau setelah ada perubahan besar. |
| `index_status` | Membaca status indexing, jumlah node/edge, dan daftar file yang dilewati (skipped/partial). | Digunakan untuk memeriksa apakah data grafik sudah lengkap. |
| `search_graph` | Melakukan pencarian simbol menggunakan BM25 full-text, pola regex nama, atau pencarian vektor semantik. | Digunakan sebagai pengganti `grep` untuk mencari definisi class, interface, fungsi, atau HTTP route. |
| `search_code` | Melakukan pencarian teks mirip grep yang diperkaya metadata relasi grafik (menyaring signatures & hotspots). | Digunakan saat mencari referensi string literal di dalam kode. |
| `query_graph` | Mengeksekusi query Cypher secara langsung ke knowledge graph untuk pola multi-hop kompleks atau analisis loop. | Digunakan untuk analisis arsitektur kompleks (misal: mencari circular dependency atau nested loop terdalam). |
| `trace_path` | Melacak jalur panggilan (callers/callees), data flow (aliran variabel), atau cross-service (HTTP routes). | Digunakan untuk melacak siapa yang memanggil fungsi tertentu, atau bagaimana input form mengalir ke DB. |
| `get_code_snippet` | Membaca source code untuk simbol/fungsi tertentu berdasarkan qualified_name. | Digunakan setelah menemukan simbol via `search_graph` untuk membaca implementasi aslinya secara terfokus. |
| `get_graph_schema` | Mengambil schema label node dan tipe edge yang tersedia di dalam grafik. | Digunakan oleh agen untuk memahami relasi apa saja yang bisa ditanyakan. |
| `get_architecture` | Memberikan ringkasan arsitektur (package, entry points, hotspots, layers, cluster Louvain). | Digunakan untuk orientasi awal memahami modularitas dan de-facto package boundaries. |
| `detect_changes` | Memetakan perubahan git diff (diff staging/branch) terhadap simbol code beserta klasifikasi risikonya. | Digunakan sebelum membuat commit atau pull request untuk analisis dampak (impact analysis). |
| `manage_adr` | Menyimpan dan mengelola Architecture Decision Records (ADR) dalam workspace. | Digunakan untuk merekam keputusan arsitektur penting agar tidak hilang di sesi berikutnya. |
| `ingest_traces` | Memasukkan trace performa runtime untuk digabungkan dengan static call graph. | Digunakan untuk memvisualisasikan hot paths berdasarkan eksekusi riil (opsional). |
| `list_projects` | Menampilkan seluruh proyek yang saat ini terindeks di sistem lokal. | Digunakan untuk navigasi antar project. |
| `delete_project` | Menghapus indeks project tertentu dari cache local sqlite. | Digunakan untuk membersihkan disk space. |

## 4. Cara Penggunaan bagi Developer

### Instalasi Global
Jika belum terinstall di komputer, jalankan script instalasi resmi:

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.ps1 -OutFile install.ps1
Unblock-File .\install.ps1
.\install.ps1
```

Script di atas akan mendeteksi editor/agen Anda (VS Code, Claude Code, Gemini CLI, dll.) dan mendaftarkan codebase-memory-mcp sebagai server stdio MCP global.

### Menjalankan Indexing Ulang Secara Manual
Jika Anda melakukan perubahan kode besar dan ingin memperbarui team artifact di `.codebase-memory/`:

```bash
# Hapus cache lokal lama agar re-index bersih
codebase-memory-mcp cli delete_project --project D-pos_apotek_risyah

# Jalankan indexer dengan single worker (mengantisipasi crash tree-sitter) dan persistence aktif
cmd /c "set CBM_INDEX_SUPERVISOR=0&& set CBM_WORKERS=1&& codebase-memory-mcp cli index_repository --repo-path d:/pos_apotek_risyah --mode fast --persistence"
```

### Menguji Indeks via CLI
Anda dapat menguji apakah query index berjalan lancar:
```bash
# Mencari SalesService
codebase-memory-mcp cli search_graph --project D-pos_apotek_risyah --query SalesService --limit 5

# Melihat overview arsitektur
codebase-memory-mcp cli get_architecture --project D-pos_apotek_risyah --aspects overview
```
