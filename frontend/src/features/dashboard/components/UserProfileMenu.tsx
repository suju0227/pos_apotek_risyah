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
import { apiClient } from '../../../shared/api/apiClient';

export function UserProfileMenu() {
  const { user, logout } = useAuthStore();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  // Helper Roles visibility
  const isManager = user?.role === 'MANAGER';
  const isOwner = user?.role === 'PEMILIK';

  const avatarUrl = user?.avatarUrl;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
        aria-label="User Profile Menu"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-sm uppercase shadow-xs">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
              {user?.name.slice(0, 2)}
            </div>
          )}
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
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center font-bold text-base uppercase">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                  {user?.name.slice(0, 2)}
                </div>
              )}
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
                onClick={() => { navigate('/profil'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <User size={14} /> My Profile
              </button>
              <button
                onClick={() => { navigate('/profil/edit'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
              <button
                onClick={() => { navigate('/profil', { state: { section: 'password' } }); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <Lock size={14} /> Change Password
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => { navigate('/profil', { state: { section: 'preferensi' } }); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <Settings size={14} /> Preferences
              </button>
              <button
                onClick={() => { navigate('/profil', { state: { section: 'notifikasi' } }); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <Bell size={14} /> Notifications
              </button>
              <button
                onClick={() => { navigate('/profil', { state: { section: 'sesi' } }); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <Monitor size={14} /> Session Info
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => { navigate('/profil', { state: { section: 'shortcut' } }); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <Keyboard size={14} /> Shortcuts
              </button>
              <button
                onClick={() => { navigate('/profil', { state: { section: 'bantuan' } }); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
              >
                <HelpCircle size={14} /> Help Center
              </button>
              {(isManager || isOwner) && (
                <button
                  onClick={() => { navigate('/profil', { state: { section: 'tentang' } }); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 rounded-xl hover:text-emerald-600 transition cursor-pointer"
                >
                  <Info size={14} /> About App
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => { setActiveModal('logout-confirm'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-800 transition cursor-pointer"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal Overlay */}
      {activeModal === 'logout-confirm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in scale-in duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={16} />
            </button>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Keluar dari Sistem</h3>
              <p className="text-xs text-slate-500 font-medium">Apakah Anda yakin ingin keluar dari aplikasi?</p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer">Batal</button>
                <button onClick={handleLogout} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
