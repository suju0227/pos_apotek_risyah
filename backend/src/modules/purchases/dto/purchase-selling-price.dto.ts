import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class PurchaseSellingPriceDto {
  @IsUUID()
  productUnitId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice!: number;
}
