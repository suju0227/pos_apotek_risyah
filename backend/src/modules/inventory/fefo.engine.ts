import { Prisma } from '@prisma/client';
import { FEFOAllocation } from './types/fefo-allocation.type';
import { InsufficientStockException } from './exceptions/insufficient-stock.exception';

type BatchForFEFO = {
  id: string;
  batchNumber: string;
  expiredDate: Date;
  currentStockBase: Prisma.Decimal;
  hppBase: Prisma.Decimal;
};

/**
 * Pure FEFO allocation algorithm.
 *
 * Input batches HARUS sudah di-sort dari DB:
 *   ORDER BY expired_date ASC, created_at ASC
 *
 * Engine tidak melakukan sorting sendiri — ia hanya mengonsumsi
 * urutan yang diberikan, sehingga mudah di-test dan tidak bergantung
 * pada implementasi DB.
 *
 * Setiap alokasi batch menghasilkan satu FEFOAllocation.
 * Total allocatedQty dijamin sama dengan requestedQty.
 *
 * Throws InsufficientStockException jika stok tidak cukup.
 */
export function allocateFEFO(
  batches: BatchForFEFO[],
  requestedQty: number,
  productId: string,
): FEFOAllocation[] {
  const allocations: FEFOAllocation[] = [];
  let remaining = requestedQty;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const available = batch.currentStockBase.toNumber();
    if (available <= 0) continue;

    const take = Math.min(available, remaining);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiredAt: batch.expiredDate,
      allocatedQty: take,
      unitCostRaw: batch.hppBase,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    const totalAvailable = batches.reduce(
      (sum, b) => sum + b.currentStockBase.toNumber(),
      0,
    );
    throw new InsufficientStockException(productId, requestedQty, totalAvailable);
  }

  return allocations;
}
