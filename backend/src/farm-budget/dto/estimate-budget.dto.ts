import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EstimateBudgetDto {
  @IsNumber()
  @Min(0.1)
  farmSize: number;

  @IsString()
  cropType: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  livestockCount?: number;
}
