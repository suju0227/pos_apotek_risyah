import { OpnameMetadata } from '../types/movement-metadata.type';

export type OpnameAdjustmentItem = {
  batchId: string;
  systemQty: number;
  physicalQty: number;
};

export class CompleteStockOpnameCommand {
  constructor(
    readonly opnameId: string,
    readonly adjustments: OpnameAdjustmentItem[],
    readonly metadata: OpnameMetadata,
    readonly userId: string,
  ) {}
}
