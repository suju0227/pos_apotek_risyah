# Design Specification - User Profile Menu POS Apotek V2

Sistem pengelolaan akun dan sesi pengguna terintegrasi di Header Dashboard dengan pengubahan profil & password riil pada database PostgreSQL, serta penyimpanan preferensi visual di LocalStorage.

## 1. Arsitektur Backend

### Endpoint Baru di AuthController
Dua endpoint baru ditambahkan ke `/api/auth/` (bisa diakses oleh seluruh peran yang terautentikasi):

1.  **Update Profile (`PATCH /api/auth/profile`)**
    *   Fungsi: Memperbarui data diri (`name`, `email`).
    *   DTO (`UpdateProfileDto`):
        *   `name`: string (opsional, min length 3)
        *   `email`: string (opsional, is email)
    *   Validasi: Memastikan email tidak duplikat dengan akun lain.

2.  **Change Password (`PATCH /api/auth/change-password`)**
    *   Fungsi: Memperbarui password.
    *   DTO (`ChangePasswordDto`):
        *   `oldPassword`: string (wajib)
        *   `newPassword`: string (wajib, min length 8)
    *   Validasi: Mencocokkan `oldPassword` dengan password hash saat ini di database menggunakan `bcrypt.compare`.

---

## 2. Arsitektur Frontend

### Dropdown Menu Terintegrasi
Komponen `<UserProfileMenu />` ditambahkan di sisi kanan Header Dashboard:
-   **Trigger**: Tombol yang menampilkan nama pengguna dan perannya (contoh: `👤 Suryadi Umar (Manager) ▼`).
-   **Header Dropdown**: Menampilkan Detail Sesi Aktif:
    *   Nama Lengkap
    *   Role (KASIR / APOTEKER / MANAGER / PEMILIK)
    *   Cabang: `Apotek Risyah` (Konstan)
    *   Status: `🟢 Online`
    *   Jam Login: Diambil dari waktu token dibuat atau `lastLoginAt`.

### Dialog Pengelolaan Profil
Dua modul dialog dibuat di frontend menggunakan modal Tailwind overlay:

1.  **Dialog Edit Profile**:
    *   Mengubah Nama Lengkap dan Email.
    *   Mengirim mutasi PATCH ke `/api/auth/profile`.
    *   Jika berhasil, tampilkan toast dan refresh query profil pengguna `GET /api/auth/me`.

2.  **Dialog Ganti Password**:
    *   Form: Password Lama, Password Baru, Konfirmasi Password Baru.
    *   Validasi kekuatan password (minimal 8 karakter, kombinasi huruf dan angka).
    *   Mengirim mutasi PATCH ke `/api/auth/change-password`.

3.  **Preferences (LocalStorage)**:
    *   Bahasa (`Indonesia` / `English`)
    *   Tema (`Light` / `Dark` / `Auto`)
    *   Ukuran Font (`Small` / `Medium` / `Large`)
    *   Sidebar Toggle (`Expand` / `Collapse`)

4.  **Notification Settings (LocalStorage)**:
    *   Toggle untuk Low Stock, Batch Expired, PO, Backup, Login, dan Sinkronisasi.

5.  **Session Information**:
    *   Menampilkan OS, Browser, alamat IP (diambil dari backend `ipAddress` atau data klien), waktu login, dan durasi sesi aktif (ticking timer).

6.  **Keyboard Shortcuts & About Application**:
    *   Daftar shortcut global (`Ctrl+K` untuk search, dll).
    *   Informasi build aplikasi (POS Apotek v1.0.0, NestJS, React).

7.  **Logout**:
    *   Menampilkan dialog konfirmasi "Keluar dari Sistem".
    *   Jika yakin, memanggil API POST `/api/auth/logout` dan menghapus token dari storage.
