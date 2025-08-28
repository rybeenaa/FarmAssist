import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class PurchaseItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  avgDailyUse: number;

  @IsInt()
  @Min(0)
  daysUntilNeed: number;

  @IsNumber()
  @Min(0)
  currentStock: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyFactor?: number;
}
