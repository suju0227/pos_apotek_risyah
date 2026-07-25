import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CompleteStockOpnameCommand } from '../commands/complete-stock-opname.command';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@CommandHandler(CompleteStockOpnameCommand)
export class CompleteStockOpnameHandler
  implements ICommandHandler<CompleteStockOpnameCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CompleteStockOpnameCommand): Promise<void> {
    const { opnameId, adjustments, metadata, userId } = command;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update status StockOpname ke COMPLETED
      await tx.stockOpname.update({
        where: { id: opnameId },
        data: {
          status: 'COMPLETED',
          verifiedById: userId,
          completedAt: new Date(),
        },
      });

      // 2. Loop setiap item opname
      for (const adj of adjustments) {
        const batch = await tx.productBatch.findUniqueOrThrow({
          where: { id: adj.batchId },
        });

        const qtyBefore = batch.currentStockBase;
        const qtyAfter = new Prisma.Decimal(adj.physicalQty);
        const difference = qtyAfter.minus(qtyBefore);

        // Jika tidak ada perbedaan, skip
        if (difference.equals(0)) {
          continue;
        }

        // Summary update: set currentStockBase ke jumlah fisik ril
        await tx.productBatch.update({
          where: { id: adj.batchId },
          data: {
            currentStockBase: qtyAfter,
          },
        });

        // Tulis Ledger
        const mutation = await tx.stockMutation.create({
          data: {
            productId: batch.productId,
            batchId: adj.batchId,
            createdById: userId,
            movementType: 'ADJUSTMENT',
            referenceType: 'OPNAME',
            referenceId: opnameId,
            qtyBefore,
            qtyChange: difference,
            qtyAfter,
            metadata: {
              ...metadata,
              physicalQtyCounted: adj.physicalQty.toString(),
              systemQtyOriginal: adj.systemQty.toString(),
              discrepancyDiff: difference.toString(),
            } as any,
          },
        });

        // Cari item stock opname untuk dihubungkan ke mutation id ini
        const opnameItem = await tx.stockOpnameItem.findFirst({
          where: {
            opnameId,
            batchId: adj.batchId,
          },
        });

        if (opnameItem) {
          await tx.stockOpnameItem.update({
            where: { id: opnameItem.id },
            data: {
              movementId: mutation.id,
            },
          });
        }
      }
    });
  }
}
