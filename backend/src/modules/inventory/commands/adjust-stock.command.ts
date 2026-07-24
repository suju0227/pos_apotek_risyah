import { AdjustmentMetadata } from '../types/movement-metadata.type';

export type AdjustmentType = 'INCREASE' | 'DECREASE' | 'EXPIRED' | 'DAMAGED' | 'LOST';

export class AdjustStockCommand {
  constructor(
    readonly batchId: string,
    readonly adjustmentType: AdjustmentType,
    readonly quantity: number,
    readonly adjustmentId: string,
    readonly metadata: AdjustmentMetadata,
    readonly userId: string,
  ) {}
}
