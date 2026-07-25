import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDosageFormDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
