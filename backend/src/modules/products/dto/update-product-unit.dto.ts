import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateProductUnitDto {
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  @IsOptional()
  conversionToBase?: number;

  @IsBoolean()
  @IsOptional()
  isDefaultSaleUnit?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
