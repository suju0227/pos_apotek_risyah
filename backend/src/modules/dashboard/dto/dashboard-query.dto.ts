import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardDaysQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  days?: number;
}

export class DashboardTopProductsQueryDto extends DashboardDaysQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DashboardLimitQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class DashboardPeriodQueryDto {
  @IsOptional()
  @IsIn(['7d'])
  period?: '7d';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DashboardDateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
