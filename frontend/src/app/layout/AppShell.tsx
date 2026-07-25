import {
  Archive,
  ArrowLeftRight,
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  FilePlus2,
  HeartHandshake,
  History,
  Home,
  LogOut,
  Menu,
  Package,
  Pill,
  Plus,
  Receipt,
  RotateCcw,
  Scale,
  Scroll,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Tags,
  TrendingUp,
  Truck,
  UserCog,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../features/auth/auth.store';
import type { RoleName } from '../../features/auth/auth.types';
import { Button } from '../../shared/components/Button';
import { ConnectionStatusIndicator } from '../../shared/components/ConnectionStatusIndicator';
import { useConnectionStatus } from '../../shared/hooks/useConnectionStatus';
import { GlobalSearch } from '../../features/dashboard/components/GlobalSearch';
import { NotificationCenter } from '../../features/dashboard/components/NotificationCenter';
import { UserProfileMenu } from '../../features/dashboard/components/UserProfileMenu';
import { useSettingsStore } from '../../features/settings/settings.store';

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: RoleName[];
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Utama',
    icon: Home,
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: Home,
        roles: ['APOTEKER', 'MANAGER', 'PEMILIK'],
      },
      { label: 'Kasir', path: '/kasir', icon: Receipt, roles: ['KASIR', 'MANAGER'] },
    ],
  },
  {
    label: 'Transaksi',
    icon: History,
    items: [
      {
        label: 'Riwayat Transaksi',
        path: '/riwayat-transaksi',
        icon: History,
        roles: ['KASIR', 'MANAGER'],
      },
      {
        label: 'Retur Penjualan',
        path: '/retur-penjualan',
        icon: RotateCcw,
        roles: ['KASIR', 'MANAGER'],
      },
    ],
  },
  {
    label: 'Pelayanan',
    icon: Pill,
    items: [
      {
        label: 'Resep',
        path: '/pelayanan/resep',
        icon: Pill,
        roles: ['APOTEKER', 'MANAGER'],
      },
      {
        label: 'Konseling',
        path: '/pelayanan/konseling',
        icon: HeartHandshake,
        roles: ['APOTEKER', 'MANAGER'],
      },
    ],
  },
  {
    label: 'Master Data',
    icon: Package,
    items: [
      { label: 'Produk', path: '/produk', icon: Package, roles: ['MANAGER'] },
      { label: 'Kategori', path: '/kategori', icon: Tags, roles: ['MANAGER'] },
      { label: 'Bentuk Sediaan', path: '/bentuk-sediaan', icon: Scroll, roles: ['MANAGER'] },
      { label: 'Satuan', path: '/satuan', icon: Scale, roles: ['MANAGER'] },
      { label: 'Supplier', path: '/supplier', icon: Truck, roles: ['MANAGER'] },
    ],
  },
  {
    label: 'Stok',
    icon: Archive,
    items: [
      { label: 'Batch', path: '/batch', icon: Calendar, roles: ['MANAGER'] },
      { label: 'Stok', path: '/stok', icon: Archive, roles: ['MANAGER'] },
      { label: 'Mutasi Stok', path: '/mutasi-stok', icon: ArrowLeftRight, roles: ['MANAGER'] },
    ],
  },
  {
    label: 'Pembelian',
    icon: ShoppingBag,
    items: [
      { label: 'Pemesanan', path: '/pemesanan', icon: FilePlus2, roles: ['APOTEKER', 'MANAGER'] },
      { label: 'Pembelian', path: '/pembelian', icon: ShoppingBag, roles: ['MANAGER'] },
      { label: 'Retur Pembelian', path: '/retur-pembelian', icon: RotateCcw, roles: ['MANAGER'] },
    ],
  },
  {
    label: 'Laporan',
    icon: TrendingUp,
    items: [
      {
        label: 'Laporan Penjualan',
        path: '/laporan/penjualan',
        icon: TrendingUp,
        roles: ['MANAGER'],
      },
      {
        label: 'Laporan Laba',
        path: '/laporan/laba',
        icon: Coins,
        roles: ['MANAGER'],
      },
      { label: 'Export', path: '/export', icon: Share2, roles: ['MANAGER'] },
    ],
  },
  {
    label: 'Admin',
    icon: UserCog,
    items: [
      { label: 'Users', path: '/users', icon: UserCog, roles: ['MANAGER'] },
      { label: 'Audit Log', path: '/audit-log', icon: Scroll, roles: ['MANAGER'] },
      { label: 'Settings', path: '/settings', icon: Settings, roles: ['MANAGER'] },
    ],
  },
];

export function AppShell() {
  const publicSettings = useSettingsStore((state) => state.publicSettings);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.label, true])),
  );
  const [activeCollapsedGroup, setActiveCollapsedGroup] = useState<string | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Clock dynamic state
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!collapsed) setActiveCollapsedGroup(null);
  }, [collapsed]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const connection = useConnectionStatus();
  const allowedGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (user ? item.roles.includes(user.role) : false)),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
  };

  const isItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Helper to resolve current page title
  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard';
    for (const group of navGroups) {
      for (const item of group.items) {
        if (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) {
          return item.label;
        }
      }
    }
    return 'POS Apotek';
  };

  // Clock string formaters in Makassar WITA timezone
  const timeString = time.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateString = time.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50/50 bg-grid-pattern text-slate-900">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50 transition active:scale-95"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <ConnectionStatusIndicator status={connection.status} />
          <div className="text-sm font-bold tracking-tight text-gradient">{publicSettings?.app?.applicationName || 'POS Apotek'}</div>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Sidebar with Dark Background */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-800 bg-[#0b192c] text-slate-300 transition-all duration-300 ease-out lg:translate-x-0 flex flex-col ${
          collapsed ? 'w-20' : 'w-72'
        } ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-5 bg-[#081322]">
          {collapsed ? (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981] text-white font-heading font-black text-sm tracking-tighter shadow-md">
              {publicSettings?.branding?.sidebarLogoPath || publicSettings?.branding?.logoPath ? (
                <img src={publicSettings.branding.sidebarLogoPath || publicSettings.branding.logoPath} alt="Logo" className="h-6 w-6 object-contain" />
              ) : (
                publicSettings?.app?.shortName || 'AR'
              )}
            </div>
          ) : (
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#10b981] text-white shadow-xs">
                {publicSettings?.branding?.sidebarLogoPath || publicSettings?.branding?.logoPath ? (
                  <img src={publicSettings.branding.sidebarLogoPath || publicSettings.branding.logoPath} alt="Logo" className="h-6 w-6 object-contain" />
                ) : (
                  <Plus size={16} className="stroke-[3]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight text-white truncate">{publicSettings?.pharmacy?.pharmacyName || 'Apotek Risyah'}</div>
                <div className="text-[10px] text-slate-400 font-medium tracking-wide">{publicSettings?.app?.applicationName || 'POS Apotek'}</div>
              </div>
            </div>
          )}
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav scroll area container */}
        <div className="relative flex-1 min-h-0">
          <nav 
            className="h-full overflow-y-auto p-4 scrollbar-thin flex flex-col gap-3.5"
            onScroll={() => setActiveCollapsedGroup(null)}
          >
            <div className="space-y-3">
              {allowedGroups.map((group) => {
                const isGroupActive = group.items.some((item) => isItemActive(item.path));

                if (collapsed) {
                  const GroupIcon = group.icon || Home;
                  const isPopoverOpen = activeCollapsedGroup === group.label;
                  return (
                    <div key={group.label} className="relative flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (isPopoverOpen) {
                            setActiveCollapsedGroup(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverStyle({
                              top: Math.max(16, rect.top),
                              left: rect.right + 8,
                            });
                            setActiveCollapsedGroup(group.label);
                          }
                        }}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 ${
                          isGroupActive || isPopoverOpen
                            ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-400 shadow-xs'
                            : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        title={group.label}
                      >
                        <GroupIcon size={20} />
                      </button>

                      {isPopoverOpen && createPortal(
                        <div 
                          className="fixed z-50 w-56 rounded-xl border border-slate-800 bg-[#0e213b] p-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-200"
                          style={popoverStyle}
                        >
                          <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1.5 flex items-center justify-between">
                            {group.label}
                            <button
                              type="button"
                              onClick={() => setActiveCollapsedGroup(null)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="space-y-0.5">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = isItemActive(item.path);
                              return (
                                <NavLink
                                  key={item.path}
                                  to={item.path}
                                  onClick={() => {
                                    setActiveCollapsedGroup(null);
                                    setOpen(false);
                                  }}
                                  className={`flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                                    isActive
                                      ? 'bg-emerald-600 text-white font-semibold'
                                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                  }`}
                                >
                                  <Icon size={16} className="shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>,
                        document.body
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={group.label}
                    className={`rounded-xl border transition-all duration-200 ${
                      isGroupActive
                        ? 'border-slate-800 bg-[#0e213b]/30'
                        : 'border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      className={`flex min-h-9 w-full items-center justify-between rounded-lg px-3.5 text-left text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
                        isGroupActive
                          ? 'text-emerald-400'
                          : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                      }`}
                      onClick={() => toggleGroup(group.label)}
                      aria-expanded={openGroups[group.label]}
                      aria-label={`Buka/tutup grup ${group.label}`}
                    >
                      <span className="truncate">{group.label}</span>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 transition-transform duration-200 ${
                          openGroups[group.label] ? '' : '-rotate-90'
                        }`}
                      />
                    </button>
                    {openGroups[group.label] ? (
                      <div className="space-y-0.5 px-1.5 pb-2.5 pt-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setOpen(false)}
                              className={({ isActive }) =>
                                `flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                                  isActive
                                    ? 'bg-[#10b981] text-white shadow-md font-semibold'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`
                              }
                            >
                              <Icon size={18} className="shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>
          {/* Gradient fade indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0b192c] to-transparent pointer-events-none z-10" />
        </div>

        {/* User profile pinned bottom */}
        <div className="shrink-0 border-t border-slate-800 p-4 bg-[#081322]">
          {collapsed ? (
            <div className="flex flex-col items-center">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-xs font-bold text-white shadow-xs uppercase tracking-wider overflow-hidden"
                title={`${user?.name} (${user?.username})`}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.substring(0, 2) || 'US'
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleLogout}
                className="!h-9 !w-9 !p-0 mt-3 flex items-center justify-center active:scale-95 !bg-slate-800 !border-slate-700 !text-slate-300 hover:!bg-slate-700 hover:!text-white"
                title="Keluar Sesi"
              >
                <LogOut size={14} />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 px-1.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-xs font-bold text-white shadow-xs uppercase tracking-wider overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.substring(0, 2) || 'US'
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="truncate text-xs font-bold text-white tracking-tight">{user?.name}</div>
                  <div className="truncate text-[10px] text-slate-400 font-medium">{user?.username}</div>
                </div>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                fullWidth 
                onClick={handleLogout} 
                className="!h-9 text-xs gap-1.5 !bg-slate-800 !border-slate-700 !text-slate-300 hover:!bg-slate-700 hover:!text-white"
              >
                <LogOut size={14} />
                Keluar Sesi
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Modern ERP-style Header */}
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md lg:flex shadow-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition active:scale-95"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <h2 className="text-lg font-bold text-slate-900 capitalize tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          {/* Global Smart Search */}
          <div className="relative hidden max-w-md w-80 xl:w-96 md:block">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-4">
            <ConnectionStatusIndicator status={connection.status} />

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Clock in Makassar WITA timezone */}
            <div className="hidden flex-col items-end border-l border-slate-200 pl-4 sm:flex">
              <span className="text-sm font-bold text-slate-900 tabular-nums">{timeString}</span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">{dateString}</span>
            </div>

            {/* Profile Menu */}
            <UserProfileMenu />
          </div>
        </div>

        {connection.isOffline ? (
          <div className="sticky top-16 z-20 border-b border-red-200 bg-red-50/90 px-4 py-2.5 text-sm font-semibold text-red-700 backdrop-blur-xs lg:px-8">
            Koneksi Terputus: Server lokal tidak terhubung. Periksa jaringan Anda.
          </div>
        ) : null}
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
