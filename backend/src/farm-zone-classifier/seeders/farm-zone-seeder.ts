import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmZone, ProductivityZone } from '../entities/farm-zone.entity';
import { FarmProfile } from '../../farm-profile/farm-profile.entity';
import { FarmZoneClassifierService } from '../farm-zone-classifier.service';

export interface SeedData {
  farmProfiles: Array<{
    farmSize: number;
    latitude: number;
    longitude: number;
    cropType: string;
    farmerName: string;
    farmerContact: string;
    expectedZone: ProductivityZone;
  }>;
}

@Injectable()
export class FarmZoneSeeder {
  private readonly logger = new Logger(FarmZoneSeeder.name);

  constructor(
    @InjectRepository(FarmProfile)
    private readonly farmProfileRepository: Repository<FarmProfile>,
    @InjectRepository(FarmZone)
    private readonly farmZoneRepository: Repository<FarmZone>,
    private readonly farmZoneClassifierService: FarmZoneClassifierService,
  ) {}

  /**
   * Seed comprehensive test data for farm zone classification
   */
  async seedTestData(): Promise<{
    farmProfilesCreated: number;
    farmZonesCreated: number;
    zoneDistribution: Record<ProductivityZone, number>;
  }> {
    this.logger.log('Starting farm zone test data seeding...');

    // Clear existing test data
    await this.clearTestData();

    const seedData = this.generateSeedData();
    let farmProfilesCreated = 0;
    let farmZonesCreated = 0;
    const zoneDistribution: Record<ProductivityZone, number> = {
      [ProductivityZone.HIGH_YIELD]: 0,
      [ProductivityZone.MODERATE_YIELD]: 0,
      [ProductivityZone.LOW_YIELD]: 0,
    };

    for (const profileData of seedData.farmProfiles) {
      try {
        // Create farm profile
        const farmProfile = await this.farmProfileRepository.save({
          farmSize: profileData.farmSize,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          cropType: profileData.cropType,
          farmerName: profileData.farmerName,
          farmerContact: profileData.farmerContact,
        });
        farmProfilesCreated++;

        // Generate historical data based on expected zone
        const historicalData = this.generateHistoricalData(profileData.expectedZone, profileData.cropType);

        // Create farm zone classification
        const farmZone = await this.farmZoneClassifierService.create({
          farmProfileId: farmProfile.id,
          historicalData,
        });
        farmZonesCreated++;
        zoneDistribution[farmZone.zoneType]++;

        this.logger.debug(`Created ${profileData.farmerName} - ${farmZone.zoneType} (${profileData.cropType})`);
      } catch (error) {
        this.logger.error(`Failed to create farm profile for ${profileData.farmerName}: ${error.message}`);
      }
    }

    this.logger.log(`Seeding completed: ${farmProfilesCreated} profiles, ${farmZonesCreated} zones`);
    return {
      farmProfilesCreated,
      farmZonesCreated,
      zoneDistribution,
    };
  }

  /**
   * Clear all test data
   */
  async clearTestData(): Promise<void> {
    this.logger.log('Clearing existing test data...');
    
    // Delete farm zones first (due to foreign key constraints)
    await this.farmZoneRepository.delete({});
    
    // Delete farm profiles
    await this.farmProfileRepository.delete({});
    
    this.logger.log('Test data cleared');
  }

  /**
   * Generate realistic seed data
   */
  private generateSeedData(): SeedData {
    const cropTypes = ['Maize', 'Rice', 'Cassava', 'Yam', 'Groundnut', 'Sorghum', 'Millet'];
    const regions = [
      { name: 'Kaduna South', lat: 10.5, lng: 7.4 },
      { name: 'Kano Central', lat: 12.0, lng: 8.5 },
      { name: 'Ogun East', lat: 6.8, lng: 3.9 },
      { name: 'Kwara North', lat: 9.5, lng: 4.8 },
      { name: 'Plateau Central', lat: 9.2, lng: 9.8 },
    ];

    const farmProfiles = [];

    // Generate high-yield farms (30%)
    for (let i = 0; i < 15; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
      
      farmProfiles.push({
        farmSize: 8 + Math.random() * 12, // 8-20 hectares
        latitude: region.lat + (Math.random() - 0.5) * 0.2,
        longitude: region.lng + (Math.random() - 0.5) * 0.2,
        cropType,
        farmerName: `High Yield Farmer ${i + 1}`,
        farmerContact: `+234${Math.floor(Math.random() * 900000000) + 100000000}`,
        expectedZone: ProductivityZone.HIGH_YIELD,
      });
    }

    // Generate moderate-yield farms (50%)
    for (let i = 0; i < 25; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
      
      farmProfiles.push({
        farmSize: 3 + Math.random() * 10, // 3-13 hectares
        latitude: region.lat + (Math.random() - 0.5) * 0.2,
        longitude: region.lng + (Math.random() - 0.5) * 0.2,
        cropType,
        farmerName: `Moderate Yield Farmer ${i + 1}`,
        farmerContact: `+234${Math.floor(Math.random() * 900000000) + 100000000}`,
        expectedZone: ProductivityZone.MODERATE_YIELD,
      });
    }

    // Generate low-yield farms (20%)
    for (let i = 0; i < 10; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const cropType = cropTypes[Math.floor(Math.random() * cropTypes.length)];
      
      farmProfiles.push({
        farmSize: 1 + Math.random() * 5, // 1-6 hectares
        latitude: region.lat + (Math.random() - 0.5) * 0.2,
        longitude: region.lng + (Math.random() - 0.5) * 0.2,
        cropType,
        farmerName: `Low Yield Farmer ${i + 1}`,
        farmerContact: `+234${Math.floor(Math.random() * 900000000) + 100000000}`,
        expectedZone: ProductivityZone.LOW_YIELD,
      });
    }

    return { farmProfiles };
  }

  /**
   * Generate realistic historical data based on expected zone
   */
  private generateHistoricalData(expectedZone: ProductivityZone, cropType: string) {
    const seasons = ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'];
    
    // Base values for different crop types
    const cropBaseValues = {
      'Maize': { yield: 3.5, soil: 7.0, moisture: 55 },
      'Rice': { yield: 3.0, soil: 6.5, moisture: 70 },
      'Cassava': { yield: 12.0, soil: 6.0, moisture: 50 },
      'Yam': { yield: 10.0, soil: 7.5, moisture: 55 },
      'Groundnut': { yield: 2.0, soil: 7.0, moisture: 45 },
      'Sorghum': { yield: 2.5, soil: 6.5, moisture: 40 },
      'Millet': { yield: 1.5, soil: 6.0, moisture: 35 },
    };

    const baseValues = cropBaseValues[cropType] || cropBaseValues['Maize'];

    let yieldMultiplier: number;
    let soilMultiplier: number;
    let moistureVariation: number;
    let consistency: number;

    switch (expectedZone) {
      case ProductivityZone.HIGH_YIELD:
        yieldMultiplier = 1.3 + Math.random() * 0.4; // 1.3-1.7x
        soilMultiplier = 1.2 + Math.random() * 0.2; // 1.2-1.4x
        moistureVariation = 5; // Low variation
        consistency = 0.9; // High consistency
        break;
      
      case ProductivityZone.MODERATE_YIELD:
        yieldMultiplier = 0.8 + Math.random() * 0.4; // 0.8-1.2x
        soilMultiplier = 0.9 + Math.random() * 0.2; // 0.9-1.1x
        moistureVariation = 10; // Medium variation
        consistency = 0.7; // Medium consistency
        break;
      
      case ProductivityZone.LOW_YIELD:
        yieldMultiplier = 0.4 + Math.random() * 0.3; // 0.4-0.7x
        soilMultiplier = 0.6 + Math.random() * 0.3; // 0.6-0.9x
        moistureVariation = 20; // High variation
        consistency = 0.5; // Low consistency
        break;
    }

    const yields = seasons.map((_, index) => {
      const baseYield = baseValues.yield * yieldMultiplier;
      const seasonalVariation = (Math.random() - 0.5) * 2 * (1 - consistency);
      const trendImprovement = index * 0.05 * (expectedZone === ProductivityZone.HIGH_YIELD ? 1 : -0.5);
      return Math.max(0.1, baseYield + seasonalVariation + trendImprovement);
    });

    const soilQualityScores = seasons.map(() => {
      const baseSoil = baseValues.soil * soilMultiplier;
      const variation = (Math.random() - 0.5) * 2 * (1 - consistency);
      return Math.max(1, Math.min(10, baseSoil + variation));
    });

    const moistureLevels = seasons.map(() => {
      const baseMoisture = baseValues.moisture;
      const variation = (Math.random() - 0.5) * moistureVariation;
      return Math.max(10, Math.min(90, baseMoisture + variation));
    });

    return {
      yields: yields.map(y => Math.round(y * 100) / 100),
      seasons,
      soilQualityScores: soilQualityScores.map(s => Math.round(s * 10) / 10),
      moistureLevels: moistureLevels.map(m => Math.round(m)),
    };
  }

  /**
   * Generate performance test data for load testing
   */
  async seedPerformanceTestData(count: number = 1000): Promise<void> {
    this.logger.log(`Generating ${count} farms for performance testing...`);
    
    const batchSize = 50;
    const batches = Math.ceil(count / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      const batchCount = batchEnd - batchStart;
      
      const promises = [];
      for (let i = 0; i < batchCount; i++) {
        const farmIndex = batchStart + i;
        promises.push(this.createPerformanceTestFarm(farmIndex));
      }
      
      await Promise.all(promises);
      this.logger.log(`Completed batch ${batch + 1}/${batches}`);
    }
    
    this.logger.log(`Performance test data generation completed: ${count} farms`);
  }

  private async createPerformanceTestFarm(index: number): Promise<void> {
    const cropTypes = ['Maize', 'Rice', 'Cassava', 'Yam', 'Groundnut'];
    const cropType = cropTypes[index % cropTypes.length];
    
    const farmProfile = await this.farmProfileRepository.save({
      farmSize: 1 + Math.random() * 20,
      latitude: 6 + Math.random() * 6, // Nigeria latitude range
      longitude: 3 + Math.random() * 11, // Nigeria longitude range
      cropType,
      farmerName: `Performance Test Farmer ${index}`,
      farmerContact: `+234${Math.floor(Math.random() * 900000000) + 100000000}`,
    });

    const expectedZone = [
      ProductivityZone.HIGH_YIELD,
      ProductivityZone.MODERATE_YIELD,
      ProductivityZone.LOW_YIELD,
    ][index % 3];

    const historicalData = this.generateHistoricalData(expectedZone, cropType);

    await this.farmZoneClassifierService.create({
      farmProfileId: farmProfile.id,
      historicalData,
    });
  }
}
