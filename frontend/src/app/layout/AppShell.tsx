import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Stethoscope,
  Undo2,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/auth.store';
import type { RoleName } from '../../features/auth/auth.types';
import { Button } from '../../shared/components/Button';

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: RoleName[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['MANAGER'] },
  { label: 'Kasir', path: '/kasir', icon: ShoppingCart, roles: ['KASIR', 'MANAGER'] },
  {
    label: 'Riwayat Transaksi',
    path: '/riwayat-transaksi',
    icon: Receipt,
    roles: ['KASIR', 'MANAGER'],
  },
  {
    label: 'Retur Penjualan',
    path: '/retur-penjualan',
    icon: Undo2,
    roles: ['KASIR', 'MANAGER'],
  },
  { label: 'Produk', path: '/produk', icon: Package, roles: ['MANAGER'] },
  { label: 'Kategori', path: '/kategori', icon: Boxes, roles: ['MANAGER'] },
  { label: 'Supplier', path: '/supplier', icon: Warehouse, roles: ['MANAGER'] },
  { label: 'Satuan', path: '/satuan', icon: ClipboardList, roles: ['MANAGER'] },
  { label: 'Batch', path: '/batch', icon: Boxes, roles: ['MANAGER'] },
  { label: 'Pemesanan', path: '/pemesanan', icon: FileText, roles: ['MANAGER'] },
  { label: 'Pembelian', path: '/pembelian', icon: ClipboardList, roles: ['MANAGER'] },
  { label: 'Stok', path: '/stok', icon: Warehouse, roles: ['MANAGER'] },
  { label: 'Mutasi Stok', path: '/mutasi-stok', icon: BarChart3, roles: ['MANAGER'] },
  {
    label: 'Resep',
    path: '/pelayanan/resep',
    icon: Stethoscope,
    roles: ['APOTEKER', 'MANAGER'],
  },
  {
    label: 'Konseling',
    path: '/pelayanan/konseling',
    icon: Stethoscope,
    roles: ['APOTEKER', 'MANAGER'],
  },
  {
    label: 'Laporan Penjualan',
    path: '/laporan/penjualan',
    icon: BarChart3,
    roles: ['MANAGER'],
  },
  {
    label: 'Laporan Laba',
    path: '/laporan/laba',
    icon: BarChart3,
    roles: ['MANAGER'],
  },
  { label: 'Export', path: '/export', icon: FileDown, roles: ['MANAGER'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['MANAGER'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['MANAGER'] },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const allowedItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-slate-200"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
        <div className="text-sm font-semibold">POS Apotek</div>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <div className="text-sm font-bold">POS Apotek Risyah</div>
            <div className="text-xs text-slate-500">{user?.role}</div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="mt-auto border-t border-slate-200 pt-3">
            <div className="mb-3 px-3 text-xs text-slate-500">
              <div className="font-medium text-slate-700">{user?.name}</div>
              <div>{user?.username}</div>
            </div>
            <Button type="button" variant="secondary" fullWidth onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </nav>
      </aside>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
