import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  q: string;
}
