import { SaleMetadata, SaleReturnMetadata, PurchaseReturnMetadata } from '../types/movement-metadata.type';

export class CommitOutboundStockCommand {
  constructor(
    readonly productId: string,
    readonly quantity: number,
    readonly referenceId: string,
    readonly referenceType: 'SALE' | 'SALE_RETURN' | 'PURCHASE_RETURN',
    readonly metadata: SaleMetadata | SaleReturnMetadata | PurchaseReturnMetadata,
    readonly userId: string,
  ) {}
}
