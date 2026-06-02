import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateProductUnitDto {
  @IsUUID()
  unitId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  conversionToBase!: number;

  @IsBoolean()
  @IsOptional()
  isDefaultSaleUnit?: boolean;
}
