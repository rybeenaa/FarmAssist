import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmZone, ProductivityZone } from './entities/farm-zone.entity';
import { FarmProfile } from '../farm-profile/farm-profile.entity';
import { CreateFarmZoneDto } from './dto/create-farm-zone.dto';
import { UpdateFarmZoneDto } from './dto/update-farm-zone.dto';
import { ClassifyFarmDto, BulkClassifyFarmsDto } from './dto/classify-farm.dto';
import { ClassificationResultDto, BulkClassificationResultDto, FarmZoneResponseDto } from './dto/farm-zone-response.dto';

@Injectable()
export class FarmZoneClassifierService {
  private readonly logger = new Logger(FarmZoneClassifierService.name);

  constructor(
    @InjectRepository(FarmZone)
    private readonly farmZoneRepository: Repository<FarmZone>,
    @InjectRepository(FarmProfile)
    private readonly farmProfileRepository: Repository<FarmProfile>,
  ) {}

  /**
   * Create a new farm zone classification
   */
  async create(createFarmZoneDto: CreateFarmZoneDto): Promise<FarmZone> {
    const farmProfile = await this.farmProfileRepository.findOne({
      where: { id: createFarmZoneDto.farmProfileId }
    });

    if (!farmProfile) {
      throw new NotFoundException(`Farm profile with ID ${createFarmZoneDto.farmProfileId} not found`);
    }

    // Check if farm zone already exists for this profile
    const existingZone = await this.farmZoneRepository.findOne({
      where: { farmProfile: { id: createFarmZoneDto.farmProfileId } }
    });

    if (existingZone) {
      throw new BadRequestException(`Farm zone already exists for farm profile ${createFarmZoneDto.farmProfileId}`);
    }

    // Calculate metrics if not provided
    const averageYield = createFarmZoneDto.averageYield ?? 
      this.calculateAverageYield(createFarmZoneDto.historicalData.yields);
    
    const productivityScore = createFarmZoneDto.productivityScore ?? 
      this.calculateProductivityScore(createFarmZoneDto.historicalData);

    // Classify the zone based on calculated metrics
    const zoneType = this.classifyProductivityZone(productivityScore, averageYield);

    const farmZone = this.farmZoneRepository.create({
      farmProfile,
      historicalData: createFarmZoneDto.historicalData,
      averageYield,
      productivityScore,
      zoneType,
    });

    return await this.farmZoneRepository.save(farmZone);
  }

  /**
   * Find all farm zones with optional filtering
   */
  async findAll(zoneType?: ProductivityZone): Promise<FarmZone[]> {
    const queryBuilder = this.farmZoneRepository.createQueryBuilder('farmZone')
      .leftJoinAndSelect('farmZone.farmProfile', 'farmProfile');

    if (zoneType) {
      queryBuilder.where('farmZone.zoneType = :zoneType', { zoneType });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Find a specific farm zone by ID
   */
  async findOne(id: string): Promise<FarmZone> {
    const farmZone = await this.farmZoneRepository.findOne({
      where: { id },
      relations: ['farmProfile']
    });

    if (!farmZone) {
      throw new NotFoundException(`Farm zone with ID ${id} not found`);
    }

    return farmZone;
  }

  /**
   * Find farm zone by farm profile ID
   */
  async findByFarmProfile(farmProfileId: string): Promise<FarmZone | null> {
    return await this.farmZoneRepository.findOne({
      where: { farmProfile: { id: farmProfileId } },
      relations: ['farmProfile']
    });
  }

  /**
   * Update an existing farm zone
   */
  async update(id: string, updateFarmZoneDto: UpdateFarmZoneDto): Promise<FarmZone> {
    const farmZone = await this.findOne(id);

    if (updateFarmZoneDto.historicalData) {
      farmZone.historicalData = updateFarmZoneDto.historicalData;
      
      // Recalculate metrics based on new historical data
      farmZone.averageYield = updateFarmZoneDto.averageYield ?? 
        this.calculateAverageYield(updateFarmZoneDto.historicalData.yields);
      
      farmZone.productivityScore = updateFarmZoneDto.productivityScore ?? 
        this.calculateProductivityScore(updateFarmZoneDto.historicalData);
      
      // Reclassify the zone
      farmZone.zoneType = this.classifyProductivityZone(farmZone.productivityScore, farmZone.averageYield);
    } else {
      if (updateFarmZoneDto.averageYield !== undefined) {
        farmZone.averageYield = updateFarmZoneDto.averageYield;
      }
      if (updateFarmZoneDto.productivityScore !== undefined) {
        farmZone.productivityScore = updateFarmZoneDto.productivityScore;
      }
      
      // Reclassify if metrics changed
      farmZone.zoneType = this.classifyProductivityZone(farmZone.productivityScore, farmZone.averageYield);
    }

    return await this.farmZoneRepository.save(farmZone);
  }

  /**
   * Remove a farm zone
   */
  async remove(id: string): Promise<void> {
    const farmZone = await this.findOne(id);
    await this.farmZoneRepository.remove(farmZone);
  }

  /**
   * Classify a single farm based on its profile
   */
  async classifyFarm(classifyFarmDto: ClassifyFarmDto): Promise<ClassificationResultDto> {
    const farmProfile = await this.farmProfileRepository.findOne({
      where: { id: classifyFarmDto.farmProfileId }
    });

    if (!farmProfile) {
      throw new NotFoundException(`Farm profile with ID ${classifyFarmDto.farmProfileId} not found`);
    }

    // Check if classification already exists
    let existingZone = await this.findByFarmProfile(classifyFarmDto.farmProfileId);
    
    if (existingZone && !classifyFarmDto.forceRecalculation) {
      return this.mapToClassificationResult(existingZone);
    }

    // For demonstration, we'll use mock historical data if none exists
    // In a real application, this would come from actual farm data
    const mockHistoricalData = this.generateMockHistoricalData(farmProfile);
    
    const averageYield = this.calculateAverageYield(mockHistoricalData.yields);
    const productivityScore = this.calculateProductivityScore(mockHistoricalData);
    const zoneType = this.classifyProductivityZone(productivityScore, averageYield);
    
    // Create or update the farm zone
    if (existingZone) {
      existingZone.historicalData = mockHistoricalData;
      existingZone.averageYield = averageYield;
      existingZone.productivityScore = productivityScore;
      existingZone.zoneType = zoneType;
      existingZone = await this.farmZoneRepository.save(existingZone);
    } else {
      existingZone = await this.farmZoneRepository.save(
        this.farmZoneRepository.create({
          farmProfile,
          historicalData: mockHistoricalData,
          averageYield,
          productivityScore,
          zoneType,
        })
      );
    }

    return this.mapToClassificationResult(existingZone);
  }

  /**
   * Classify multiple farms in bulk
   */
  async bulkClassifyFarms(bulkClassifyDto: BulkClassifyFarmsDto): Promise<BulkClassificationResultDto> {
    const results: ClassificationResultDto[] = [];
    const errors: Array<{ farmProfileId: string; error: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const farmProfileId of bulkClassifyDto.farmProfileIds) {
      try {
        const result = await this.classifyFarm({
          farmProfileId,
          forceRecalculation: bulkClassifyDto.forceRecalculation
        });
        results.push(result);
        successful++;
      } catch (error) {
        errors.push({
          farmProfileId,
          error: error.message || 'Unknown error occurred'
        });
        failed++;
        this.logger.error(`Failed to classify farm ${farmProfileId}: ${error.message}`);
      }
    }

    return {
      totalProcessed: bulkClassifyDto.farmProfileIds.length,
      successful,
      failed,
      results,
      errors
    };
  }

  /**
   * Get productivity zone statistics
   */
  async getZoneStatistics(): Promise<Record<ProductivityZone, number>> {
    const stats = await this.farmZoneRepository
      .createQueryBuilder('farmZone')
      .select('farmZone.zoneType', 'zoneType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('farmZone.zoneType')
      .getRawMany();

    const result: Record<ProductivityZone, number> = {
      [ProductivityZone.HIGH_YIELD]: 0,
      [ProductivityZone.MODERATE_YIELD]: 0,
      [ProductivityZone.LOW_YIELD]: 0,
    };

    stats.forEach(stat => {
      result[stat.zoneType] = parseInt(stat.count, 10);
    });

    return result;
  }

  /**
   * Calculate average yield from historical data
   */
  private calculateAverageYield(yields: number[]): number {
    if (!yields || yields.length === 0) return 0;
    return yields.reduce((sum, yield) => sum + yield, 0) / yields.length;
  }

  /**
   * Calculate productivity score based on multiple factors
   */
  private calculateProductivityScore(historicalData: any): number {
    const { yields, soilQualityScores, moistureLevels } = historicalData;

    if (!yields || yields.length === 0) return 0;

    // Yield consistency (30% weight)
    const yieldConsistency = this.calculateYieldConsistency(yields);

    // Average soil quality (25% weight)
    const avgSoilQuality = soilQualityScores.length > 0
      ? soilQualityScores.reduce((sum: number, score: number) => sum + score, 0) / soilQualityScores.length
      : 5;

    // Moisture adequacy (25% weight)
    const moistureAdequacy = this.calculateMoistureAdequacy(moistureLevels);

    // Seasonal performance (20% weight)
    const seasonalPerformance = this.calculateSeasonalPerformance(yields);

    const score = (
      (yieldConsistency * 0.30) +
      ((avgSoilQuality / 10) * 100 * 0.25) +
      (moistureAdequacy * 0.25) +
      (seasonalPerformance * 0.20)
    );

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Classify productivity zone based on score and yield
   */
  private classifyProductivityZone(productivityScore: number, averageYield: number): ProductivityZone {
    // High-yield: Score >= 75 and yield above threshold
    if (productivityScore >= 75 && averageYield >= 3.5) {
      return ProductivityZone.HIGH_YIELD;
    }

    // Low-yield: Score < 50 or very low yield
    if (productivityScore < 50 || averageYield < 2.0) {
      return ProductivityZone.LOW_YIELD;
    }

    // Moderate-yield: Everything else
    return ProductivityZone.MODERATE_YIELD;
  }

  /**
   * Calculate yield consistency (lower coefficient of variation = higher consistency)
   */
  private calculateYieldConsistency(yields: number[]): number {
    if (yields.length < 2) return 50; // Default for insufficient data

    const mean = yields.reduce((sum, yield) => sum + yield, 0) / yields.length;
    const variance = yields.reduce((sum, yield) => sum + Math.pow(yield - mean, 2), 0) / yields.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) : 1;

    // Convert to 0-100 scale (lower CV = higher consistency score)
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  /**
   * Calculate moisture adequacy score
   */
  private calculateMoistureAdequacy(moistureLevels: number[]): number {
    if (!moistureLevels || moistureLevels.length === 0) return 50;

    const avgMoisture = moistureLevels.reduce((sum, level) => sum + level, 0) / moistureLevels.length;

    // Optimal moisture range is 40-70%
    if (avgMoisture >= 40 && avgMoisture <= 70) {
      return 100;
    } else if (avgMoisture >= 30 && avgMoisture <= 80) {
      return 75;
    } else if (avgMoisture >= 20 && avgMoisture <= 90) {
      return 50;
    } else {
      return 25;
    }
  }

  /**
   * Calculate seasonal performance score
   */
  private calculateSeasonalPerformance(yields: number[]): number {
    if (yields.length < 2) return 50;

    // Check for improvement trend
    let improvements = 0;
    for (let i = 1; i < yields.length; i++) {
      if (yields[i] > yields[i - 1]) improvements++;
    }

    const improvementRate = improvements / (yields.length - 1);
    return improvementRate * 100;
  }

  /**
   * Generate mock historical data for demonstration
   */
  private generateMockHistoricalData(farmProfile: FarmProfile): any {
    const seasons = ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'];
    const baseYield = 2.5 + Math.random() * 2; // Base yield between 2.5-4.5

    return {
      yields: seasons.map(() => baseYield + (Math.random() - 0.5) * 1.5),
      seasons,
      soilQualityScores: seasons.map(() => 4 + Math.random() * 4), // 4-8 range
      moistureLevels: seasons.map(() => 30 + Math.random() * 40), // 30-70% range
    };
  }

  /**
   * Map FarmZone entity to ClassificationResultDto
   */
  private mapToClassificationResult(farmZone: FarmZone): ClassificationResultDto {
    const factors = {
      yieldConsistency: this.calculateYieldConsistency(farmZone.historicalData.yields),
      soilQuality: farmZone.historicalData.soilQualityScores.length > 0
        ? farmZone.historicalData.soilQualityScores.reduce((sum, score) => sum + score, 0) / farmZone.historicalData.soilQualityScores.length * 10
        : 50,
      moistureAdequacy: this.calculateMoistureAdequacy(farmZone.historicalData.moistureLevels),
      seasonalPerformance: this.calculateSeasonalPerformance(farmZone.historicalData.yields),
    };

    const recommendations = this.generateRecommendations(farmZone.zoneType, factors);

    return {
      farmProfileId: farmZone.farmProfile.id,
      zoneType: farmZone.zoneType,
      productivityScore: farmZone.productivityScore,
      averageYield: farmZone.averageYield,
      confidence: this.calculateConfidence(farmZone.historicalData),
      factors,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on zone type and factors
   */
  private generateRecommendations(zoneType: ProductivityZone, factors: any): string[] {
    const recommendations: string[] = [];

    switch (zoneType) {
      case ProductivityZone.HIGH_YIELD:
        recommendations.push('Maintain current farming practices');
        recommendations.push('Consider expanding cultivation area');
        if (factors.yieldConsistency < 80) {
          recommendations.push('Focus on yield consistency improvements');
        }
        break;

      case ProductivityZone.MODERATE_YIELD:
        recommendations.push('Implement soil improvement strategies');
        recommendations.push('Optimize irrigation scheduling');
        if (factors.soilQuality < 60) {
          recommendations.push('Consider soil testing and fertilization');
        }
        if (factors.moistureAdequacy < 70) {
          recommendations.push('Improve water management systems');
        }
        break;

      case ProductivityZone.LOW_YIELD:
        recommendations.push('Urgent intervention required');
        recommendations.push('Comprehensive soil analysis recommended');
        recommendations.push('Consider crop rotation or alternative crops');
        recommendations.push('Implement intensive soil rehabilitation');
        if (factors.moistureAdequacy < 50) {
          recommendations.push('Install proper irrigation systems');
        }
        break;
    }

    return recommendations;
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidence(historicalData: any): number {
    const dataPoints = historicalData.yields.length;
    const hasCompleteData = historicalData.soilQualityScores.length > 0 &&
                           historicalData.moistureLevels.length > 0;

    let confidence = Math.min(100, (dataPoints / 5) * 100); // Max confidence with 5+ data points

    if (!hasCompleteData) {
      confidence *= 0.8; // Reduce confidence if missing soil or moisture data
    }

    return Math.round(confidence);
  }
}
}
