import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommitOutboundStockCommand } from '../commands/commit-outbound-stock.command';
import { PrismaService } from '../../../database/prisma.service';
import { allocateFEFO } from '../fefo.engine';
import { Prisma } from '@prisma/client';

@CommandHandler(CommitOutboundStockCommand)
export class CommitOutboundStockHandler
  implements ICommandHandler<CommitOutboundStockCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CommitOutboundStockCommand): Promise<string[]> {
    const { productId, quantity, referenceId, referenceType, metadata, userId } = command;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Ambil semua batch aktif untuk produk ini, di-sort berdasarkan FEFO (expired_date ASC, created_at ASC)
      // Gunakan locking (select for update) untuk mencegah race condition / double-spend stok
      const batches = await tx.$queryRaw<
        Array<{
          id: string;
          batch_number: string;
          expired_date: Date;
          current_stock_base: number;
          hpp_base: number;
        }>
      >`
        SELECT id, batch_number, expired_date, 
               CAST(current_stock_base AS double precision) as current_stock_base,
               CAST(hpp_base AS double precision) as hpp_base
        FROM product_batches
        WHERE product_id = ${productId}::uuid
          AND is_active = true
          AND deleted_at IS NULL
          AND current_stock_base > 0
        ORDER BY expired_date ASC, created_at ASC
        FOR UPDATE
      `;

      // Map raw SQL result ke FEFO engine format
      const batchesForEngine = batches.map((b) => ({
        id: b.id,
        batchNumber: b.batch_number,
        expiredDate: b.expired_date,
        currentStockBase: new Prisma.Decimal(b.current_stock_base),
        hppBase: new Prisma.Decimal(b.hpp_base),
      }));

      // 2. Alokasikan stok menggunakan pure FEFO engine
      const allocations = allocateFEFO(batchesForEngine, quantity, productId);

      const mutationIds: string[] = [];

      // 3. Update stock_remaining & tulis mutation ledger untuk tiap alokasi batch
      for (const alloc of allocations) {
        const qtyAllocatedDecimal = new Prisma.Decimal(alloc.allocatedQty);

        // Ambil data batch terbaru untuk hitung qtyBefore & qtyAfter
        const batch = await tx.productBatch.findUniqueOrThrow({
          where: { id: alloc.batchId },
        });

        const qtyBefore = batch.currentStockBase;
        const qtyAfter = qtyBefore.minus(qtyAllocatedDecimal);

        // Update Running Summary
        await tx.productBatch.update({
          where: { id: alloc.batchId },
          data: {
            currentStockBase: qtyAfter,
          },
        });

        // Simpan alokasi batch jika transaksi ini adalah penjualan pelanggan
        if (referenceType === 'SALE') {
          // Hitung proporsi diskon dan subtotal alokasi
          const subtotalAllocation = qtyAllocatedDecimal.mul(batch.hppBase); // Default subtotal snapshot
          const profit = new Prisma.Decimal(0); // Dihitung di service jika penjualan, default 0 untuk level ini

          await tx.saleBatchAllocation.create({
            data: {
              saleItemId: referenceId, // referenceId berisi ID detail transaksi/item penjualan
              batchId: alloc.batchId,
              batchNumber: alloc.batchNumber,
              expiredDate: alloc.expiredAt,
              qtyBase: qtyAllocatedDecimal,
              hppBaseSnapshot: batch.hppBase,
              subtotal: subtotalAllocation,
              discountAmount: new Prisma.Decimal(0),
              profitAmount: profit,
            },
          });
        }

        // Tulis Ledger
        const mutation = await tx.stockMutation.create({
          data: {
            productId,
            batchId: alloc.batchId,
            createdById: userId,
            movementType: 'OUT',
            referenceType: referenceType === 'SALE' ? 'SALE' : 'SALE_RETURN',
            referenceId: referenceId,
            qtyBefore,
            qtyChange: qtyAllocatedDecimal.negated(),
            qtyAfter,
            metadata: {
              ...metadata,
              allocatedFromBatch: alloc.batchNumber,
              unitCostAtAllocation: batch.hppBase.toString(),
            } as any,
          },
        });

        mutationIds.push(mutation.id);
      }

      return mutationIds;
    });
  }
}
