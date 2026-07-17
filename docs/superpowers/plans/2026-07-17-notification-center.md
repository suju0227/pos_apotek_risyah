# Notification Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun Notification Center real-time berbasis peran (RBAC) pada header dashboard POS Apotek V2 dengan polling 15s dan local storage status.

**Architecture:** Notifikasi disintesis secara dinamis dari database riil (stok kritis, batch expired, PO telat, audit log login/harga) oleh NestJS backend dan difilter sesuai role pengguna. Status baca/hapus dilacak di sisi klien melalui LocalStorage.

**Tech Stack:** NestJS, Prisma ORM, React, Lucide Icons, LocalStorage, TanStack Query.

## Global Constraints
- Minimalis dan YAGNI: State dikelola dinamis di backend dan local storage di frontend tanpa migrasi DB.
- Keamanan: Data disaring di backend sebelum dikirim ke pengguna sesuai perannya (RBAC).

---

### Task 1: Backend Notifications Service & Controller

**Files:**
- Create: `backend/src/modules/notifications/notifications.service.ts`
- Create: `backend/src/modules/notifications/notifications.controller.ts`
- Create: `backend/src/modules/notifications/notifications.module.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- `GET /api/notifications` -> Menerima JWT Token, mengembalikan list notifikasi terpolarisasi role.

- [ ] **Step 1: Create `notifications.service.ts`**
  Tulis kode untuk mengambil data low stock, expired batches, late POs, dan audit logs, lalu kelompokkan.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/types/auth-user';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(user: AuthUser) {
    const role = user.role;
    const now = new Date();
    const notificationList: any[] = [];

    const promises: Promise<any>[] = [];

    // 1. Stock & Expiring Batches Queries
    const lowStockPromise = this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: { baseUnit: true, batches: { where: { isActive: true, deletedAt: null } } },
    });
    promises.push(lowStockPromise);

    const expiringBatchesPromise = this.prisma.productBatch.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        currentStockBase: { gt: 0 },
        expiredDate: { lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
      },
      include: { product: true },
    });
    promises.push(expiringBatchesPromise);

    // 2. PO Query (SENT or PARTIALLY_RECEIVED)
    const latePoPromise = this.prisma.purchaseOrder.findMany({
      where: {
        deletedAt: null,
        status: { in: ['SENT', 'PARTIALLY_RECEIVED'] },
      },
      include: { supplier: true },
    });
    promises.push(latePoPromise);

    // 3. Audit Logs (if Manager/Pemilik)
    let auditLogPromise = Promise.resolve([]);
    if (role === 'MANAGER' || role === 'PEMILIK') {
      auditLogPromise = this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { user: true },
      });
    }
    promises.push(auditLogPromise);

    const [products, batches, pos, auditLogs] = await Promise.all(promises);

    // Dynamic Synthesis
    // A. Stok Kritis
    if (role === 'KASIR' || role === 'APOTEKER' || role === 'MANAGER' || role === 'PEMILIK') {
      products.forEach((product) => {
        const stockSum = product.batches.reduce((sum, b) => sum + Number(b.currentStockBase), 0);
        const minStock = Number(product.minStockBase);
        if (stockSum <= minStock) {
          notificationList.push({
            id: `stock-${product.id}`,
            type: 'stock',
            priority: stockSum === 0 ? 'critical' : 'high',
            title: `Stok Kritis: ${product.name}`,
            message: `Tersisa ${stockSum} ${product.baseUnit?.symbol ?? 'satuan'} (Min: ${minStock})`,
            createdAt: now.toISOString(),
            path: '/produk',
            referenceNumber: product.code,
          });
        }
      });
    }

    // B. Batch Expired
    if (role === 'APOTEKER' || role === 'MANAGER' || role === 'PEMILIK') {
      batches.forEach((batch) => {
        const exp = new Date(batch.expiredDate);
        const diffMs = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          notificationList.push({
            id: `batch-exp-${batch.id}`,
            type: 'stock',
            priority: 'critical',
            title: `Batch Kedaluwarsa`,
            message: `Produk ${batch.product.name} (Batch: ${batch.batchNumber}) sudah kedaluwarsa!`,
            createdAt: batch.createdAt.toISOString(),
            path: '/batch',
            referenceNumber: batch.batchNumber,
          });
        } else if (diffDays <= 30) {
          notificationList.push({
            id: `batch-soon-${batch.id}`,
            type: 'stock',
            priority: 'critical',
            title: `Batch Segera Kedaluwarsa`,
            message: `Produk ${batch.product.name} (Batch: ${batch.batchNumber}) kedaluwarsa dalam ${diffDays} hari!`,
            createdAt: batch.createdAt.toISOString(),
            path: '/batch',
            referenceNumber: batch.batchNumber,
          });
        } else {
          notificationList.push({
            id: `batch-info-${batch.id}`,
            type: 'stock',
            priority: 'medium',
            title: `Batch Mendekati Kedaluwarsa`,
            message: `Produk ${batch.product.name} (Batch: ${batch.batchNumber}) kedaluwarsa dalam ${diffDays} hari.`,
            createdAt: batch.createdAt.toISOString(),
            path: '/batch',
            referenceNumber: batch.batchNumber,
          });
        }
      });
    }

    // C. PO Terlambat
    if (role === 'MANAGER' || role === 'PEMILIK' || role === 'APOTEKER') {
      pos.forEach((po) => {
        const orderDate = new Date(po.orderDate);
        const limitDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        if (now > limitDate) {
          const diffDays = Math.ceil((now.getTime() - limitDate.getTime()) / (1000 * 60 * 60 * 24));
          notificationList.push({
            id: `po-late-${po.id}`,
            type: 'purchase',
            priority: 'high',
            title: 'Pemesanan Terlambat',
            message: `PO ${po.poNumber} ke ${po.supplier?.name} terlambat ${diffDays} hari.`,
            createdAt: po.createdAt.toISOString(),
            path: `/pemesanan`,
            referenceNumber: po.poNumber,
          });
        }
      });
    }

    // D. Audit Logs & System Notifications
    if (role === 'MANAGER' || role === 'PEMILIK') {
      auditLogs.forEach((log) => {
        const logAction = log.action.toLowerCase();
        let type = 'system';
        let priority = 'info';
        let title = 'Aktivitas Pengguna';

        if (logAction.includes('login')) {
          title = 'Login Pengguna';
          priority = 'info';
        } else if (logAction.includes('logout')) {
          title = 'Logout Pengguna';
          priority = 'info';
        } else if (logAction.includes('update') && logAction.includes('price')) {
          title = 'Perubahan Harga';
          priority = 'medium';
        } else if (logAction.includes('create') && logAction.includes('product')) {
          title = 'Produk Baru';
          priority = 'success';
        } else if (logAction.includes('failed') || logAction.includes('unauthorized')) {
          title = 'Audit Keamanan';
          priority = 'critical';
        }

        notificationList.push({
          id: `audit-${log.id}`,
          type,
          priority,
          title,
          message: `${log.action} oleh ${log.user?.name ?? 'Sistem'}`,
          createdAt: log.createdAt.toISOString(),
          path: '/audit-log',
        });
      });

      // E. Database Backup Warning
      const lastBackup = auditLogs.find((l) => l.action.toLowerCase().includes('backup'));
      if (!lastBackup || (now.getTime() - new Date(lastBackup.createdAt).getTime()) > 24 * 60 * 60 * 1000) {
        notificationList.push({
          id: 'system-backup-warning',
          type: 'system',
          priority: 'medium',
          title: 'Backup Database',
          message: 'Backup database belum dilakukan hari ini.',
          createdAt: now.toISOString(),
          path: '/settings',
        });
      }
    }

    return notificationList;
  }
}
```

- [ ] **Step 2: Create `notifications.controller.ts`**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getNotifications(user);
  }
}
```

- [ ] **Step 3: Create `notifications.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 4: Register in `app.module.ts`**
  Impor `NotificationsModule` dan masukkan ke `imports` di `backend/src/app.module.ts`.

---

### Task 2: Frontend Notification Hooks & Dropdown UI

**Files:**
- Create: `frontend/src/features/dashboard/components/NotificationCenter.tsx`
- Modify: `frontend/src/features/dashboard/dashboard.hooks.ts`
- Modify: `frontend/src/app/layout/AppShell.tsx`

- [ ] **Step 1: Add query hook in `dashboard.hooks.ts`**
  Tambahkan hook `useDashboardNotifications` di akhir file:

```typescript
export interface AppNotification {
  id: string;
  type: 'operational' | 'stock' | 'purchase' | 'system';
  priority: 'critical' | 'high' | 'medium' | 'info' | 'success';
  title: string;
  message: string;
  createdAt: string;
  path?: string;
  referenceNumber?: string;
}

export function useDashboardNotifications() {
  return useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: async () => {
      const { apiClient } = await import('../../shared/api/apiClient');
      return await apiClient.get<AppNotification[]>('/notifications');
    },
    refetchInterval: 15_000, // Real-time Polling
    staleTime: 10_000,
  });
}
```

- [ ] **Step 2: Create `<NotificationCenter />` Dropdown**
  Implementasikan dropdown dengan Tab filter, tombol hapus, mark as read, copy reference, dan sinkronisasi LocalStorage.

```tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Clipboard,
  Trash2,
  X,
  AlertTriangle,
  Package,
  Clock,
  Database,
  Pill,
} from 'lucide-react';
import { useDashboardNotifications, AppNotification } from '../dashboard.hooks';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'operational' | 'stock' | 'purchase' | 'system'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local Storage states for tracking
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pos_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pos_deleted_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { data: rawNotifications = [], isLoading } = useDashboardNotifications();

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter notifications based on deleted list, Tab category, and Read status
  const visibleNotifications = rawNotifications
    .filter((n) => !deletedIds.includes(n.id))
    .filter((n) => activeTab === 'all' || n.type === activeTab)
    .filter((n) => {
      if (filterRead === 'unread') {
        return !readIds.includes(n.id);
      }
      return true;
    });

  const unreadCount = rawNotifications
    .filter((n) => !deletedIds.includes(n.id))
    .filter((n) => !readIds.includes(n.id)).length;

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem('pos_read_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const activeIds = rawNotifications.filter((n) => !deletedIds.includes(n.id)).map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...activeIds]));
    setReadIds(updated);
    localStorage.setItem('pos_read_notifications', JSON.stringify(updated));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...deletedIds, id];
    setDeletedIds(updated);
    localStorage.setItem('pos_deleted_notifications', JSON.stringify(updated));
  };

  const copyRefNumber = (num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-rose-500 bg-rose-50/40';
      case 'high':
        return 'border-amber-500 bg-amber-50/40';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50/40';
      case 'success':
        return 'border-emerald-500 bg-emerald-50/40';
      default:
        return 'border-blue-500 bg-blue-50/40';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <Package size={16} className="text-amber-500" />;
      case 'purchase':
        return <Database size={16} className="text-teal-500" />;
      case 'system':
        return <Clock size={16} className="text-slate-500" />;
      default:
        return <Pill size={16} className="text-purple-500" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = new Date().getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return d.toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar' });
    } catch {
      return '';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-slate-100"
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[420px] max-h-[600px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{unreadCount} Belum dibaca</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition"
              >
                Tandai Semua Dibaca
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 py-2.5 overflow-x-auto border-b border-slate-50 scrollbar-none shrink-0">
            {(['all', 'operational', 'stock', 'purchase', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition shrink-0 ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {tab === 'all' ? 'Semua' : tab === 'all' ? 'Semua' : tab}
              </button>
            ))}
          </div>

          {/* Unread vs All filter */}
          <div className="flex items-center gap-3 py-2 border-b border-slate-50 shrink-0">
            <button
              onClick={() => setFilterRead('all')}
              className={`text-[10px] font-bold ${filterRead === 'all' ? 'text-emerald-600 underline' : 'text-slate-400'}`}
            >
              Semua Notifikasi
            </button>
            <button
              onClick={() => setFilterRead('unread')}
              className={`text-[10px] font-bold ${filterRead === 'unread' ? 'text-emerald-600 underline' : 'text-slate-400'}`}
            >
              Belum Dibaca
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto py-2 divide-y divide-slate-50 scrollbar-thin max-h-[380px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-medium">
                <span className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
                Memuat notifikasi...
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium flex flex-col items-center">
                <span>Tidak ada notifikasi baru.</span>
                <span className="text-[10px] text-slate-300 font-semibold mt-1">Semua aktivitas berjalan normal.</span>
              </div>
            ) : (
              visibleNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.path) setIsOpen(false);
                    }}
                    className={`flex items-start justify-between gap-3 p-2.5 border-l-4 my-1 transition rounded-xl ${getPriorityColor(
                      notif.priority
                    )} ${!isRead ? 'bg-slate-50/80 font-semibold' : 'opacity-70'}`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{notif.title}</div>
                        <div className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">{notif.message}</div>
                        <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span>{timeAgo(notif.createdAt)}</span>
                          {notif.referenceNumber && (
                            <button
                              onClick={(e) => copyRefNumber(notif.referenceNumber!, e)}
                              className="text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 capitalize transition"
                              title="Salin No. Referensi"
                            >
                              <Clipboard size={10} />
                              Salin
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isRead && (
                        <button
                          onClick={(e) => markAsRead(notif.id, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white transition"
                          title="Tandai dibaca"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition"
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace static notification bell in `AppShell.tsx`**
  Impor `<NotificationCenter />` dan gantikan button bell static (sekitar baris 496) dengan `<NotificationCenter />` di `AppShell.tsx`.
