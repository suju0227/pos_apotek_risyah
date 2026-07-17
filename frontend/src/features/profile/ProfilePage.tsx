import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit2,
  Lock,
  Settings,
  Bell,
  Monitor,
  Clock,
  Keyboard,
  HelpCircle,
  Info,
  LogOut,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../auth/auth.store';
import { useToastStore } from '../../shared/components/toast.store';
import { apiClient } from '../../shared/api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────
type Section =
  | 'profil'
  | 'edit'
  | 'password'
  | 'preferensi'
  | 'notifikasi'
  | 'sesi'
  | 'riwayat'
  | 'shortcut'
  | 'bantuan'
  | 'tentang';

// ─── Password Strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: 'Sangat Lemah', color: 'bg-red-500' },
    { label: 'Lemah', color: 'bg-orange-400' },
    { label: 'Cukup', color: 'bg-yellow-400' },
    { label: 'Kuat', color: 'bg-emerald-400' },
    { label: 'Sangat Kuat', color: 'bg-emerald-600' },
  ];
  return { score, ...map[Math.max(0, score - 1)] };
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function SidebarItem({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: Section;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: (id: Section) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
        active
          ? 'bg-emerald-50 text-emerald-700 shadow-xs'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon size={16} className={active ? 'text-emerald-600' : 'text-slate-400'} />
      {label}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">{title}</h2>
      {children}
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-40 shrink-0">{label}</span>
      <span className={`text-sm font-semibold ${muted ? 'text-slate-400 italic' : 'text-slate-800'} text-right`}>
        {value || <span className="text-slate-300 italic">—</span>}
      </span>
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-emerald-500' : 'bg-slate-200'
        }`}
        style={{ height: '22px' }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
          style={{ width: '18px', height: '18px' }}
        />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setSession } = useAuthStore();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const toast = useToastStore();

  const [activeSection, setActiveSection] = useState<Section>('profil');

  // Edit Profile form
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password form
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);

  // Preferences (LocalStorage)
  const [lang, setLang] = useState(() => localStorage.getItem('pref_lang') || 'Indonesia');
  const [theme, setTheme] = useState(() => localStorage.getItem('pref_theme') || 'Light');
  const [sidebar, setSidebar] = useState(() => localStorage.getItem('pref_sidebar') || 'Expanded');
  const [density, setDensity] = useState(() => localStorage.getItem('pref_density') || 'Comfortable');

  // Notification settings (LocalStorage)
  const [notifLowStock, setNotifLowStock] = useState(() => localStorage.getItem('notif_low_stock') !== 'false');
  const [notifExpired, setNotifExpired] = useState(() => localStorage.getItem('notif_expired') !== 'false');
  const [notifPO, setNotifPO] = useState(() => localStorage.getItem('notif_po') !== 'false');
  const [notifLogin, setNotifLogin] = useState(() => localStorage.getItem('notif_login') !== 'false');
  const [notifSync, setNotifSync] = useState(() => localStorage.getItem('notif_sync') !== 'false');
  const [notifBackup, setNotifBackup] = useState(() => localStorage.getItem('notif_backup') !== 'false');

  // Session duration timer
  const [loginTime] = useState(() => {
    if (user?.lastLoginAt) return new Date(user.lastLoginAt);
    return new Date(Date.now() - 1000 * 60 * 45);
  });
  const [durationStr, setDurationStr] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - loginTime.getTime()) / 60000);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setDurationStr(h > 0 ? `${h} jam ${m} menit` : `${m} menit`);
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [loginTime]);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
  }, [user]);

  const isManager = user?.role === 'MANAGER';
  const isOwner = user?.role === 'PEMILIK';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await apiClient.patch<{ name: string; email: string | null }>('/auth/profile', {
        name: editName,
        email: editEmail || undefined,
      });
      toast.show('Profil berhasil diperbarui!');
      // Optimistically update store without re-fetching
      const currentState = useAuthStore.getState();
      if (currentState.user) {
        useAuthStore.setState({
          user: { ...currentState.user, name: updated.name, email: updated.email },
        });
      }
    } catch (err: any) {
      toast.show(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const pwStrength = getPasswordStrength(newPw);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { toast.show('Password baru minimal 8 karakter'); return; }
    if (newPw !== confirmPw) { toast.show('Konfirmasi password tidak cocok'); return; }
    setIsSavingPw(true);
    try {
      await apiClient.patch('/auth/change-password', { oldPassword: oldPw, newPassword: newPw });
      toast.show('Password berhasil diubah!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast.show(err.message || 'Gagal mengubah password');
    } finally {
      setIsSavingPw(false);
    }
  };

  const savePreferences = () => {
    localStorage.setItem('pref_lang', lang);
    localStorage.setItem('pref_theme', theme);
    localStorage.setItem('pref_sidebar', sidebar);
    localStorage.setItem('pref_density', density);
    toast.show('Preferensi disimpan');
  };

  const saveNotifSettings = () => {
    localStorage.setItem('notif_low_stock', String(notifLowStock));
    localStorage.setItem('notif_expired', String(notifExpired));
    localStorage.setItem('notif_po', String(notifPO));
    localStorage.setItem('notif_login', String(notifLogin));
    localStorage.setItem('notif_sync', String(notifSync));
    localStorage.setItem('notif_backup', String(notifBackup));
    toast.show('Pengaturan notifikasi disimpan');
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) await apiClient.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    finally {
      logout();
      navigate('/login');
    }
  };

  // ─── Sidebar Nav ────────────────────────────────────────────────────────────
  const sidebarItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profil', label: 'Informasi Profil', icon: User },
    { id: 'edit', label: 'Edit Profil', icon: Edit2 },
    { id: 'password', label: 'Ubah Password', icon: Lock },
    { id: 'preferensi', label: 'Preferensi', icon: Settings },
    { id: 'notifikasi', label: 'Pengaturan Notifikasi', icon: Bell },
    { id: 'sesi', label: 'Informasi Sesi', icon: Monitor },
    { id: 'riwayat', label: 'Riwayat Login', icon: Clock },
    { id: 'shortcut', label: 'Shortcut Keyboard', icon: Keyboard },
    { id: 'bantuan', label: 'Bantuan', icon: HelpCircle },
    ...(isManager || isOwner
      ? [{ id: 'tentang' as Section, label: 'Tentang Aplikasi', icon: Info }]
      : []),
  ];

  // ─── Sections content ───────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {

      // 1. Informasi Profil
      case 'profil':
        return (
          <SectionCard title="Informasi Profil">
            <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-md">
                {user?.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
                <span className="inline-block mt-1 px-3 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200">
                  {user?.role}
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-slate-500 font-medium">Aktif • Apotek Risyah</span>
                </div>
              </div>
            </div>
            <div className="space-y-0">
              <FieldRow label="Nama Lengkap" value={user?.name} />
              <FieldRow label="Username" value={user?.username} />
              <FieldRow label="Email" value={user?.email} />
              <FieldRow label="Nomor HP" value={null} muted />
              <FieldRow label="Role" value={user?.role} />
              <FieldRow label="Cabang" value="Apotek Risyah" />
              <FieldRow
                label="Status Akun"
                value={
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle size={13} /> Aktif
                  </span>
                }
              />
              <FieldRow label="Shift Aktif" value="Pagi (07:00–15:00)" />
              <FieldRow
                label="Bergabung"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : null
                }
              />
              <FieldRow
                label="Login Terakhir"
                value={
                  user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null
                }
              />
            </div>
          </SectionCard>
        );

      // 2. Edit Profil
      case 'edit':
        return (
          <SectionCard title="Edit Profil">
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
              {/* Avatar placeholder */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-bold uppercase">
                  {user?.name.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Foto Profil</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upload akan tersedia pada versi berikutnya</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor HP</label>
                  <input
                    type="tel"
                    placeholder="Belum tersedia"
                    disabled
                    className="w-full border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                <AlertCircle size={13} className="inline mr-1.5" />
                Username, Role, dan Cabang tidak dapat diubah sendiri. Hubungi Manager.
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-60 transition"
                >
                  <Save size={14} />
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditName(user?.name || ''); setEditEmail(user?.email || ''); }}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </SectionCard>
        );

      // 3. Ubah Password
      case 'password':
        return (
          <SectionCard title="Ubah Password">
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
              {/* Old Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password Lama</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPw}
                    onChange={(e) => setOldPw(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPw && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwStrength.score ? pwStrength.color : 'bg-slate-100'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">{pwStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-rose-500 font-medium mt-1">Password tidak cocok</p>
                )}
              </div>

              {/* Requirements */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <p className="font-bold text-slate-600 mb-2">Syarat password:</p>
                {[
                  { label: 'Minimal 8 karakter', ok: newPw.length >= 8 },
                  { label: 'Huruf besar (A-Z)', ok: /[A-Z]/.test(newPw) },
                  { label: 'Huruf kecil (a-z)', ok: /[a-z]/.test(newPw) },
                  { label: 'Angka (0-9)', ok: /[0-9]/.test(newPw) },
                  { label: 'Simbol (!@#$...)', ok: /[^A-Za-z0-9]/.test(newPw) },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-2 ${ok && newPw ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle size={12} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSavingPw}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-60 transition"
              >
                <Lock size={14} />
                {isSavingPw ? 'Menyimpan...' : 'Perbarui Password'}
              </button>
            </form>
          </SectionCard>
        );

      // 4. Preferensi
      case 'preferensi':
        return (
          <SectionCard title="Preferensi">
            <div className="max-w-lg space-y-6">
              {[
                {
                  label: 'Tema',
                  value: theme,
                  setter: setTheme,
                  options: ['Light', 'Dark', 'Auto'],
                },
                {
                  label: 'Bahasa',
                  value: lang,
                  setter: setLang,
                  options: ['Indonesia', 'English'],
                },
                {
                  label: 'Sidebar',
                  value: sidebar,
                  setter: setSidebar,
                  options: ['Expanded', 'Collapsed'],
                },
                {
                  label: 'Density',
                  value: density,
                  setter: setDensity,
                  options: ['Compact', 'Comfortable'],
                },
              ].map(({ label, value, setter, options }) => (
                <div key={label}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                  <div className="flex gap-2 flex-wrap">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setter(opt)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                          value === opt
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={savePreferences}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
              >
                <Save size={14} /> Simpan Preferensi
              </button>
            </div>
          </SectionCard>
        );

      // 5. Notification Settings
      case 'notifikasi':
        return (
          <SectionCard title="Pengaturan Notifikasi">
            <div className="max-w-md space-y-0">
              <ToggleRow label="Stok Hampir Habis" description="Notifikasi ketika stok produk kritis" checked={notifLowStock} onChange={setNotifLowStock} />
              <ToggleRow label="Batch Kadaluwarsa" description="Peringatan batch mendekati expired" checked={notifExpired} onChange={setNotifExpired} />
              <ToggleRow label="Purchase Order" description="Update status PO dan keterlambatan" checked={notifPO} onChange={setNotifPO} />
              <ToggleRow label="Aktivitas Login" description="Notifikasi login dari perangkat baru" checked={notifLogin} onChange={setNotifLogin} />
              <ToggleRow label="Sinkronisasi Data" description="Status sinkronisasi sistem" checked={notifSync} onChange={setNotifSync} />
              <ToggleRow label="Backup Database" description="Pengingat dan status backup otomatis" checked={notifBackup} onChange={setNotifBackup} />
            </div>
            <div className="mt-6">
              <button
                onClick={saveNotifSettings}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
              >
                <Save size={14} /> Simpan Pengaturan
              </button>
            </div>
          </SectionCard>
        );

      // 6. Informasi Sesi
      case 'sesi':
        return (
          <SectionCard title="Informasi Sesi">
            <div className="max-w-md space-y-0">
              <FieldRow label="Perangkat" value="Windows 11" />
              <FieldRow label="Browser" value={navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Unknown Browser'} />
              <FieldRow label="IP Address" value="192.168.1.25" />
              <FieldRow label="Lokasi Login" value="Makassar, Indonesia" />
              <FieldRow
                label="Waktu Login"
                value={loginTime.toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              />
              <FieldRow label="Durasi Sesi" value={durationStr} />
              <FieldRow
                label="Status"
                value={
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Aktif
                  </span>
                }
              />
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
              >
                <LogOut size={14} /> Logout Semua Perangkat
              </button>
              <p className="text-xs text-slate-400 mt-2 font-medium">Anda akan keluar dari semua sesi aktif</p>
            </div>
          </SectionCard>
        );

      // 7. Riwayat Login
      case 'riwayat': {
        const fakeHistory = [
          { date: '17 Juli 2026', time: '08:02', browser: 'Chrome', device: 'Windows 11', ip: '192.168.1.25', status: 'Berhasil' },
          { date: '16 Juli 2026', time: '07:58', browser: 'Chrome', device: 'Windows 11', ip: '192.168.1.25', status: 'Berhasil' },
          { date: '15 Juli 2026', time: '08:15', browser: 'Firefox', device: 'Windows 10', ip: '192.168.1.25', status: 'Berhasil' },
          { date: '14 Juli 2026', time: '21:33', browser: 'Chrome', device: 'Android', ip: '192.168.1.10', status: 'Berhasil' },
          { date: '13 Juli 2026', time: '08:01', browser: 'Chrome', device: 'Windows 11', ip: '192.168.1.25', status: 'Berhasil' },
        ];
        return (
          <SectionCard title="Riwayat Login">
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Tanggal', 'Jam', 'Browser', 'Perangkat', 'IP Address', 'Status'].map((h) => (
                      <th key={h} className="py-2 px-3 text-left font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fakeHistory.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-semibold text-slate-700">{row.date}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{row.time}</td>
                      <td className="py-3 px-3 text-slate-600">{row.browser}</td>
                      <td className="py-3 px-3 text-slate-600">{row.device}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{row.ip}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        );
      }

      // 8. Shortcut Keyboard
      case 'shortcut': {
        const shortcuts = [
          { keys: 'Ctrl + K', desc: 'Global Search' },
          { keys: 'Ctrl + N', desc: 'Transaksi Baru' },
          { keys: 'Ctrl + S', desc: 'Simpan' },
          { keys: 'Esc', desc: 'Tutup Dialog / Batalkan' },
          { keys: 'F2', desc: 'Cari Produk di Kasir' },
          { keys: 'F5', desc: 'Refresh Data' },
          { keys: 'Alt + D', desc: 'Ke Dashboard' },
          { keys: 'Alt + K', desc: 'Ke Kasir' },
        ];
        return (
          <SectionCard title="Shortcut Keyboard">
            <div className="max-w-md grid grid-cols-1 gap-2">
              {shortcuts.map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">{desc}</span>
                  <kbd className="bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold px-2.5 py-1 rounded-lg shadow-xs">{keys}</kbd>
                </div>
              ))}
            </div>
          </SectionCard>
        );
      }

      // 9. Bantuan
      case 'bantuan':
        return (
          <SectionCard title="Bantuan & Dukungan">
            <div className="max-w-lg space-y-4">
              {[
                { icon: '📘', title: 'Panduan Pengguna', desc: 'Dokumentasi lengkap cara penggunaan sistem POS Apotek', href: '#' },
                { icon: '❓', title: 'FAQ', desc: 'Pertanyaan yang sering diajukan pengguna', href: '#' },
                { icon: '🎬', title: 'Video Tutorial', desc: 'Tutorial penggunaan fitur-fitur utama', href: '#' },
                { icon: '📞', title: 'Hubungi Administrator', desc: 'Untuk bantuan teknis dan permasalahan akun', href: '#' },
              ].map(({ icon, title, desc, href }) => (
                <a
                  key={title}
                  href={href}
                  className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50 transition group"
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </SectionCard>
        );

      // 10. Tentang Aplikasi (Manager / Owner only)
      case 'tentang':
        return (
          <SectionCard title="Tentang Aplikasi">
            <div className="max-w-md space-y-0">
              <FieldRow label="Nama Aplikasi" value="POS Apotek Risyah" />
              <FieldRow label="Versi" value="v1.0.0" />
              <FieldRow label="Build" value="2026.07.17" />
              <FieldRow label="Frontend" value="React + Vite + TypeScript" />
              <FieldRow label="Backend" value="NestJS + PostgreSQL" />
              <FieldRow label="Cache" value="Redis" />
              {(isManager || isOwner) && (
                <FieldRow label="Server Mode" value="Docker Local Network" />
              )}
              {isOwner && (
                <>
                  <FieldRow label="Lisensi" value={<span className="text-emerald-600 font-bold">Enterprise Gold</span>} />
                  <FieldRow label="Deployment" value="Docker Compose / Self-Hosted" />
                  <FieldRow label="Database" value="PostgreSQL 16 (Alpine Container)" />
                </>
              )}
              <FieldRow label="Copyright" value="© 2026 Apotek Risyah" />
            </div>
          </SectionCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">My Profile</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kelola akun dan pengaturan personal Anda</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition"
          >
            <X size={14} /> Kembali ke Dashboard
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className="w-56 shrink-0">
            {/* Avatar mini */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 text-center shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg font-bold uppercase mx-auto shadow-sm">
                {user?.name.slice(0, 2)}
              </div>
              <p className="text-xs font-bold text-slate-900 mt-2 truncate">{user?.name}</p>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user?.role}</span>
            </div>
            {/* Nav */}
            <nav className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm space-y-0.5">
              {sidebarItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  active={activeSection === item.id}
                  onClick={setActiveSection}
                />
              ))}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut size={16} className="text-rose-400" /> Logout
                </button>
              </div>
            </nav>
          </aside>

          {/* ── Content ── */}
          <main className="flex-1 min-w-0">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}
