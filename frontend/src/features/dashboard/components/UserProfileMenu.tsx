import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit2,
  Lock,
  Settings,
  Bell,
  Monitor,
  Keyboard,
  HelpCircle,
  Info,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../auth/auth.store';
import { useToastStore } from '../../../shared/components/toast.store';
import { apiClient } from '../../../shared/api/apiClient';

export function UserProfileMenu() {
  const { user, logout } = useAuthStore();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToastStore();
  const navigate = useNavigate();

  // Dialog Form States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Preferences LocalStorage
  const [lang, setLang] = useState(() => localStorage.getItem('pref_lang') || 'Indonesia');
  const [theme, setTheme] = useState(() => localStorage.getItem('pref_theme') || 'Light');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('pref_font') || 'Medium');
  const [sidebarState, setSidebarState] = useState(() => localStorage.getItem('pref_sidebar') || 'Expand');

  // Load User Data to Form
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Close Dropdown click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch('/auth/profile', { name: profileName, email: profileEmail });
      toast.show('Profil berhasil diperbarui!');
      setActiveModal(null);
    } catch (err: any) {
      toast.show(err.message || 'Gagal memperbarui profil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.show('Password baru minimal 8 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show('Konfirmasi password tidak cocok!');
      return;
    }
    try {
      await apiClient.patch('/auth/change-password', { oldPassword, newPassword });
      toast.show('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch (err: any) {
      toast.show(err.message || 'Gagal mengubah password');
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('pref_lang', lang);
    localStorage.setItem('pref_theme', theme);
    localStorage.setItem('pref_font', fontSize);
    localStorage.setItem('pref_sidebar', sidebarState);
    toast.show('Preferensi disimpan!');
    setActiveModal(null);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  // Session Duration Timer (Fake tracking duration)
  const [loginTime] = useState(() => new Date(Date.now() - 1000 * 60 * 45)); // 45 minutes ago
  const [durationStr, setDurationStr] = useState('0 Jam 45 Menit');

  useEffect(() => {
    if (activeModal === 'session-info') {
      const interval = setInterval(() => {
        const diffMs = Date.now() - loginTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setDurationStr(`${hours} Jam ${mins} Menit`);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeModal, loginTime]);

  // Helper Roles visibility
  const isManager = user?.role === 'MANAGER';
  const isOwner = user?.role === 'PEMILIK';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition duration-200"
        aria-label="User Profile Menu"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs">
          {user?.name.slice(0, 2)}
        </div>
        <div className="hidden md:flex flex-col items-start text-xs">
          <span className="font-bold text-slate-800 leading-none">{user?.name}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">{user?.role.toLowerCase()}</span>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base uppercase">
              {user?.name.slice(0, 2)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">{user?.role} • Apotek Risyah</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-slate-500 font-bold">Online</span>
              </div>
            </div>
          </div>

          {/* Menus list */}
          <div className="py-2 divide-y divide-slate-50 text-xs font-semibold text-slate-700">
            <div className="py-1">
              <button
                onClick={() => { setActiveModal('my-profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <User size={14} /> My Profile
              </button>
              <button
                onClick={() => { setActiveModal('edit-profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
              <button
                onClick={() => { setActiveModal('change-password'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <Lock size={14} /> Change Password
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => { setActiveModal('preferences'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <Settings size={14} /> Preferences
              </button>
              <button
                onClick={() => { setActiveModal('notif-settings'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <Bell size={14} /> Notifications
              </button>
              <button
                onClick={() => { setActiveModal('session-info'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <Monitor size={14} /> Session Info
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => { setActiveModal('shortcuts'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <Keyboard size={14} /> Shortcuts
              </button>
              <button
                onClick={() => { setActiveModal('help'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
              >
                <HelpCircle size={14} /> Help Center
              </button>
              {(isManager || isOwner) && (
                <button
                  onClick={() => { setActiveModal('about'); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition"
                >
                  <Info size={14} /> About App
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => { setActiveModal('logout-confirm'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-800 transition"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW OVERLAYS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in scale-in duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={16} />
            </button>

            {/* My Profile */}
            {activeModal === 'my-profile' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">My Profile</h3>
                <div className="flex flex-col items-center gap-2 pb-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl uppercase">
                    {user?.name.slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold text-slate-900">{user?.name}</span>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-full font-bold uppercase text-slate-500">{user?.role}</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Username</span><span className="font-bold text-slate-800">{user?.username}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Email</span><span className="font-bold text-slate-800">{user?.email || '-'}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Cabang</span><span className="font-bold text-slate-800">Apotek Risyah</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Status Akun</span><span className="font-bold text-emerald-600">Aktif</span></div>
                </div>
              </div>
            )}

            {/* Edit Profile */}
            {activeModal === 'edit-profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Edit Profile</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">Simpan</button>
                </div>
              </form>
            )}

            {/* Change Password */}
            {activeModal === 'change-password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password Lama</label>
                    <input
                      type="password"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password Baru</label>
                    <input
                      type="password"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">Perbarui</button>
                </div>
              </form>
            )}

            {/* Preferences */}
            {activeModal === 'preferences' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Preferences</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bahasa</label>
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500 bg-white"
                    >
                      <option>Indonesia</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tema</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-emerald-500 bg-white"
                    >
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Auto</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                  <button onClick={handleSavePreferences} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">Simpan</button>
                </div>
              </div>
            )}

            {/* Logout Confirm */}
            {activeModal === 'logout-confirm' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Keluar dari Sistem</h3>
                <p className="text-xs text-slate-500 font-medium">Apakah Anda yakin ingin keluar dari aplikasi?</p>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                  <button onClick={handleLogout} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs">Logout</button>
                </div>
              </div>
            )}

            {/* Default Placeholder dialog for static info */}
            {['shortcuts', 'help', 'about', 'session-info', 'notif-settings'].includes(activeModal) && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 capitalize">{activeModal.replace('-', ' ')}</h3>
                <div className="text-xs space-y-2 text-slate-600 font-medium">
                  {activeModal === 'shortcuts' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span>Ctrl + K</span><kbd className="bg-slate-100 px-1.5 rounded font-mono font-bold">Global Search</kbd></div>
                      <div className="flex justify-between"><span>Ctrl + N</span><kbd className="bg-slate-100 px-1.5 rounded font-mono font-bold">Transaksi Baru</kbd></div>
                      <div className="flex justify-between"><span>Esc</span><kbd className="bg-slate-100 px-1.5 rounded font-mono font-bold">Tutup Dialog</kbd></div>
                    </div>
                  )}
                  {activeModal === 'about' && (
                    <div className="space-y-1.5">
                      <div>Aplikasi: <strong className="text-slate-800">POS Apotek</strong></div>
                      <div>Versi: <strong className="text-slate-800">v1.0.0</strong></div>
                      <div>Build: <strong className="text-slate-800">2026.07.17</strong></div>
                      {isOwner && (
                        <>
                          <div className="border-t border-slate-100 my-2 pt-2">Server: <strong className="text-slate-800">Linux Docker Container</strong></div>
                          <div>Lisensi: <strong className="text-emerald-600 font-bold">Enterprise Gold</strong></div>
                        </>
                      )}
                    </div>
                  )}
                  {activeModal === 'session-info' && (
                    <div className="space-y-1.5">
                      <div>OS: <strong className="text-slate-800">Windows 11</strong></div>
                      <div>Browser: <strong className="text-slate-800">Chrome Browser</strong></div>
                      <div>IP Address: <strong className="text-slate-800">192.168.1.25</strong></div>
                      <div>Login: <strong className="text-slate-800">17 Juli 2026 08:02</strong></div>
                      <div>Durasi Login: <strong className="text-slate-800">{durationStr}</strong></div>
                    </div>
                  )}
                  {activeModal === 'help' && (
                    <div>
                      Silakan buka tautan <span className="text-emerald-600 underline font-bold cursor-pointer">Panduan Pengguna POS</span> untuk melihat FAQ dan tutorial sistem.
                    </div>
                  )}
                  {activeModal === 'notif-settings' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span>Low Stock Alert</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4 text-emerald-600 accent-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Expired Batch Alert</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4 text-emerald-600 accent-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Purchase Order Delay</span>
                        <input type="checkbox" defaultChecked className="h-4 w-4 text-emerald-600 accent-emerald-500" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Tutup</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
