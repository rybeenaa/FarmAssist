import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { RecommendationLog, RecommendationType, RecommendationOutcome } from './entities/recommendation-log.entity';
import { CreateRecommendationLogDto } from './dto/create-recommendation-log.dto';
import { UpdateOutcomeDto } from './dto/update-outcome.dto';

@Injectable()
export class RecommendationLoggingService {
  constructor(
    @InjectRepository(RecommendationLog)
    private readonly recommendationLogRepository: Repository<RecommendationLog>,
  ) {}

  /**
   * Log a new recommendation
   */
  async logRecommendation(dto: CreateRecommendationLogDto): Promise<RecommendationLog> {
    const log = this.recommendationLogRepository.create({
      ...dto,
      createdAt: new Date(),
    });
    return this.recommendationLogRepository.save(log);
  }

  /**
   * Update the outcome of a recommendation
   */
  async updateOutcome(id: string, dto: UpdateOutcomeDto): Promise<RecommendationLog> {
    const log = await this.findOne(id);
    
    log.outcome = dto.outcome;
    log.outcomeNotes = dto.outcomeNotes;
    log.outcomeUpdatedAt = new Date();
    
    return this.recommendationLogRepository.save(log);
  }

  /**
   * Find all recommendation logs with optional filtering
   */
  async findAll(options?: {
    userId?: string;
    farmId?: string;
    recommendationType?: RecommendationType;
    outcome?: RecommendationOutcome;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: RecommendationLog[]; total: number }> {
    const queryOptions: FindManyOptions<RecommendationLog> = {
      order: { createdAt: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    };

    const where: any = {};
    
    if (options?.userId) where.userId = options.userId;
    if (options?.farmId) where.farmId = options.farmId;
    if (options?.recommendationType) where.recommendationType = options.recommendationType;
    if (options?.outcome) where.outcome = options.outcome;
    
    if (options?.startDate && options?.endDate) {
      where.createdAt = Between(options.startDate, options.endDate);
    } else if (options?.startDate) {
      where.createdAt = Between(options.startDate, new Date());
    }

    if (Object.keys(where).length > 0) {
      queryOptions.where = where;
    }

    const [logs, total] = await this.recommendationLogRepository.findAndCount(queryOptions);
    
    return { logs, total };
  }

  /**
   * Find a single recommendation log by ID
   */
  async findOne(id: string): Promise<RecommendationLog> {
    const log = await this.recommendationLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Recommendation log with ID ${id} not found`);
    }
    return log;
  }

  /**
   * Get recommendation statistics
   */
  async getStatistics(options?: {
    userId?: string;
    farmId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const queryBuilder = this.recommendationLogRepository.createQueryBuilder('log');
    
    if (options?.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: options.userId });
    }
    
    if (options?.farmId) {
      queryBuilder.andWhere('log.farmId = :farmId', { farmId: options.farmId });
    }
    
    if (options?.startDate && options?.endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    const [totalRecommendations, byType, byOutcome] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .select('log.recommendationType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('log.recommendationType')
        .getRawMany(),
      queryBuilder
        .select('log.outcome', 'outcome')
        .addSelect('COUNT(*)', 'count')
        .groupBy('log.outcome')
        .getRawMany(),
    ]);

    return {
      totalRecommendations,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      byOutcome: byOutcome.reduce((acc, item) => {
        acc[item.outcome] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  /**
   * Helper method to log fertilizer recommendations
   */
  async logFertilizerRecommendation(
    userId: string,
    farmId: string,
    inputParams: any,
    recommendation: any,
  ): Promise<RecommendationLog> {
    return this.logRecommendation({
      userId,
      farmId,
      recommendationType: RecommendationType.FERTILIZER,
      recommendationContent: `Recommended fertilizer: ${recommendation.fertilizer}`,
      recommendationData: recommendation,
      inputParameters: inputParams,
      sourceService: 'FertilizerRecommendationService',
      sourceEndpoint: '/fertilizer-recommendation',
    });
  }

  /**
   * Helper method to log farm input recommendations
   */
  async logFarmInputRecommendation(
    userId: string,
    farmId: string,
    recommendation: any,
  ): Promise<RecommendationLog> {
    return this.logRecommendation({
      userId,
      farmId,
      recommendationType: RecommendationType.FARM_INPUT,
      recommendationContent: `Farm input recommendations for ${recommendation.farmDetails?.cropType}`,
      recommendationData: recommendation,
      inputParameters: { farmId },
      sourceService: 'RecommendationsService',
      sourceEndpoint: '/recommendations',
    });
  }

  /**
   * Helper method to log advisory recommendations
   */
  async logAdvisoryRecommendation(
    userId: string,
    advisory: any,
    queryParams: any,
  ): Promise<RecommendationLog> {
    return this.logRecommendation({
      userId,
      recommendationType: RecommendationType.ADVISORY,
      recommendationContent: advisory.content,
      recommendationData: advisory,
      inputParameters: queryParams,
      sourceService: 'AdvisoryService',
      sourceEndpoint: '/advisory',
    });
  }

  /**
   * Helper method to log crop suggestions
   */
  async logCropSuggestion(
    userId: string,
    farmId: string,
    soilData: any,
    suggestions: string[],
  ): Promise<RecommendationLog> {
    return this.logRecommendation({
      userId,
      farmId,
      recommendationType: RecommendationType.CROP_SUGGESTION,
      recommendationContent: `Suggested crops: ${suggestions.join(', ')}`,
      recommendationData: { suggestions },
      inputParameters: soilData,
      sourceService: 'SoilTypeRegistryService',
      sourceEndpoint: '/soil-type-registry/suggest-crops',
    });
  }
}