import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsObject,
  Min,
  Max,
  MaxLength,
  IsEnum,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PredictionSeason, CropType } from '../types/prediction.types';

export class CreateSeedUsageDto {
  @IsInt()
  @IsPositive()
  farmerId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  farmerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  seedVariety: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantityUsed: number; // in kg

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  areaPlanted: number; // in hectares

  @IsEnum(PredictionSeason)
  season: PredictionSeason;

  @IsInt()
  @Min(2000)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  year: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  yield?: number; // actual harvest yield in kg/hectare

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  seedCostPerKg?: number; // cost per kg in local currency

  @IsOptional()
  @IsEnum(CropType)
  cropType?: CropType;

  @IsOptional()
  @IsObject()
  weatherConditions?: {
    avgTemperature?: number;
    totalRainfall?: number;
    humidity?: number;
  };

  @IsOptional()
  @IsObject()
  soilConditions?: {
    ph?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  };

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
