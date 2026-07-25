import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export type InventoryDrift = {
  batchId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  summaryQty: number;   // qty_remaining di ProductBatch
  ledgerQty: number;    // sum(qty_change) di StockMutation
  driftAmount: number;  // summaryQty - ledgerQty
};

@Injectable()
export class InventoryHealthService {
  private readonly logger = new Logger(InventoryHealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mendeteksi perbedaan (drift) antara running summary (ProductBatch.currentStockBase)
   * dan ledger historis (StockMutation) menggunakan Raw SQL berkinerja tinggi.
   */
  async checkDrift(): Promise<InventoryDrift[]> {
    const rawDrifts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        pb.id as "batchId",
        pb.batch_number as "batchNumber",
        pb.product_id as "productId",
        p.name as "productName",
        CAST(pb.current_stock_base AS double precision) as "summaryQty",
        CAST(COALESCE(SUM(sm.qty_change), 0) AS double precision) as "ledgerQty"
      FROM product_batches pb
      JOIN products p ON pb.product_id = p.id
      LEFT JOIN stock_mutations sm ON pb.id = sm.batch_id
      WHERE pb.deleted_at IS NULL
      GROUP BY pb.id, pb.batch_number, pb.product_id, p.name, pb.current_stock_base
      HAVING pb.current_stock_base <> COALESCE(SUM(sm.qty_change), 0)
    `;

    return rawDrifts.map((d) => ({
      batchId: d.batchId,
      batchNumber: d.batchNumber,
      productId: d.productId,
      productName: d.productName,
      summaryQty: d.summaryQty,
      ledgerQty: d.ledgerQty,
      driftAmount: Number((d.summaryQty - d.ledgerQty).toFixed(4)),
    }));
  }

  /**
   * Membangun ulang (rebuild) running summary ProductBatch berdasarkan
   * ledger mutasi StockMutation untuk memperbaiki drift yang ditemukan.
   * Aksi ini wajib berjalan dalam single database transaction.
   * Hanya boleh diakses oleh PEMILIK / MANAGER.
   */
  async rebuildSummary(userId: string): Promise<{ fixedCount: number }> {
    const drifts = await this.checkDrift();
    if (drifts.length === 0) {
      return { fixedCount: 0 };
    }

    this.logger.warn(
      `Mulai perbaikan drift stock summary. Ditemukan ${drifts.length} batch menyimpang. Dipicu oleh User ID: ${userId}`,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const drift of drifts) {
        // Update summaryQty di ProductBatch agar tepat bernilai jumlah sum(qty_change)
        await tx.productBatch.update({
          where: { id: drift.batchId },
          data: {
            currentStockBase: new Prisma.Decimal(drift.ledgerQty),
          },
        });

        this.logger.log(
          `Batch ${drift.batchNumber} (ID: ${drift.batchId}) diperbaiki. ` +
            `Sebelumnya: ${drift.summaryQty}, Di-rebuild menjadi: ${drift.ledgerQty} (Drift: ${drift.driftAmount})`,
        );
      }
    });

    return { fixedCount: drifts.length };
  }
}
