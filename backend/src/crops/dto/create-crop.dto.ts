import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { SunlightRequirementLevel, WaterRequirementLevel } from '../entities/crop.entity';

export class CreateCropDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  scientificName: string;

  @IsArray()
  @IsString({ each: true })
  plantingSeasons: string[];

  @IsInt()
  @Min(1)
  growthCycleDays: number;

  @IsArray()
  @IsString({ each: true })
  commonDiseases: string[];

  @IsArray()
  @IsString({ each: true })
  idealSoilTypes: string[];

  @IsEnum(WaterRequirementLevel)
  waterRequirement: WaterRequirementLevel;

  @IsEnum(SunlightRequirementLevel)
  sunlightRequirement: SunlightRequirementLevel;

  @IsArray()
  @IsString({ each: true })
  regionSuitability: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}


