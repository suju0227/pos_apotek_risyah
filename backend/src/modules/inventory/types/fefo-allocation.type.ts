import { Prisma } from '@prisma/client';

export type FEFOAllocation = {
  batchId: string;
  batchNumber: string;
  expiredAt: Date;
  allocatedQty: number;
  unitCostRaw: Prisma.Decimal;
};

export type StockAvailability = {
  productId: string;
  totalAvailable: number;
  batches: Array<{
    batchId: string;
    batchNumber: string;
    expiredAt: Date;
    qtyRemaining: number;
  }>;
};
