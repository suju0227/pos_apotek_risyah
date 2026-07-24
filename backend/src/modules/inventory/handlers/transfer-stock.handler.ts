import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransferStockCommand } from '../commands/transfer-stock.command';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@CommandHandler(TransferStockCommand)
export class TransferStockHandler implements ICommandHandler<TransferStockCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: TransferStockCommand): Promise<{ outboundMutationId: string; inboundMutationId: string }> {
    const {
      batchId,
      quantity,
      fromLocationId,
      toLocationId,
      transferId,
      metadata,
      userId,
    } = command;

    const qtyDecimal = new Prisma.Decimal(quantity);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const batch = await tx.productBatch.findUniqueOrThrow({
        where: { id: batchId },
      });

      const qtyBefore = batch.currentStockBase;
      const qtyAfter = qtyBefore.minus(qtyDecimal);

      // 1. Kurangi stock dari lokasi asal (Summary update)
      // Karena multi-gudang pada V1 disederhanakan, kita kurangi stok di batch asal
      await tx.productBatch.update({
        where: { id: batchId },
        data: {
          currentStockBase: qtyAfter,
        },
      });

      // 2. Buat batch baru di lokasi tujuan (Summary insert/update)
      // cari batch dengan nomor yang sama di lokasi tujuan jika ada (disimulasikan dengan active batch baru)
      const targetBatch = await tx.productBatch.create({
        data: {
          productId: batch.productId,
          batchNumber: batch.batchNumber,
          expiredDate: batch.expiredDate,
          initialStockBase: qtyDecimal,
          currentStockBase: qtyDecimal,
          hppBase: batch.hppBase,
          costModalBase: batch.costModalBase,
          isActive: true,
        },
      });

      // 3. Tulis mutasi OUT (Transfer Out)
      const outboundMutation = await tx.stockMutation.create({
        data: {
          productId: batch.productId,
          batchId: batch.id,
          createdById: userId,
          movementType: 'TRANSFER_OUT',
          referenceType: 'TRANSFER',
          referenceId: transferId,
          qtyBefore,
          qtyChange: qtyDecimal.negated(),
          qtyAfter,
          metadata: metadata as any,
        },
      });

      // 4. Tulis mutasi IN (Transfer In)
      const inboundMutation = await tx.stockMutation.create({
        data: {
          productId: batch.productId,
          batchId: targetBatch.id,
          createdById: userId,
          movementType: 'TRANSFER_IN',
          referenceType: 'TRANSFER',
          referenceId: transferId,
          qtyBefore: new Prisma.Decimal(0),
          qtyChange: qtyDecimal,
          qtyAfter: qtyDecimal,
          metadata: metadata as any,
        },
      });

      return {
        outboundMutationId: outboundMutation.id,
        inboundMutationId: inboundMutation.id,
      };
    });
  }
}
