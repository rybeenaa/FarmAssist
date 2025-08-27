import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RecommendationOutcome } from '../entities/recommendation-log.entity';

export class UpdateOutcomeDto {
  @IsEnum(RecommendationOutcome)
  outcome: RecommendationOutcome;

  @IsOptional()
  @IsString()
  outcomeNotes?: string;
}