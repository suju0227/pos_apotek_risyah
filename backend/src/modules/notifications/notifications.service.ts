import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/types/auth-user';

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

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(user: AuthUser): Promise<AppNotification[]> {
    const role = user.role;
    const now = new Date();
    const notificationList: AppNotification[] = [];

    // Calculate start of operational day today in Asia/Makassar (UTC+8)
    const makassarOffsetMs = 8 * 60 * 60 * 1000;
    const makassarNow = new Date(now.getTime() + makassarOffsetMs);
    const today = new Date(
      Date.UTC(
        makassarNow.getUTCFullYear(),
        makassarNow.getUTCMonth(),
        makassarNow.getUTCDate(),
      ) - makassarOffsetMs,
    );

    // 1. Stock Query (Critical Stock)
    const lowStockQuery = this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        baseUnit: true,
        batches: {
          where: {
            isActive: true,
            deletedAt: null,
            expiredDate: { gte: today },
          },
        },
      },
    });

    // 2. Expiring Batches (within 90 days)
    const alertUntil = new Date(today);
    alertUntil.setUTCDate(alertUntil.getUTCDate() + 90);
    const expiringBatchesQuery = this.prisma.productBatch.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        currentStockBase: { gt: 0 },
        expiredDate: { lte: alertUntil },
        product: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: { product: true },
    });

    // 3. PO Query (SENT or PARTIALLY_RECEIVED)
    const latePoQuery = this.prisma.purchaseOrder.findMany({
      where: {
        deletedAt: null,
        status: { in: ['SENT', 'PARTIALLY_RECEIVED'] },
      },
      include: { supplier: true },
    });

    // 4. Prescriptions Query (Operational)
    const prescriptionsQuery = this.prisma.prescription.findMany({
      where: {
        deletedAt: null,
        status: { in: ['READY_FOR_PAYMENT', 'NEED_CONFIRMATION'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    // 5. Audit Logs (only for MANAGER)
    const auditLogsQuery =
      role === 'MANAGER'
        ? this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: { user: true },
          })
        : Promise.resolve([]);

    // 6. Backup Warning check (only for MANAGER or PEMILIK)
    const latestBackupLogQuery =
      role === 'MANAGER' || role === 'PEMILIK'
        ? this.prisma.auditLog.findFirst({
            where: {
              action: {
                contains: 'backup',
                mode: 'insensitive',
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve(null);

    const [products, batches, pos, prescriptions, auditLogs, latestBackupLog] =
      await Promise.all([
        lowStockQuery,
        expiringBatchesQuery,
        latePoQuery,
        prescriptionsQuery,
        auditLogsQuery,
        latestBackupLogQuery,
      ]);

    // --- Dynamic Synthesis ---

    // A. Stok Kritis
    products.forEach((product) => {
      const stockSum = product.batches.reduce(
        (sum, b) => sum + Number(b.currentStockBase),
        0,
      );
      const minStock = Number(product.minStockBase);
      if (stockSum <= minStock) {
        notificationList.push({
          id: `stock-${product.id}`,
          type: 'stock',
          priority: stockSum === 0 ? 'critical' : 'high',
          title: `Stok Kritis: ${product.name}`,
          message: `Tersisa ${stockSum} ${product.baseUnit?.symbol ?? 'satuan'} (Batas minimum: ${minStock} ${product.baseUnit?.symbol ?? 'satuan'})`,
          createdAt: now.toISOString(),
          path: '/produk',
          referenceNumber: product.code,
        });
      }
    });

    // B. Batch Expired
    batches.forEach((batch) => {
      const exp = new Date(batch.expiredDate);
      const diffMs = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        notificationList.push({
          id: `batch-expired-${batch.id}`,
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
          id: `batch-warning-${batch.id}`,
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

    // C. PO Terlambat
    pos.forEach((po) => {
      const orderDate = new Date(po.orderDate);
      const limitDate = new Date(
        orderDate.getTime() + 3 * 24 * 60 * 60 * 1000,
      );
      if (now > limitDate) {
        const diffDays = Math.ceil(
          (now.getTime() - limitDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        notificationList.push({
          id: `po-late-${po.id}`,
          type: 'purchase',
          priority: 'high',
          title: 'Pemesanan Terlambat',
          message: `PO ${po.poNumber} ke ${po.supplier?.name ?? 'Supplier'} terlambat ${diffDays} hari.`,
          createdAt: po.createdAt.toISOString(),
          path: `/pemesanan`,
          referenceNumber: po.poNumber,
        });
      }
    });

    // D. Operational Prescriptions
    prescriptions.forEach((prescription) => {
      if (prescription.status === 'READY_FOR_PAYMENT') {
        notificationList.push({
          id: `prescription-ready-${prescription.id}`,
          type: 'operational',
          priority: 'medium',
          title: 'Resep Siap Bayar',
          message: `Resep ${prescription.prescriptionNumber} untuk pasien ${prescription.patientName} siap diproses di kasir.`,
          createdAt: prescription.updatedAt.toISOString(),
          path: '/kasir',
          referenceNumber: prescription.prescriptionNumber,
        });
      } else if (prescription.status === 'NEED_CONFIRMATION') {
        notificationList.push({
          id: `prescription-confirm-${prescription.id}`,
          type: 'operational',
          priority: 'high',
          title: 'Resep Butuh Konfirmasi',
          message: `Resep ${prescription.prescriptionNumber} untuk pasien ${prescription.patientName} butuh konfirmasi apoteker.`,
          createdAt: prescription.updatedAt.toISOString(),
          path: '/pelayanan/resep',
          referenceNumber: prescription.prescriptionNumber,
        });
      }
    });

    // E. System Audit Logs (only for MANAGER)
    if (role === 'MANAGER') {
      auditLogs.forEach((log) => {
        const logAction = log.action.toLowerCase();
        let priority: AppNotification['priority'] = 'info';
        let title = 'Aktivitas Pengguna';
        let message = `${log.action} oleh ${log.user?.name ?? 'Sistem'}`;

        if (logAction.includes('login') && !logAction.includes('failed')) {
          title = 'Login Pengguna';
          message = `User ${log.user?.name ?? 'Sistem'} login.`;
          priority = 'info';
        } else if (logAction.includes('logout')) {
          title = 'Logout Pengguna';
          message = `User ${log.user?.name ?? 'Sistem'} logout.`;
          priority = 'info';
        } else if (
          logAction.includes('price') ||
          logAction.includes('harga') ||
          logAction.includes('selling_price') ||
          logAction.includes('sellingprice')
        ) {
          title = 'Perubahan Harga';
          message = `Harga diubah oleh ${log.user?.name ?? 'Sistem'}.`;
          priority = 'medium';
        } else if (
          logAction.includes('create') &&
          (logAction.includes('product') || logAction.includes('produk'))
        ) {
          title = 'Produk Baru';
          message = `Produk baru ditambahkan oleh ${log.user?.name ?? 'Sistem'}.`;
          priority = 'success';
        } else if (
          logAction.includes('failed') ||
          logAction.includes('unauthorized') ||
          logAction.includes('gagal')
        ) {
          title = 'Audit Keamanan';
          message = `Gagal login dari IP ${log.ipAddress || 'unknown'}`;
          priority = 'critical';
        }

        notificationList.push({
          id: `audit-${log.id}`,
          type: 'system',
          priority,
          title,
          message,
          createdAt: log.createdAt.toISOString(),
          path: '/audit-log',
        });
      });
    }

    // F. Database Backup Warning (for MANAGER and PEMILIK)
    if (role === 'MANAGER' || role === 'PEMILIK') {
      if (
        !latestBackupLog ||
        now.getTime() - new Date(latestBackupLog.createdAt).getTime() >
          24 * 60 * 60 * 1000
      ) {
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

    // --- Role-Based Filtering ---
    let filteredList = notificationList;

    if (role === 'KASIR') {
      filteredList = notificationList.filter((notif) => {
        if (notif.type === 'stock') {
          return notif.id.startsWith('stock-');
        }
        if (notif.type === 'operational') {
          return notif.id.startsWith('prescription-ready-');
        }
        return false;
      });
    } else if (role === 'APOTEKER') {
      filteredList = notificationList.filter((notif) => {
        if (notif.type === 'stock') {
          return (
            notif.id.startsWith('stock-') || notif.id.startsWith('batch-')
          );
        }
        if (notif.type === 'operational') {
          return notif.id.startsWith('prescription-');
        }
        return false;
      });
    } else if (role === 'PEMILIK') {
      // Excludes audit activity (system category notifications starting with 'audit-')
      filteredList = notificationList.filter((notif) => {
        return !notif.id.startsWith('audit-');
      });
    } else if (role === 'MANAGER') {
      // Manager gets everything
      filteredList = notificationList;
    }

    // Sort notifications: Priority (critical > high > medium > info > success) then Date desc
    const priorityWeights: Record<AppNotification['priority'], number> = {
      critical: 5,
      high: 4,
      medium: 3,
      info: 2,
      success: 1,
    };

    return filteredList.sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
