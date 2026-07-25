import { PurchaseMetadata, PurchaseReturnMetadata, SaleReturnMetadata } from '../types/movement-metadata.type';

export class ReceiveStockCommand {
  constructor(
    readonly productId: string,
    readonly batchNumber: string,
    readonly expiredAt: Date,
    readonly quantity: number,
    readonly unitCostRaw: string, // Decimal string
    readonly purchaseId: string | undefined,
    readonly storageLocationId: string | undefined,
    readonly metadata: PurchaseMetadata | PurchaseReturnMetadata | SaleReturnMetadata,
    readonly userId: string,
  ) {}
}
