import { useState, useEffect, useCallback, useRef } from 'react';
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
  RotateCw,
  ZoomIn,
} from 'lucide-react';
import { useAuthStore } from '../auth/auth.store';
import { useToastStore } from '../../shared/components/toast.store';
import { apiClient } from '../../shared/api/apiClient';

// ─── Validation Helpers ───────────────────────────────────────────────────────
function validateName(v: string) {
  if (!v.trim()) return 'Nama lengkap wajib diisi.';
  if (v.trim().length < 3) return 'Nama lengkap minimal 3 karakter.';
  if (v.trim().length > 100) return 'Nama lengkap maksimal 100 karakter.';
  if (/^\d+$/.test(v.trim())) return 'Nama lengkap tidak boleh hanya angka.';
  return '';
}

function validateEmail(v: string) {
  if (!v.trim()) return 'Email tidak boleh kosong.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format email tidak valid.';
  return '';
}

function validatePhone(v: string) {
  if (!v) return ''; // optional
  if (!/^\d+$/.test(v)) return 'Nomor telepon tidak valid.';
  if (v.length < 10 || v.length > 15) return 'Nomor telepon tidak valid.';
  if (!v.startsWith('08') && !v.startsWith('62')) return 'Nomor telepon tidak valid.';
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
function ReadOnlyField({ label, icon: Icon, value }: {
  label: string;
  icon: React.ElementType;
  value: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        <Icon size={12} className="text-slate-400" />
        {label}
        <Lock size={10} className="text-slate-300 ml-0.5" />
      </label>
      <div className="w-full border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold bg-slate-50 text-slate-500 min-h-[42px] flex items-center">
        {value || <span className="text-slate-300 italic font-normal">—</span>}
      </div>
    </div>
  );
}

// ─── Unsaved Changes Dialog ───────────────────────────────────────────────────
function UnsavedDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Perubahan Belum Disimpan</h3>
            <p className="text-xs text-slate-500 mt-1">Apakah Anda ingin meninggalkan halaman ini?</p>
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

// ─── Crop Modal Component ─────────────────────────────────────────────────────
function CropModal({
  imageSrc,
  onClose,
  onApply,
}: {
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 300, 300);

    // Center canvas context
    ctx.translate(150, 150);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scale
    ctx.scale(scale, scale);

    // Calculate aspect ratio fit inside 300x300
    const ar = img.naturalWidth / img.naturalHeight;
    let dw = 300;
    let dh = 300;
    if (ar > 1) {
      dw = 300 * ar;
    } else {
      dh = 300 / ar;
    }

    // Apply drag offset (adjusted for scale and rotation)
    // For drawing relative to center
    const drawX = offset.x / scale;
    const drawY = offset.y / scale;

    ctx.drawImage(img, -dw / 2 + drawX, -dh / 2 + drawY, dw, dh);

    // Export to base64 JPG
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onApply(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Sesuaikan Foto Profil</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition">
            <X size={18} />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
          <div
            className="w-[300px] h-[300px] rounded-full border-2 border-white/80 overflow-hidden flex items-center justify-center cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop view"
              draggable="false"
              className="max-w-none origin-center transition-transform select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                width: '300px',
                height: 'auto',
              }}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-black/30 flex items-center justify-center">
            {/* Outline circle for profile context */}
            <div className="w-[300px] h-[300px] rounded-full border-2 border-dashed border-white/60" />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomIn size={16} className="text-slate-400" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-500 w-8 text-right">{scale.toFixed(1)}x</span>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
            >
              <RotateCw size={14} /> Putar 90°
            </button>
            <span className="text-xs text-slate-400 font-medium">Drag gambar untuk memindahkan</span>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition">
            Batal
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
            Terapkan
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
  const initialAvatarUrl = user?.avatarUrl ?? null;

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);

  // ── Validation Errors ───────────────────────────────────────────────────────
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // ── UX State ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const isDirty =
    name !== initialName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    avatarPreview !== initialAvatarUrl;

  // ── Unsaved Changes Blocker ─────────────────────────────────────────────────
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Real-time validation triggers
  useEffect(() => { if (nameErr) setNameErr(validateName(name)); }, [name]);
  useEffect(() => { if (emailErr) setEmailErr(validateEmail(email)); }, [email]);
  useEffect(() => { if (phoneErr) setPhoneErr(validatePhone(phone)); }, [phone]);

  // ── File Load & Verification ────────────────────────────────────────────────
  const processImageFile = (file: File) => {
    setAvatarError('');

    // Format validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }

    // Size validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ukuran foto maksimal 2 MB.');
      return;
    }

    // Resolution validation (Min 300x300px)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      if (img.width < 300 || img.height < 300) {
        setAvatarError('Resolusi foto minimal 300 x 300 px.');
        URL.revokeObjectURL(objectUrl);
        return;
      }
      // Passed all checks, open crop modal
      setCropSource(objectUrl);
      setIsCropModalOpen(true);
    };

    img.onerror = () => {
      setAvatarError('Gagal memuat file gambar.');
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processImageFile(file);
  }, []);

  // ── Submit changes ──────────────────────────────────────────────────────────
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
      // 1. Update text profile fields via PUT /profile
      const updated = await apiClient.put<{
        name: string;
        email: string | null;
        phone: string | null;
        avatarUrl: string | null;
      }>('/profile', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });

      let finalAvatarUrl = updated.avatarUrl;

      // 2. Upload avatar if changed via POST /profile/avatar
      if (avatarPreview !== initialAvatarUrl) {
        if (avatarPreview) {
          const res = await apiClient.post<{ avatarUrl: string | null }>('/profile/avatar', {
            avatar: avatarPreview,
          });
          finalAvatarUrl = res.avatarUrl;
        } else {
          // If deleted, set avatar to null
          const res = await apiClient.post<{ avatarUrl: string | null }>('/profile/avatar', {
            avatar: '',
          });
          finalAvatarUrl = res.avatarUrl;
        }
      }

      // 3. Update active store state
      const currentState = useAuthStore.getState();
      if (currentState.user) {
        useAuthStore.setState({
          user: {
            ...currentState.user,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            avatarUrl: finalAvatarUrl,
          },
        });
      }

      setSaveSuccess(true);
      toast.show('✓ Profil berhasil diperbarui.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.message || 'Gagal memperbarui profil.';
      if (msg.toLowerCase().includes('email')) {
        setEmailErr('Email sudah digunakan oleh pengguna lain.');
      } else if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('nomor')) {
        setPhoneErr('Nomor telepon tidak valid atau sudah digunakan.');
      } else {
        toast.show(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setName(initialName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setAvatarPreview(initialAvatarUrl);
    setNameErr('');
    setEmailErr('');
    setPhoneErr('');
    setAvatarError('');
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    navigate('/profil');
  };

  const displayName = user?.name ?? 'U';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Unsaved Changes Blocker */}
      {blocker.state === 'blocked' && (
        <UnsavedDialog
          onStay={() => blocker.reset?.()}
          onLeave={() => blocker.proceed?.()}
        />
      )}

      {/* Image Crop Modal */}
      {isCropModalOpen && cropSource && (
        <CropModal
          imageSrc={cropSource}
          onClose={() => {
            setIsCropModalOpen(false);
            if (cropSource.startsWith('blob:')) {
              URL.revokeObjectURL(cropSource);
            }
            setCropSource(null);
          }}
          onApply={(croppedDataUrl) => {
            setAvatarPreview(croppedDataUrl);
            setIsCropModalOpen(false);
            if (cropSource.startsWith('blob:')) {
              URL.revokeObjectURL(cropSource);
            }
            setCropSource(null);
          }}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900">Edit Profile</h1>
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

            {/* ── Avatar Crop & Upload Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-4">Foto Profil</h2>
              <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
                {/* Preview Circle */}
                <div className="relative shrink-0 mx-auto md:mx-0">
                  <div
                    className={`w-24 h-24 rounded-2xl overflow-hidden border-2 ${avatarPreview ? 'border-emerald-400' : 'border-slate-200'} shadow-sm flex items-center justify-center`}
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
                      title="Hapus foto"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Upload Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex-1 w-full border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-emerald-400 hover:bg-emerald-50 transition cursor-pointer group"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                >
                  <Camera size={24} className="mx-auto text-slate-300 group-hover:text-emerald-500 mb-2 transition" />
                  <p className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700 transition">
                    Klik atau drag & drop foto
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — maks. 2 MB (Min. 300x300 px)</p>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processImageFile(file);
                    }}
                  />
                </div>
              </div>
              {avatarError && (
                <p className="mt-3 text-xs text-rose-500 font-medium flex items-center gap-1 justify-center md:justify-start">
                  <AlertCircle size={11} /> {avatarError}
                </p>
              )}
            </div>

            {/* ── Fields Grid ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-5">Informasi Akun</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Nama Lengkap — editable */}
                <FormField id="name" label="Nama Lengkap" icon={User} required error={nameErr} hint="Nama lengkap wajib diisi.">
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
                <FormField id="email" label="Email" icon={Mail} required error={emailErr} hint="Email wajib diisi dan harus unik.">
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
                <FormField id="phone" label="Nomor HP" icon={Phone} error={phoneErr} hint="Contoh: 081234567890 (10-15 digit angka)">
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

              {/* Security Warning */}
              <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                <Lock size={13} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-600 font-medium">
                  Username, Role, Cabang, dan Status Akun bersifat Read-Only untuk alasan keamanan.
                </p>
              </div>
            </div>

            {/* ── Action Footer ── */}
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
                        <Save size={14} /> Simpan
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
