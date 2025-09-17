import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SeedUsage } from './entities/seed-usage.entity';
import { CreateSeedUsageDto } from './dto/create-seed-usage.dto';
import { UpdateSeedUsageDto } from './dto/update-seed-usage.dto';
import { PredictionQueryDto, BulkPredictionQueryDto } from './dto/prediction-query.dto';
import {
  SeedDemandPrediction,
  RegionalDemandSummary,
  PredictionAnalytics,
  PredictionSeason,
  WeatherImpactFactor,
  PredictionFilters,
} from './types/prediction.types';

@Injectable()
export class SeedDemandPredictorService {
  constructor(
    @InjectRepository(SeedUsage)
    private seedUsageRepository: Repository<SeedUsage>,
  ) {}

  // CRUD Operations for Seed Usage Data

  async createSeedUsage(createDto: CreateSeedUsageDto): Promise<SeedUsage> {
    const seedUsage = this.seedUsageRepository.create(createDto);
    return await this.seedUsageRepository.save(seedUsage);
  }

  async findAllSeedUsage(): Promise<SeedUsage[]> {
    return await this.seedUsageRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findSeedUsageById(id: number): Promise<SeedUsage> {
    const seedUsage = await this.seedUsageRepository.findOne({ where: { id } });
    if (!seedUsage) {
      throw new NotFoundException(`Seed usage record with ID ${id} not found`);
    }
    return seedUsage;
  }

  async updateSeedUsage(id: number, updateDto: UpdateSeedUsageDto): Promise<SeedUsage> {
    const seedUsage = await this.findSeedUsageById(id);
    Object.assign(seedUsage, updateDto);
    return await this.seedUsageRepository.save(seedUsage);
  }

  async deleteSeedUsage(id: number): Promise<void> {
    const result = await this.seedUsageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Seed usage record with ID ${id} not found`);
    }
  }

  // Prediction Methods

  async predictSeedDemand(queryDto: PredictionQueryDto): Promise<SeedDemandPrediction[]> {
    const { region, season, cropType, seedVariety, yearsBack = 5, predictionYear } = queryDto;
    
    // Build query conditions
    const whereConditions: any = {};
    if (region) whereConditions.region = region;
    if (season) whereConditions.season = season;
    if (cropType) whereConditions.cropType = cropType;
    if (seedVariety) whereConditions.seedVariety = seedVariety;

    // Get historical data
    const currentYear = new Date().getFullYear();
    whereConditions.year = Between(currentYear - yearsBack, currentYear);

    const historicalData = await this.seedUsageRepository.find({
      where: whereConditions,
      order: { year: 'ASC', season: 'ASC' },
    });

    if (historicalData.length === 0) {
      throw new BadRequestException('No historical data found for the given criteria');
    }

    // Group data for prediction analysis
    const groupedData = this.groupDataForPrediction(historicalData);
    const predictions: SeedDemandPrediction[] = [];

    for (const [key, records] of groupedData.entries()) {
      const [seedVar, reg, seas] = key.split('|');
      const prediction = await this.generatePrediction(records, seedVar, reg, seas as PredictionSeason, predictionYear);
      predictions.push(prediction);
    }

    return predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);
  }

  async bulkPredictDemand(queryDto: BulkPredictionQueryDto): Promise<SeedDemandPrediction[]> {
    const { regions, seasons, seedVarieties, yearsBack = 5, predictionYear } = queryDto;
    
    const predictions: SeedDemandPrediction[] = [];
    const allRegions = regions || await this.getUniqueRegions();
    const allSeasons = seasons || Object.values(PredictionSeason);
    const allVarieties = seedVarieties || await this.getUniqueSeedVarieties();

    for (const region of allRegions) {
      for (const season of allSeasons) {
        for (const variety of allVarieties) {
          try {
            const singlePrediction = await this.predictSeedDemand({
              region,
              season,
              seedVariety: variety,
              yearsBack,
              predictionYear,
            });
            predictions.push(...singlePrediction);
          } catch (error) {
            // Continue with other combinations if one fails
            continue;
          }
        }
      }
    }

    return predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);
  }

  async getRegionalSummary(region: string, year?: number): Promise<RegionalDemandSummary> {
    const targetYear = year || new Date().getFullYear() + 1;
    
    // Get predictions for the region
    const predictions = await this.predictSeedDemand({ region, predictionYear: targetYear });
    
    const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0);
    
    // Calculate top seeds
    const topSeeds = predictions
      .map(p => ({
        variety: p.seedVariety,
        demand: p.predictedDemand,
        percentage: (p.predictedDemand / totalPredictedDemand) * 100,
      }))
      .slice(0, 10);

    // Calculate seasonal breakdown
    const seasonalBreakdown = predictions.reduce((acc, p) => {
      acc[p.season] = (acc[p.season] || 0) + p.predictedDemand;
      return acc;
    }, {} as Record<PredictionSeason, number>);

    // Calculate growth rate
    const historicalData = await this.seedUsageRepository.find({
      where: { region, year: Between(targetYear - 3, targetYear - 1) },
    });
    
    const growthRate = this.calculateGrowthRate(historicalData);

    return {
      region,
      totalPredictedDemand,
      topSeeds,
      seasonalBreakdown,
      growthRate,
    };
  }

  async getPredictionAnalytics(): Promise<PredictionAnalytics> {
    const totalFarmers = await this.seedUsageRepository
      .createQueryBuilder('usage')
      .select('COUNT(DISTINCT usage.farmerId)', 'count')
      .getRawOne();

    const totalRegions = await this.seedUsageRepository
      .createQueryBuilder('usage')
      .select('COUNT(DISTINCT usage.region)', 'count')
      .getRawOne();

    const dataPointsAnalyzed = await this.seedUsageRepository.count();

    // Identify trends
    const trendsIdentified = await this.identifyTrends();

    return {
      totalFarmers: parseInt(totalFarmers.count),
      totalRegions: parseInt(totalRegions.count),
      dataPointsAnalyzed,
      trendsIdentified,
    };
  }

  // Private Helper Methods

  private groupDataForPrediction(data: SeedUsage[]): Map<string, SeedUsage[]> {
    const grouped = new Map<string, SeedUsage[]>();
    
    for (const record of data) {
      const key = `${record.seedVariety}|${record.region}|${record.season}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    }
    
    return grouped;
  }

  private async generatePrediction(
    historicalRecords: SeedUsage[],
    seedVariety: string,
    region: string,
    season: PredictionSeason,
    predictionYear?: number,
  ): Promise<SeedDemandPrediction> {
    const targetYear = predictionYear || new Date().getFullYear() + 1;
    
    // Calculate trend factors
    const historicalTrend = this.calculateHistoricalTrend(historicalRecords);
    const seasonalPattern = this.calculateSeasonalPattern(historicalRecords, season);
    const regionalGrowth = this.calculateRegionalGrowth(historicalRecords);
    
    // Base prediction on recent average
    const recentYears = historicalRecords.filter(r => r.year >= new Date().getFullYear() - 3);
    const averageDemand = recentYears.reduce((sum, r) => sum + r.quantityUsed, 0) / Math.max(recentYears.length, 1);
    
    // Apply trend factors
    let predictedDemand = averageDemand * (1 + historicalTrend) * (1 + seasonalPattern) * (1 + regionalGrowth);
    
    // Ensure minimum realistic value
    predictedDemand = Math.max(predictedDemand, averageDemand * 0.5);
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(historicalRecords);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(historicalRecords, predictedDemand, confidence);
    
    // Calculate price range if cost data is available
    const priceRange = this.calculatePriceRange(historicalRecords);

    return {
      seedVariety,
      region,
      season,
      year: targetYear,
      predictedDemand: Math.round(predictedDemand * 100) / 100,
      confidence,
      factors: {
        historicalTrend,
        seasonalPattern,
        regionalGrowth,
      },
      recommendations,
      priceRange,
    };
  }

  private calculateHistoricalTrend(records: SeedUsage[]): number {
    if (records.length < 2) return 0;
    
    // Simple linear regression for trend
    const sortedRecords = records.sort((a, b) => a.year - b.year);
    const n = sortedRecords.length;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i; // year index
      const y = sortedRecords[i].quantityUsed;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    
    // Return trend as percentage change
    return avgY > 0 ? slope / avgY : 0;
  }

  private calculateSeasonalPattern(records: SeedUsage[], season: PredictionSeason): number {
    // Calculate seasonal multiplier based on historical patterns
    const seasonalData = records.filter(r => r.season === season);
    const allSeasonalData = records.reduce((acc, r) => {
      acc[r.season] = (acc[r.season] || []).concat(r.quantityUsed);
      return acc;
    }, {} as Record<string, number[]>);
    
    const seasonAverage = seasonalData.reduce((sum, r) => sum + r.quantityUsed, 0) / Math.max(seasonalData.length, 1);
    const overallAverage = records.reduce((sum, r) => sum + r.quantityUsed, 0) / records.length;
    
    return overallAverage > 0 ? (seasonAverage / overallAverage) - 1 : 0;
  }

  private calculateRegionalGrowth(records: SeedUsage[]): number {
    // Calculate regional growth based on recent vs historical data
    const recentYears = records.filter(r => r.year >= new Date().getFullYear() - 2);
    const olderYears = records.filter(r => r.year < new Date().getFullYear() - 2);
    
    if (recentYears.length === 0 || olderYears.length === 0) return 0;
    
    const recentAvg = recentYears.reduce((sum, r) => sum + r.quantityUsed, 0) / recentYears.length;
    const olderAvg = olderYears.reduce((sum, r) => sum + r.quantityUsed, 0) / olderYears.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private calculateConfidence(records: SeedUsage[]): number {
    // Base confidence on data quality factors
    let confidence = 50; // Base confidence
    
    // More data points = higher confidence
    confidence += Math.min(records.length * 5, 30);
    
    // Recent data = higher confidence
    const recentRecords = records.filter(r => r.year >= new Date().getFullYear() - 2);
    confidence += Math.min(recentRecords.length * 3, 15);
    
    // Consistent data = higher confidence
    const variance = this.calculateVariance(records.map(r => r.quantityUsed));
    const mean = records.reduce((sum, r) => sum + r.quantityUsed, 0) / records.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
    confidence -= Math.min(coefficientOfVariation * 10, 20);
    
    return Math.max(Math.min(Math.round(confidence), 95), 20);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private generateRecommendations(records: SeedUsage[], predictedDemand: number, confidence: number): string[] {
    const recommendations: string[] = [];
    
    // Recent average for comparison
    const recentAvg = records
      .filter(r => r.year >= new Date().getFullYear() - 2)
      .reduce((sum, r) => sum + r.quantityUsed, 0) / Math.max(records.length, 1);
    
    const changePercentage = recentAvg > 0 ? ((predictedDemand - recentAvg) / recentAvg) * 100 : 0;
    
    if (changePercentage > 20) {
      recommendations.push('High demand growth expected - consider increasing seed inventory by 25-30%');
      recommendations.push('Early procurement recommended to avoid supply shortages');
    } else if (changePercentage < -10) {
      recommendations.push('Demand decline predicted - consider reducing inventory to avoid overstock');
      recommendations.push('Focus on promoting alternative seed varieties in this region');
    } else {
      recommendations.push('Stable demand predicted - maintain current inventory levels');
    }
    
    if (confidence < 60) {
      recommendations.push('Low confidence prediction - collect more historical data for better accuracy');
    }
    
    // Yield-based recommendations
    const avgYield = records
      .filter(r => r.yield && r.yield > 0)
      .reduce((sum, r) => sum + r.yield!, 0) / Math.max(records.filter(r => r.yield).length, 1);
    
    if (avgYield > 0 && avgYield < 2000) {
      recommendations.push('Consider promoting higher-yielding seed varieties to improve farmer productivity');
    }
    
    return recommendations;
  }

  private calculatePriceRange(records: SeedUsage[]): { min: number; max: number; average: number } | undefined {
    const pricesWithData = records.filter(r => r.seedCostPerKg && r.seedCostPerKg > 0);
    
    if (pricesWithData.length === 0) return undefined;
    
    const prices = pricesWithData.map(r => r.seedCostPerKg!);
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    };
  }

  private calculateGrowthRate(historicalData: SeedUsage[]): number {
    if (historicalData.length === 0) return 0;
    
    const yearlyTotals = historicalData.reduce((acc, record) => {
      acc[record.year] = (acc[record.year] || 0) + record.quantityUsed;
      return acc;
    }, {} as Record<number, number>);
    
    const years = Object.keys(yearlyTotals).map(Number).sort();
    if (years.length < 2) return 0;
    
    const firstYear = yearlyTotals[years[0]];
    const lastYear = yearlyTotals[years[years.length - 1]];
    const yearsDiff = years[years.length - 1] - years[0];
    
    return firstYear > 0 ? ((lastYear - firstYear) / firstYear / yearsDiff) * 100 : 0;
  }

  private async identifyTrends(): Promise<Array<{ type: 'increasing' | 'decreasing' | 'stable'; description: string; confidence: number }>> {
    // Get recent 3 years of data
    const currentYear = new Date().getFullYear();
    const recentData = await this.seedUsageRepository.find({
      where: {
        year: Between(currentYear - 3, currentYear),
      },
    });
    
    const trends: Array<{ type: 'increasing' | 'decreasing' | 'stable'; description: string; confidence: number }> = [];
    
    // Analyze overall demand trend
    const yearlyTotals = recentData.reduce((acc, record) => {
      acc[record.year] = (acc[record.year] || 0) + record.quantityUsed;
      return acc;
    }, {} as Record<number, number>);
    
    const years = Object.keys(yearlyTotals).map(Number).sort();
    if (years.length >= 2) {
      const growthRate = this.calculateGrowthRate(recentData);
      
      if (growthRate > 5) {
        trends.push({
          type: 'increasing',
          description: `Overall seed demand increasing by ${growthRate.toFixed(1)}% annually`,
          confidence: 80,
        });
      } else if (growthRate < -5) {
        trends.push({
          type: 'decreasing',
          description: `Overall seed demand decreasing by ${Math.abs(growthRate).toFixed(1)}% annually`,
          confidence: 80,
        });
      } else {
        trends.push({
          type: 'stable',
          description: 'Overall seed demand remains stable',
          confidence: 70,
        });
      }
    }
    
    return trends;
  }

  private async getUniqueRegions(): Promise<string[]> {
    const result = await this.seedUsageRepository
      .createQueryBuilder('usage')
      .select('DISTINCT usage.region', 'region')
      .getRawMany();
    
    return result.map(r => r.region);
  }

  private async getUniqueSeedVarieties(): Promise<string[]> {
    const result = await this.seedUsageRepository
      .createQueryBuilder('usage')
      .select('DISTINCT usage.seedVariety', 'seedVariety')
      .getRawMany();
    
    return result.map(r => r.seedVariety);
  }
}
