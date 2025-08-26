import { IsNotEmpty, IsString, IsNumber, IsArray, IsObject, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoricalDataDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  yields: number[];

  @IsArray()
  @IsString({ each: true })
  seasons: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Min(0, { each: true })
  @Max(10, { each: true })
  soilQualityScores: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Min(0, { each: true })
  @Max(100, { each: true })
  moistureLevels: number[];
}

export class CreateFarmZoneDto {
  @IsUUID()
  @IsNotEmpty()
  farmProfileId: string;

  @IsObject()
  @Type(() => HistoricalDataDto)
  historicalData: HistoricalDataDto;

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
