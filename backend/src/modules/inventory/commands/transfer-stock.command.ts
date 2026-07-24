import { TransferMetadata } from '../types/movement-metadata.type';

export class TransferStockCommand {
  constructor(
    readonly batchId: string,
    readonly quantity: number,
    readonly fromLocationId: string,
    readonly toLocationId: string,
    readonly transferId: string,
    readonly metadata: TransferMetadata,
    readonly userId: string,
  ) {}
}
