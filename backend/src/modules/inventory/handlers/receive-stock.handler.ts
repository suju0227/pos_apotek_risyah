import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReceiveStockCommand } from '../commands/receive-stock.command';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@CommandHandler(ReceiveStockCommand)
export class ReceiveStockHandler implements ICommandHandler<ReceiveStockCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ReceiveStockCommand): Promise<string> {
    const {
      productId,
      batchNumber,
      expiredAt,
      quantity,
      unitCostRaw,
      purchaseId,
      storageLocationId,
      metadata,
      userId,
    } = command;

    const unitCostRawDecimal = new Prisma.Decimal(unitCostRaw);
    const qtyDecimal = new Prisma.Decimal(quantity);

    // Jalankan dalam transaction untuk menjamin Dual-Write ACID
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Cari apakah ada batch aktif dengan nomor yang sama untuk produk ini
      let batch = await tx.productBatch.findFirst({
        where: {
          productId,
          batchNumber,
          isActive: true,
          deletedAt: null,
        },
      });

      let qtyBefore = new Prisma.Decimal(0);

      if (batch) {
        qtyBefore = batch.currentStockBase;
        // Update batch yang sudah ada
        batch = await tx.productBatch.update({
          where: { id: batch.id },
          data: {
            currentStockBase: batch.currentStockBase.plus(qtyDecimal),
            // Update harga beli modal terakhir jika masuk stock baru
            hppBase: unitCostRawDecimal,
            costModalBase: unitCostRawDecimal,
          },
        });
      } else {
        // Buat batch baru
        batch = await tx.productBatch.create({
          data: {
            productId,
            batchNumber,
            expiredDate: expiredAt,
            initialStockBase: qtyDecimal,
            currentStockBase: qtyDecimal,
            hppBase: unitCostRawDecimal,
            costModalBase: unitCostRawDecimal,
            purchaseId: purchaseId || null,
            isActive: true,
          },
        });
      }

      const qtyAfter = qtyBefore.plus(qtyDecimal);

      // 2. Tulis record Immutable Ledger ke StockMutation
      const mutation = await tx.stockMutation.create({
        data: {
          productId,
          batchId: batch.id,
          createdById: userId,
          movementType: 'IN',
          referenceType: purchaseId ? 'PURCHASE' : 'OPENING_BALANCE',
          referenceId: purchaseId || null,
          qtyBefore,
          qtyChange: qtyDecimal,
          qtyAfter,
          metadata: metadata as any,
        },
      });

      return mutation.id;
    });
  }
}
