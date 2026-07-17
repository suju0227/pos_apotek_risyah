# Codex & Agent Skills - POS Apotek

## 1. Tujuan

Dokumen ini mencatat adaptasi konsep dari katalog `openai/skills` dan integrasi native dari `addyosmani/agent-skills` ke dalam workflow POS Apotek. Skill eksternal dan lokal diatur sedemikian rupa agar tetap tunduk pada `AGENTS.md`, PRD, SRS, SDD, dan guardrail V1.

## 2. Hasil Analisis `openai/skills`

`openai/skills` adalah katalog folder instruksi, referensi, script, dan asset untuk membuat workflow Codex berulang. Skill yang paling relevan untuk POS Apotek:

| Skill publik | Relevansi | Keputusan |
|---|---|---|
| `security-best-practices` | Cocok untuk menjaga auth, RBAC, sanitasi response kasir, dan secure-by-default TypeScript/NestJS. | Diadaptasi sebagai guardrail keamanan pada skill lokal implementasi. |
| `security-threat-model` | Cocok untuk sesi threat model POS: asset stok, transaksi, laba, token, audit log, dan backup. | Dipakai sebagai referensi pola untuk sesi security/testing nanti. |
| `playwright` | Cocok untuk smoke test UI real browser saat sesi testing. | Diadaptasi sebagai bagian skill testing, tanpa menambah test besar ke sesi implementasi. |
| `gh-address-comments` dan `yeet` | Cocok untuk workflow GitHub review, commit, push, dan PR. | Dipakai sebagai referensi proses, tetapi tetap mengikuti instruksi git lokal dan approval sandbox. |
| Skill deploy cloud | Tidak cocok sebagai default V1 karena target utama proyek adalah Docker Full Local Mode. | Tidak diaktifkan sebagai baseline proyek. |

## 3. Integrasi `addyosmani/agent-skills`

Sebanyak 24 skill berkualitas produksi, 4 specialist agent, 7 checklists, dan 8 custom slash commands dari `addyosmani/agent-skills` telah diintegrasikan langsung ke repositori lokal di bawah direktori `.agents/` dan `.gemini/`.

### Struktur Folder
- **Skills (`.agents/skills/`)**: Folder berisi instruksi langkah-demi-langkah (misalnya `spec-driven-development`, `test-driven-development`, `security-and-hardening`, `doubt-driven-development`).
- **Agents (`.agents/agents/`)**: Konfigurasi subagent spesialis (`code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`).
- **References (`.agents/references/`)**: Checklist referensi (`definition-of-done`, `security-checklist`, `testing-patterns`, dll.).
- **Commands (`.agents/commands/` & `.gemini/commands/`)**: Konfigurasi slash commands (seperti `/spec`, `/planning`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`, `/webperf`).

### Cara Menggunakan Slash Commands
Apabila menggunakan CLI berbasis Antigravity atau Gemini, perintah berikut dapat dipanggil dari terminal untuk memicu skill secara otomatis:
- `/spec` - Menulis spesifikasi sebelum membuat kode (`spec-driven-development`).
- `/planning` - Menyusun breakdown tugas yang kecil dan dapat diverifikasi (`planning-and-task-breakdown`).
- `/build` - Mengimplementasikan tugas secara bertahap (`incremental-implementation`).
- `/test` - Menjalankan alur pengujian TDD (`test-driven-development`).
- `/review` - Melakukan review kode lima-axis (`code-review-and-quality`).
- `/code-simplify` - Menyederhanakan kompleksitas kode tanpa mengubah perilakunya (`code-simplification`).
- `/ship` - Memeriksa checklist pra-rilis (`shipping-and-launch`).
- `/webperf` - Memeriksa kinerja web app (`web-performance-auditor`).

## 4. Skill Lokal Khusus POS Apotek

Di samping `agent-skills` umum, repositori ini mempertahankan skill lokal khusus yang memetakan aturan bisnis dan teknis POS Apotek V1:

| Skill lokal | Lokasi | Kegunaan |
|---|---|---|
| `pos-apotek-v1-implementation` | `.codex/skills/pos-apotek-v1-implementation` | Dipakai saat implementasi fitur V1, terutama stock/batch/FEFO/sales/purchase/return/report/users/settings/audit-log. |
| `pos-apotek-testing-safety` | `.codex/skills/pos-apotek-testing-safety` | Dipakai saat sesi testing, smoke manual, role security, Docker local validation, dan backup/restore. |

Referensi tambahan untuk pengembang:
- `docs/business-rules.md`
- `docs/frontend-patterns.md`
- `docs/local-deployment.md`
- `docs/test-matrix.md`
- [docs/12_CODEBASE_MEMORY_MCP_POS_APOTEK.md](file:///d:/pos_apotek_risyah/docs/12_CODEBASE_MEMORY_MCP_POS_APOTEK.md)

## 5. Aturan Prioritas dan Konflik

1. **`AGENTS.md` serta dokumen PRD/SRS/SDD memegang kekuasaan tertinggi.** Jika ada anjuran dari `agent-skills` umum yang bertentangan dengan guardrail POS Apotek (misalnya aturan local deployment vs cloud-first, presisi HPP/laba, FEFO backend, atau RBAC kasir), maka aturan POS Apotek **harus dimenangkan**.
2. Skill lokal memetakan spesifikasi teknis dan bisnis spesifik POS Apotek V1.
3. Skill eksternal (`agent-skills`) digunakan untuk standarisasi proses pengodean (TDD, refactoring, code quality, security hardening, git workflow) tanpa mengubah lingkup (scope) fitur V1.
4. Docker Full Local Mode tetap menjadi target deployment utama V1.
