import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/types/auth-user';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, user: AuthUser) {
    const role = user.role;
    const q = query.trim();

    if (q.length < 2) {
      return {
        products: [],
        batches: [],
        transactions: [],
        purchaseOrders: [],
        suppliers: [],
        prescriptions: [],
        users: [],
      };
    }

    const promises: Record<string, Promise<any>> = {};

    // 1. PRODUCTS - KASIR, APOTEKER, MANAGER, PEMILIK
    if (role === 'KASIR' || role === 'APOTEKER' || role === 'MANAGER' || role === 'PEMILIK') {
      promises.products = this.prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { barcode: { contains: q, mode: 'insensitive' } },
            { genericName: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          baseUnit: true,
        },
        take: 5,
      });
    }

    // 2. BATCHES - KASIR, APOTEKER, MANAGER, PEMILIK
    if (role === 'KASIR' || role === 'APOTEKER' || role === 'MANAGER' || role === 'PEMILIK') {
      promises.batches = this.prisma.productBatch.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          batchNumber: { contains: q, mode: 'insensitive' },
        },
        include: {
          product: true,
        },
        take: 5,
      });
    }

    // 3. TRANSAKSI (SALES) - KASIR, MANAGER, PEMILIK
    if (role === 'KASIR' || role === 'MANAGER' || role === 'PEMILIK') {
      promises.transactions = this.prisma.sale.findMany({
        where: {
          deletedAt: null,
          saleNumber: { contains: q, mode: 'insensitive' },
        },
        include: {
          cashier: true,
        },
        take: 5,
      });
    }

    // 4. PURCHASE ORDERS - MANAGER, PEMILIK
    if (role === 'MANAGER' || role === 'PEMILIK') {
      promises.purchaseOrders = this.prisma.purchaseOrder.findMany({
        where: {
          deletedAt: null,
          poNumber: { contains: q, mode: 'insensitive' },
        },
        include: {
          supplier: true,
        },
        take: 5,
      });
    }

    // 5. SUPPLIERS - APOTEKER, MANAGER, PEMILIK
    if (role === 'APOTEKER' || role === 'MANAGER' || role === 'PEMILIK') {
      promises.suppliers = this.prisma.supplier.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
      });
    }

    // 6. RESEP - KASIR, APOTEKER, MANAGER, PEMILIK
    if (role === 'KASIR' || role === 'APOTEKER' || role === 'MANAGER' || role === 'PEMILIK') {
      const statusFilter = role === 'KASIR' 
        ? { status: 'READY_FOR_PAYMENT' } 
        : {};

      promises.prescriptions = this.prisma.prescription.findMany({
        where: {
          deletedAt: null,
          ...statusFilter,
          OR: [
            { prescriptionNumber: { contains: q, mode: 'insensitive' } },
            { patientName: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });
    }

    // 7. USERS - MANAGER and PEMILIK
    if (role === 'MANAGER' || role === 'PEMILIK') {
      promises.users = this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          role: true,
        },
        take: 5,
      });
    }

    // Run queries in parallel
    const keys = Object.keys(promises);
    const results = await Promise.all(Object.values(promises));

    const searchResult: any = {
      products: [],
      batches: [],
      transactions: [],
      purchaseOrders: [],
      suppliers: [],
      prescriptions: [],
      users: [],
    };

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const data = results[i];

      if (key === 'products') {
        searchResult.products = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          barcode: item.barcode,
          unit: item.baseUnit?.symbol ?? item.baseUnit?.name ?? '',
        }));
      } else if (key === 'batches') {
        searchResult.batches = data.map((item: any) => ({
          id: item.id,
          batchNumber: item.batchNumber,
          productName: item.product?.name ?? '',
          expiredDate: item.expiredDate ? item.expiredDate.toISOString().slice(0, 10) : '',
        }));
      } else if (key === 'transactions') {
        searchResult.transactions = data.map((item: any) => ({
          id: item.id,
          saleNumber: item.saleNumber,
          grandTotal: Number(item.grandTotal),
          cashierName: item.cashier?.name ?? '',
          createdAt: item.createdAt.toISOString(),
        }));
      } else if (key === 'purchaseOrders') {
        searchResult.purchaseOrders = data.map((item: any) => ({
          id: item.id,
          poNumber: item.poNumber,
          supplierName: item.supplier?.name ?? '',
          status: item.status,
        }));
      } else if (key === 'suppliers') {
        searchResult.suppliers = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          address: item.address,
        }));
      } else if (key === 'prescriptions') {
        searchResult.prescriptions = data.map((item: any) => ({
          id: item.id,
          prescriptionNumber: item.prescriptionNumber,
          patientName: item.patientName,
          status: item.status,
        }));
      } else if (key === 'users') {
        searchResult.users = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          username: item.username,
          roleName: item.role?.name ?? '',
        }));
      }
    }

    return searchResult;
  }
}
