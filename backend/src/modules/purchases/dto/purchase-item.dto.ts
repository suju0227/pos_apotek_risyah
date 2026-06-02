import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PurchaseSellingPriceDto } from './purchase-selling-price.dto';

export class PurchaseItemDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  productUnitId!: string;

  @IsString()
  batchNumber!: string;

  @IsDateString()
  expiredDate!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  qtyPurchase!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseSellingPriceDto)
  sellingPrices!: PurchaseSellingPriceDto[];
}
