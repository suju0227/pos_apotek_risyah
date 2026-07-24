import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ReceiveStockCommand } from './commands/receive-stock.command';
import { CommitOutboundStockCommand } from './commands/commit-outbound-stock.command';
import { AdjustStockCommand, AdjustmentType } from './commands/adjust-stock.command';
import { TransferStockCommand } from './commands/transfer-stock.command';
import { CompleteStockOpnameCommand, OpnameAdjustmentItem } from './commands/complete-stock-opname.command';
import { PurchaseMetadata, PurchaseReturnMetadata, SaleMetadata, SaleReturnMetadata, AdjustmentMetadata, TransferMetadata, OpnameMetadata } from './types/movement-metadata.type';

@Injectable()
export class InventoryService {
  constructor(private readonly commandBus: CommandBus) {}

  async receiveStock(
    productId: string,
    batchNumber: string,
    expiredAt: Date,
    quantity: number,
    unitCostRaw: string,
    purchaseId: string | undefined,
    storageLocationId: string | undefined,
    metadata: PurchaseMetadata | PurchaseReturnMetadata,
    userId: string,
  ): Promise<string> {
    return this.commandBus.execute(
      new ReceiveStockCommand(
        productId,
        batchNumber,
        expiredAt,
        quantity,
        unitCostRaw,
        purchaseId,
        storageLocationId,
        metadata,
        userId,
      ),
    );
  }

  async commitOutboundStock(
    productId: string,
    quantity: number,
    referenceId: string,
    referenceType: 'SALE' | 'SALE_RETURN',
    metadata: SaleMetadata | SaleReturnMetadata,
    userId: string,
  ): Promise<string[]> {
    return this.commandBus.execute(
      new CommitOutboundStockCommand(
        productId,
        quantity,
        referenceId,
        referenceType,
        metadata,
        userId,
      ),
    );
  }

  async adjustStock(
    batchId: string,
    adjustmentType: AdjustmentType,
    quantity: number,
    adjustmentId: string,
    metadata: AdjustmentMetadata,
    userId: string,
  ): Promise<string> {
    return this.commandBus.execute(
      new AdjustStockCommand(
        batchId,
        adjustmentType,
        quantity,
        adjustmentId,
        metadata,
        userId,
      ),
    );
  }

  async transferStock(
    batchId: string,
    quantity: number,
    fromLocationId: string,
    toLocationId: string,
    transferId: string,
    metadata: TransferMetadata,
    userId: string,
  ): Promise<{ outboundMutationId: string; inboundMutationId: string }> {
    return this.commandBus.execute(
      new TransferStockCommand(
        batchId,
        quantity,
        fromLocationId,
        toLocationId,
        transferId,
        metadata,
        userId,
      ),
    );
  }

  async completeStockOpname(
    opnameId: string,
    adjustments: OpnameAdjustmentItem[],
    metadata: OpnameMetadata,
    userId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new CompleteStockOpnameCommand(opnameId, adjustments, metadata, userId),
    );
  }
}
