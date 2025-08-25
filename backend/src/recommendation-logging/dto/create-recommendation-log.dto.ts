import { IsEnum, IsOptional, IsString, IsObject, IsUUID } from 'class-validator';
import { RecommendationType } from '../entities/recommendation-log.entity';

export class CreateRecommendationLogDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsEnum(RecommendationType)
  recommendationType: RecommendationType;

  @IsString()
  recommendationContent: string;

  @IsOptional()
  @IsObject()
  recommendationData?: any;

  @IsOptional()
  @IsObject()
  inputParameters?: any;

  @IsOptional()
  @IsString()
  sourceService?: string;

  @IsOptional()
  @IsString()
  sourceEndpoint?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}