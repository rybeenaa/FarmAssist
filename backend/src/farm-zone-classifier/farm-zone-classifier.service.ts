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
   * Get productivity zone statistics with enhanced analytics
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
   * Get detailed analytics for farm zones
   */
  async getDetailedAnalytics(): Promise<{
    zoneDistribution: Record<ProductivityZone, number>;
    averageScoresByZone: Record<ProductivityZone, number>;
    totalFarms: number;
    performanceMetrics: {
      highPerformingFarms: number;
      improvementCandidates: number;
      criticalFarms: number;
    };
    cropTypeAnalysis: Array<{
      cropType: string;
      averageScore: number;
      zoneDistribution: Record<ProductivityZone, number>;
    }>;
  }> {
    const allZones = await this.farmZoneRepository.find({
      relations: ['farmProfile']
    });

    const zoneDistribution = await this.getZoneStatistics();

    // Calculate average scores by zone
    const averageScoresByZone: Record<ProductivityZone, number> = {
      [ProductivityZone.HIGH_YIELD]: 0,
      [ProductivityZone.MODERATE_YIELD]: 0,
      [ProductivityZone.LOW_YIELD]: 0,
    };

    Object.values(ProductivityZone).forEach(zone => {
      const zonesOfType = allZones.filter(z => z.zoneType === zone);
      if (zonesOfType.length > 0) {
        averageScoresByZone[zone] = zonesOfType.reduce((sum, z) => sum + z.productivityScore, 0) / zonesOfType.length;
      }
    });

    // Crop type analysis
    const cropTypes = [...new Set(allZones.map(z => z.farmProfile.cropType))];
    const cropTypeAnalysis = cropTypes.map(cropType => {
      const cropZones = allZones.filter(z => z.farmProfile.cropType === cropType);
      const avgScore = cropZones.reduce((sum, z) => sum + z.productivityScore, 0) / cropZones.length;

      const cropZoneDistribution: Record<ProductivityZone, number> = {
        [ProductivityZone.HIGH_YIELD]: 0,
        [ProductivityZone.MODERATE_YIELD]: 0,
        [ProductivityZone.LOW_YIELD]: 0,
      };

      cropZones.forEach(zone => {
        cropZoneDistribution[zone.zoneType]++;
      });

      return {
        cropType,
        averageScore: Math.round(avgScore * 100) / 100,
        zoneDistribution: cropZoneDistribution,
      };
    });

    return {
      zoneDistribution,
      averageScoresByZone: Object.fromEntries(
        Object.entries(averageScoresByZone).map(([key, value]) => [key, Math.round(value * 100) / 100])
      ) as Record<ProductivityZone, number>,
      totalFarms: allZones.length,
      performanceMetrics: {
        highPerformingFarms: zoneDistribution[ProductivityZone.HIGH_YIELD],
        improvementCandidates: zoneDistribution[ProductivityZone.MODERATE_YIELD],
        criticalFarms: zoneDistribution[ProductivityZone.LOW_YIELD],
      },
      cropTypeAnalysis,
    };
  }

  /**
   * Get farms that need immediate attention
   */
  async getCriticalFarms(): Promise<Array<{
    farmZone: FarmZone;
    urgencyScore: number;
    criticalFactors: string[];
  }>> {
    const lowYieldFarms = await this.farmZoneRepository.find({
      where: { zoneType: ProductivityZone.LOW_YIELD },
      relations: ['farmProfile']
    });

    return lowYieldFarms.map(farmZone => {
      const urgencyScore = this.calculateUrgencyScore(farmZone);
      const criticalFactors = this.identifyCriticalFactors(farmZone);

      return {
        farmZone,
        urgencyScore,
        criticalFactors,
      };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore);
  }

  /**
   * Get improvement recommendations for a specific zone type
   */
  async getZoneImprovementStrategies(zoneType: ProductivityZone): Promise<{
    strategies: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimatedImpact: string;
      timeframe: string;
      cost: 'low' | 'medium' | 'high';
    }>;
    successMetrics: string[];
  }> {
    const strategies = this.getImprovementStrategiesByZone(zoneType);
    const successMetrics = this.getSuccessMetricsByZone(zoneType);

    return {
      strategies,
      successMetrics,
    };
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

  /**
   * Calculate urgency score for critical farms
   */
  private calculateUrgencyScore(farmZone: FarmZone): number {
    const { productivityScore, averageYield, historicalData } = farmZone;

    let urgencyScore = 0;

    // Base urgency from productivity score
    urgencyScore += (50 - productivityScore) * 2; // Higher urgency for lower scores

    // Yield-based urgency
    if (averageYield < 1.5) urgencyScore += 30;
    else if (averageYield < 2.0) urgencyScore += 20;

    // Trend-based urgency (declining yields)
    const yields = historicalData.yields;
    if (yields.length >= 3) {
      const recentTrend = yields.slice(-3);
      const isDecreasing = recentTrend.every((yield, i) => i === 0 || yield <= recentTrend[i - 1]);
      if (isDecreasing) urgencyScore += 25;
    }

    return Math.min(100, Math.max(0, urgencyScore));
  }

  /**
   * Identify critical factors for low-performing farms
   */
  private identifyCriticalFactors(farmZone: FarmZone): string[] {
    const factors: string[] = [];
    const { historicalData, productivityScore } = farmZone;

    // Check soil quality
    const avgSoilQuality = historicalData.soilQualityScores.reduce((sum, score) => sum + score, 0) / historicalData.soilQualityScores.length;
    if (avgSoilQuality < 5) factors.push('Poor soil quality');

    // Check moisture levels
    const avgMoisture = historicalData.moistureLevels.reduce((sum, level) => sum + level, 0) / historicalData.moistureLevels.length;
    if (avgMoisture < 30 || avgMoisture > 80) factors.push('Inadequate moisture management');

    // Check yield consistency
    const yieldConsistency = this.calculateYieldConsistency(historicalData.yields);
    if (yieldConsistency < 60) factors.push('Inconsistent yield performance');

    // Check seasonal performance
    const seasonalPerformance = this.calculateSeasonalPerformance(historicalData.yields);
    if (seasonalPerformance < 40) factors.push('Poor seasonal adaptation');

    return factors;
  }

  /**
   * Get improvement strategies by zone type
   */
  private getImprovementStrategiesByZone(zoneType: ProductivityZone) {
    const strategies = {
      [ProductivityZone.HIGH_YIELD]: [
        {
          title: 'Precision Agriculture Implementation',
          description: 'Deploy IoT sensors and GPS-guided equipment for optimal resource utilization',
          priority: 'medium' as const,
          estimatedImpact: '5-10% yield increase',
          timeframe: '6-12 months',
          cost: 'high' as const,
        },
        {
          title: 'Market Expansion Strategy',
          description: 'Explore premium markets and value-added crop varieties',
          priority: 'low' as const,
          estimatedImpact: '15-25% revenue increase',
          timeframe: '12-18 months',
          cost: 'medium' as const,
        },
      ],
      [ProductivityZone.MODERATE_YIELD]: [
        {
          title: 'Soil Health Enhancement',
          description: 'Implement organic matter improvement and balanced fertilization',
          priority: 'high' as const,
          estimatedImpact: '15-25% yield increase',
          timeframe: '3-6 months',
          cost: 'medium' as const,
        },
        {
          title: 'Irrigation System Optimization',
          description: 'Install drip irrigation or improve water scheduling',
          priority: 'high' as const,
          estimatedImpact: '10-20% yield increase',
          timeframe: '2-4 months',
          cost: 'medium' as const,
        },
        {
          title: 'Crop Rotation Implementation',
          description: 'Introduce nitrogen-fixing crops and diversified rotation',
          priority: 'medium' as const,
          estimatedImpact: '20-30% long-term improvement',
          timeframe: '12-24 months',
          cost: 'low' as const,
        },
      ],
      [ProductivityZone.LOW_YIELD]: [
        {
          title: 'Emergency Soil Rehabilitation',
          description: 'Comprehensive soil testing and immediate nutrient correction',
          priority: 'high' as const,
          estimatedImpact: '50-100% yield recovery',
          timeframe: '1-3 months',
          cost: 'high' as const,
        },
        {
          title: 'Water Management Crisis Response',
          description: 'Install basic irrigation and drainage systems',
          priority: 'high' as const,
          estimatedImpact: '40-80% yield improvement',
          timeframe: '1-2 months',
          cost: 'high' as const,
        },
        {
          title: 'Alternative Crop Assessment',
          description: 'Evaluate drought-resistant or soil-appropriate crop varieties',
          priority: 'medium' as const,
          estimatedImpact: '30-60% yield improvement',
          timeframe: '6-12 months',
          cost: 'low' as const,
        },
      ],
    };

    return strategies[zoneType] || [];
  }

  /**
   * Get success metrics by zone type
   */
  private getSuccessMetricsByZone(zoneType: ProductivityZone): string[] {
    const metrics = {
      [ProductivityZone.HIGH_YIELD]: [
        'Maintain yield above 4.0 tons/hectare',
        'Keep productivity score above 80%',
        'Achieve yield consistency above 85%',
        'Expand cultivation area by 10-20%',
      ],
      [ProductivityZone.MODERATE_YIELD]: [
        'Increase average yield to 3.5+ tons/hectare',
        'Improve productivity score to 75%+',
        'Achieve soil quality score above 7.0',
        'Maintain moisture levels between 40-70%',
      ],
      [ProductivityZone.LOW_YIELD]: [
        'Achieve minimum yield of 2.0 tons/hectare',
        'Improve productivity score above 50%',
        'Stabilize yield consistency above 60%',
        'Establish basic irrigation infrastructure',
      ],
    };

    return metrics[zoneType] || [];
  }

  /**
   * Predict future zone classification based on trends
   */
  async predictFutureClassification(farmProfileId: string): Promise<{
    currentZone: ProductivityZone;
    predictedZone: ProductivityZone;
    confidence: number;
    timeframe: string;
    trendAnalysis: {
      yieldTrend: 'improving' | 'stable' | 'declining';
      soilTrend: 'improving' | 'stable' | 'declining';
      moistureTrend: 'improving' | 'stable' | 'declining';
    };
  }> {
    const farmZone = await this.findByFarmProfile(farmProfileId);

    if (!farmZone) {
      throw new NotFoundException(`No farm zone found for farm profile ${farmProfileId}`);
    }

    const { historicalData } = farmZone;
    const trendAnalysis = this.analyzeTrends(historicalData);

    // Simple prediction logic based on trends
    let predictedZone = farmZone.zoneType;
    let confidence = 70;

    if (trendAnalysis.yieldTrend === 'improving' && trendAnalysis.soilTrend === 'improving') {
      if (farmZone.zoneType === ProductivityZone.LOW_YIELD) {
        predictedZone = ProductivityZone.MODERATE_YIELD;
        confidence = 80;
      } else if (farmZone.zoneType === ProductivityZone.MODERATE_YIELD) {
        predictedZone = ProductivityZone.HIGH_YIELD;
        confidence = 75;
      }
    } else if (trendAnalysis.yieldTrend === 'declining' && trendAnalysis.soilTrend === 'declining') {
      if (farmZone.zoneType === ProductivityZone.HIGH_YIELD) {
        predictedZone = ProductivityZone.MODERATE_YIELD;
        confidence = 75;
      } else if (farmZone.zoneType === ProductivityZone.MODERATE_YIELD) {
        predictedZone = ProductivityZone.LOW_YIELD;
        confidence = 80;
      }
    }

    return {
      currentZone: farmZone.zoneType,
      predictedZone,
      confidence,
      timeframe: '6-12 months',
      trendAnalysis,
    };
  }

  /**
   * Analyze trends in historical data
   */
  private analyzeTrends(historicalData: any): {
    yieldTrend: 'improving' | 'stable' | 'declining';
    soilTrend: 'improving' | 'stable' | 'declining';
    moistureTrend: 'improving' | 'stable' | 'declining';
  } {
    const analyzeTrendArray = (data: number[]) => {
      if (data.length < 3) return 'stable';

      const recent = data.slice(-3);
      const older = data.slice(0, -3);

      if (older.length === 0) return 'stable';

      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (changePercent > 5) return 'improving';
      if (changePercent < -5) return 'declining';
      return 'stable';
    };

    return {
      yieldTrend: analyzeTrendArray(historicalData.yields),
      soilTrend: analyzeTrendArray(historicalData.soilQualityScores),
      moistureTrend: analyzeTrendArray(historicalData.moistureLevels),
    };
  }
}
