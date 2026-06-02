import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class BatchPriceDto {
  @IsUUID()
  productUnitId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice!: number;
}
