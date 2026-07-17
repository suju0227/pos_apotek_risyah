import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import {
  Save,
  RotateCcw,
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../auth/auth.store';
import { useToastStore } from '../../shared/components/toast.store';
import { apiClient } from '../../shared/api/apiClient';

// ─── Validation Helpers ───────────────────────────────────────────────────────
function validateName(v: string) {
  if (!v.trim()) return 'Nama lengkap wajib diisi';
  if (v.trim().length < 3) return 'Nama minimal 3 karakter';
  if (v.trim().length > 100) return 'Nama maksimal 100 karakter';
  if (/^\d+$/.test(v.trim())) return 'Nama tidak boleh hanya berupa angka';
  return '';
}

function validateEmail(v: string) {
  if (!v) return ''; // optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format email tidak valid';
  return '';
}

function validatePhone(v: string) {
  if (!v) return ''; // optional
  if (!/^\d+$/.test(v)) return 'Nomor HP hanya boleh berisi angka';
  if (v.length < 10) return 'Nomor HP minimal 10 digit';
  if (v.length > 15) return 'Nomor HP maksimal 15 digit';
  return '';
}

// ─── Form Field Component ─────────────────────────────────────────────────────
function FormField({
  id,
  label,
  icon: Icon,
  required,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        <Icon size={12} className="text-slate-400" />
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Read-Only Field ──────────────────────────────────────────────────────────
function ReadOnlyField({ label, icon: Icon, value, badge }: {
  label: string;
  icon: React.ElementType;
  value: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        <Icon size={12} className="text-slate-400" />
        {label}
        <Lock size={10} className="text-slate-300 ml-0.5" />
      </label>
      <div className={`w-full border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-50 text-slate-500 min-h-[42px] flex items-center ${badge ? '' : ''}`}>
        {value || <span className="text-slate-300 italic font-normal">—</span>}
      </div>
    </div>
  );
}

// ─── Unsaved Changes Dialog ───────────────────────────────────────────────────
function UnsavedDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Perubahan Belum Disimpan</h3>
            <p className="text-xs text-slate-500 mt-1">Apakah Anda ingin meninggalkan halaman ini? Perubahan yang belum disimpan akan hilang.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onStay} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition">
            Batal
          </button>
          <button onClick={onLeave} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition">
            Tinggalkan Halaman
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const toast = useToastStore();

  // ── Form State ──────────────────────────────────────────────────────────────
  const initialName = user?.name ?? '';
  const initialEmail = user?.email ?? '';
  const initialPhone = user?.phone ?? '';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);

  // ── Validation Errors ───────────────────────────────────────────────────────
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');

  // ── UX State ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');

  const isDirty =
    name !== initialName || email !== initialEmail || phone !== initialPhone || !!avatarPreview;

  // ── Unsaved Changes Blocker ─────────────────────────────────────────────────
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Real-time validation
  useEffect(() => { if (nameErr) setNameErr(validateName(name)); }, [name]);
  useEffect(() => { if (emailErr) setEmailErr(validateEmail(email)); }, [email]);
  useEffect(() => { if (phoneErr) setPhoneErr(validatePhone(phone)); }, [phone]);

  // ── Avatar Upload ───────────────────────────────────────────────────────────
  const handleAvatarChange = (file: File) => {
    setAvatarError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ukuran foto maksimal 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarChange(file);
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePhone(phone);
    setNameErr(nErr);
    setEmailErr(eErr);
    setPhoneErr(pErr);
    if (nErr || eErr || pErr) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await apiClient.patch<{
        name: string;
        email: string | null;
        phone: string | null;
      }>('/auth/profile', {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // Optimistically update the store
      const currentState = useAuthStore.getState();
      if (currentState.user) {
        useAuthStore.setState({
          user: {
            ...currentState.user,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
          },
        });
      }

      setSaveSuccess(true);
      toast.show('✓ Profil berhasil diperbarui');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || 'Gagal memperbarui profil';
      if (msg.toLowerCase().includes('email')) setEmailErr(msg);
      else if (msg.toLowerCase().includes('hp') || msg.toLowerCase().includes('phone')) setPhoneErr(msg);
      else toast.show(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setName(initialName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setAvatarPreview(null);
    setNameErr('');
    setEmailErr('');
    setPhoneErr('');
    setAvatarError('');
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      // Trigger blocker manually by navigating
      navigate('/profil');
    } else {
      navigate('/profil');
    }
  };

  const displayName = user?.name ?? 'U';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Unsaved Changes Dialog */}
      {blocker.state === 'blocked' && (
        <UnsavedDialog
          onStay={() => blocker.reset?.()}
          onLeave={() => blocker.proceed?.()}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profil')}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900">Edit Profil</h1>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                  Perbarui informasi pribadi akun Anda. Perubahan akan digunakan pada seluruh aplikasi POS Apotek.
                </p>
              </div>
            </div>
            {isDirty && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Ada perubahan belum disimpan
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            {/* ── Avatar Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-4">Foto Profil</h2>
              <div className="flex items-center gap-6">
                {/* Preview */}
                <div className="relative shrink-0">
                  <div
                    className={`w-24 h-24 rounded-2xl overflow-hidden border-2 ${avatarPreview ? 'border-emerald-400' : 'border-slate-200'} shadow-sm`}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => setAvatarPreview(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-rose-600 transition"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Upload Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-emerald-400 hover:bg-emerald-50 transition cursor-pointer group"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                >
                  <Camera size={24} className="mx-auto text-slate-300 group-hover:text-emerald-500 mb-2 transition" />
                  <p className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700 transition">
                    Klik atau drag & drop foto
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — maks. 2 MB</p>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarChange(file);
                    }}
                  />
                </div>
              </div>
              {avatarError && (
                <p className="mt-3 text-xs text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={11} /> {avatarError}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Fitur upload avatar akan tersedia pada versi berikutnya. Preview bisa dilihat secara lokal.
              </p>
            </div>

            {/* ── Editable + ReadOnly Fields ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-5">Informasi Akun</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Nama Lengkap — editable */}
                <FormField id="name" label="Nama Lengkap" icon={User} required error={nameErr} hint="Digunakan di seluruh transaksi dan laporan">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameErr(validateName(e.target.value)); }}
                    onBlur={() => setNameErr(validateName(name))}
                    placeholder="Nama lengkap Anda"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      nameErr ? 'border-rose-300 focus:ring-rose-400 bg-rose-50' : 'border-slate-200 focus:ring-emerald-400'
                    }`}
                  />
                </FormField>

                {/* Username — read only */}
                <ReadOnlyField label="Username" icon={User} value={user?.username} />

                {/* Email — editable */}
                <FormField id="email" label="Email" icon={Mail} error={emailErr} hint="Digunakan untuk notifikasi dan reset password">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailErr(validateEmail(e.target.value)); }}
                    onBlur={() => setEmailErr(validateEmail(email))}
                    placeholder="email@domain.com"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      emailErr ? 'border-rose-300 focus:ring-rose-400 bg-rose-50' : 'border-slate-200 focus:ring-emerald-400'
                    }`}
                  />
                </FormField>

                {/* Nomor HP — editable */}
                <FormField id="phone" label="Nomor HP" icon={Phone} error={phoneErr} hint="Format: 08xxxxxxxxxx (10–15 digit)">
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhone(val);
                      setPhoneErr(validatePhone(val));
                    }}
                    onBlur={() => setPhoneErr(validatePhone(phone))}
                    placeholder="081234567890"
                    maxLength={15}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      phoneErr ? 'border-rose-300 focus:ring-rose-400 bg-rose-50' : 'border-slate-200 focus:ring-emerald-400'
                    }`}
                  />
                </FormField>

                {/* Role — read only */}
                <ReadOnlyField
                  label="Role"
                  icon={Shield}
                  value={
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                      {user?.role}
                    </span>
                  }
                />

                {/* Cabang — read only */}
                <ReadOnlyField label="Cabang" icon={MapPin} value="Apotek Risyah" />

                {/* Status Akun — read only */}
                <ReadOnlyField
                  label="Status Akun"
                  icon={CheckCircle}
                  value={
                    user?.isActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Nonaktif
                      </span>
                    )
                  }
                />

                {/* Tanggal Bergabung — read only */}
                <ReadOnlyField
                  label="Tanggal Bergabung"
                  icon={Calendar}
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

                {/* Login Terakhir — read only */}
                <ReadOnlyField
                  label="Login Terakhir"
                  icon={Clock}
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

              {/* Notice for read-only fields */}
              <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                <Lock size={13} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-600 font-medium">
                  Username, Role, Cabang, dan Status Akun tidak dapat diubah sendiri. Hubungi Manager atau Administrator.
                </p>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty || isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!isDirty || isSaving || !!nameErr || !!emailErr || !!phoneErr}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition ${
                      saveSuccess
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle size={14} /> Tersimpan!
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </>
  );
}
