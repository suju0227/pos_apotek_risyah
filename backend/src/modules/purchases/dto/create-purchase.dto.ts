import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PurchaseItemDto } from './purchase-item.dto';

export class CreatePurchaseDto {
  @IsUUID()
  supplierId!: string;

  @IsDateString()
  purchaseDate!: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];
}
