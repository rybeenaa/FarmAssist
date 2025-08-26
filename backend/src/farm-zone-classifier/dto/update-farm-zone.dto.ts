import { IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { HistoricalDataDto } from './create-farm-zone.dto';

export class UpdateFarmZoneDto {
  @IsOptional()
  @IsObject()
  @Type(() => HistoricalDataDto)
  historicalData?: HistoricalDataDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageYield?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  productivityScore?: number;
}
