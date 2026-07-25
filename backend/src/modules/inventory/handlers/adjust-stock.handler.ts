import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdjustStockCommand } from '../commands/adjust-stock.command';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@CommandHandler(AdjustStockCommand)
export class AdjustStockHandler implements ICommandHandler<AdjustStockCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AdjustStockCommand): Promise<string> {
    const { batchId, adjustmentType, quantity, adjustmentId, metadata, userId } = command;
    const qtyChangeDecimal = new Prisma.Decimal(quantity);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const batch = await tx.productBatch.findUniqueOrThrow({
        where: { id: batchId },
      });

      const qtyBefore = batch.currentStockBase;
      let qtyAfter = qtyBefore;

      if (
        adjustmentType === 'INCREASE'
      ) {
        qtyAfter = qtyBefore.plus(qtyChangeDecimal);
      } else {
        qtyAfter = qtyBefore.minus(qtyChangeDecimal);
      }

      if (qtyAfter.lessThan(0)) {
        qtyAfter = new Prisma.Decimal(0);
      }

      // 1. Update summary
      await tx.productBatch.update({
        where: { id: batchId },
        data: {
          currentStockBase: qtyAfter,
        },
      });

      // 2. Tulis Mutation Ledger
      const mutation = await tx.stockMutation.create({
        data: {
          productId: batch.productId,
          batchId,
          createdById: userId,
          movementType: 'ADJUSTMENT',
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentId,
          qtyBefore,
          qtyChange: adjustmentType === 'INCREASE' ? qtyChangeDecimal : qtyChangeDecimal.negated(),
          qtyAfter,
          metadata: metadata as any,
        },
      });

      return mutation.id;
    });
  }
}
