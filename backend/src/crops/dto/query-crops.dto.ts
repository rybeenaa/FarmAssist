import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SunlightRequirementLevel, WaterRequirementLevel } from '../entities/crop.entity';

export class QueryCropsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(WaterRequirementLevel)
  waterRequirement?: WaterRequirementLevel;

  @IsOptional()
  @IsEnum(SunlightRequirementLevel)
  sunlightRequirement?: SunlightRequirementLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}


