import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PredictionSeason, CropType } from '../types/prediction.types';

export class PredictionQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsEnum(PredictionSeason)
  season?: PredictionSeason;

  @IsOptional()
  @IsEnum(CropType)
  cropType?: CropType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  seedVariety?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  yearsBack?: number = 5;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(new Date().getFullYear() + 5)
  @Type(() => Number)
  predictionYear?: number = new Date().getFullYear() + 1;
}

export class BulkPredictionQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(region => region.trim());
    }
    return value;
  })
  @IsString({ each: true })
  regions?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(season => season.trim());
    }
    return value;
  })
  @IsEnum(PredictionSeason, { each: true })
  seasons?: PredictionSeason[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(variety => variety.trim());
    }
    return value;
  })
  @IsString({ each: true })
  seedVarieties?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  yearsBack?: number = 5;

  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(new Date().getFullYear() + 5)
  @Type(() => Number)
  predictionYear?: number = new Date().getFullYear() + 1;
}
