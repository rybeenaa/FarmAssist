import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SeedDemandPredictorService } from './seed-demand-predictor.service';
import { SeedUsage } from './entities/seed-usage.entity';
import { CreateSeedUsageDto } from './dto/create-seed-usage.dto';
import { UpdateSeedUsageDto } from './dto/update-seed-usage.dto';
import { PredictionSeason, CropType } from './types/prediction.types';

describe('SeedDemandPredictorService', () => {
  let service: SeedDemandPredictorService;
  let repository: Repository<SeedUsage>;

  const mockSeedUsage: SeedUsage = {
    id: 1,
    farmerId: 1,
    farmerName: 'John Doe',
    seedVariety: 'Wheat Premium',
    quantityUsed: 50.5,
    areaPlanted: 2.5,
    season: PredictionSeason.SPRING,
    year: 2023,
    region: 'North Region',
    yield: 3500,
    seedCostPerKg: 25.50,
    cropType: CropType.CEREAL,
    weatherConditions: {
      avgTemperature: 22.5,
      totalRainfall: 450,
      humidity: 65,
    },
    soilConditions: {
      ph: 6.8,
      nitrogen: 45,
      phosphorus: 25,
      potassium: 180,
    },
    notes: 'Good yield this season',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedDemandPredictorService,
        {
          provide: getRepositoryToken(SeedUsage),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SeedDemandPredictorService>(SeedDemandPredictorService);
    repository = module.get<Repository<SeedUsage>>(getRepositoryToken(SeedUsage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    describe('createSeedUsage', () => {
      const createDto: CreateSeedUsageDto = {
        farmerId: 1,
        farmerName: 'John Doe',
        seedVariety: 'Wheat Premium',
        quantityUsed: 50.5,
        areaPlanted: 2.5,
        season: PredictionSeason.SPRING,
        year: 2023,
        region: 'North Region',
        yield: 3500,
        seedCostPerKg: 25.50,
        cropType: CropType.CEREAL,
      };

      it('should create a new seed usage record successfully', async () => {
        mockRepository.create.mockReturnValue(mockSeedUsage);
        mockRepository.save.mockResolvedValue(mockSeedUsage);

        const result = await service.createSeedUsage(createDto);

        expect(mockRepository.create).toHaveBeenCalledWith(createDto);
        expect(mockRepository.save).toHaveBeenCalledWith(mockSeedUsage);
        expect(result).toEqual(mockSeedUsage);
      });
    });

    describe('findAllSeedUsage', () => {
      it('should return all seed usage records', async () => {
        const seedUsageArray = [mockSeedUsage];
        mockRepository.find.mockResolvedValue(seedUsageArray);

        const result = await service.findAllSeedUsage();

        expect(mockRepository.find).toHaveBeenCalledWith({
          order: { createdAt: 'DESC' },
        });
        expect(result).toEqual(seedUsageArray);
      });
    });

    describe('findSeedUsageById', () => {
      it('should return a seed usage record by id', async () => {
        mockRepository.findOne.mockResolvedValue(mockSeedUsage);

        const result = await service.findSeedUsageById(1);

        expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(result).toEqual(mockSeedUsage);
      });

      it('should throw NotFoundException if record not found', async () => {
        mockRepository.findOne.mockResolvedValue(null);

        await expect(service.findSeedUsageById(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSeedUsage', () => {
      const updateDto: UpdateSeedUsageDto = {
        quantityUsed: 60.0,
        notes: 'Updated notes',
      };

      it('should update a seed usage record successfully', async () => {
        const updatedRecord = { ...mockSeedUsage, ...updateDto };
        
        mockRepository.findOne.mockResolvedValue(mockSeedUsage);
        mockRepository.save.mockResolvedValue(updatedRecord);

        const result = await service.updateSeedUsage(1, updateDto);

        expect(result).toEqual(updatedRecord);
      });

      it('should throw NotFoundException if record not found', async () => {
        mockRepository.findOne.mockResolvedValue(null);

        await expect(service.updateSeedUsage(999, updateDto)).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteSeedUsage', () => {
      it('should delete a seed usage record successfully', async () => {
        mockRepository.delete.mockResolvedValue({ affected: 1 });

        await service.deleteSeedUsage(1);

        expect(mockRepository.delete).toHaveBeenCalledWith(1);
      });

      it('should throw NotFoundException if record not found', async () => {
        mockRepository.delete.mockResolvedValue({ affected: 0 });

        await expect(service.deleteSeedUsage(999)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Prediction Operations', () => {
    const historicalData = [
      { ...mockSeedUsage, year: 2020, quantityUsed: 40 },
      { ...mockSeedUsage, year: 2021, quantityUsed: 45 },
      { ...mockSeedUsage, year: 2022, quantityUsed: 50 },
      { ...mockSeedUsage, year: 2023, quantityUsed: 55 },
    ];

    describe('predictSeedDemand', () => {
      it('should generate predictions based on historical data', async () => {
        const queryDto = {
          region: 'North Region',
          season: PredictionSeason.SPRING,
          yearsBack: 5,
          predictionYear: 2024,
        };

        mockRepository.find.mockResolvedValue(historicalData);

        const result = await service.predictSeedDemand(queryDto);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('seedVariety');
          expect(result[0]).toHaveProperty('region');
          expect(result[0]).toHaveProperty('season');
          expect(result[0]).toHaveProperty('predictedDemand');
          expect(result[0]).toHaveProperty('confidence');
          expect(result[0]).toHaveProperty('factors');
          expect(result[0]).toHaveProperty('recommendations');
        }
      });

      it('should throw BadRequestException when no historical data found', async () => {
        const queryDto = {
          region: 'Nonexistent Region',
          yearsBack: 5,
        };

        mockRepository.find.mockResolvedValue([]);

        await expect(service.predictSeedDemand(queryDto)).rejects.toThrow(BadRequestException);
      });
    });

    describe('bulkPredictDemand', () => {
      it('should generate bulk predictions', async () => {
        const queryDto = {
          regions: ['North Region'],
          seasons: [PredictionSeason.SPRING],
          seedVarieties: ['Wheat Premium'],
          yearsBack: 3,
        };

        // Mock the getUniqueRegions and getUniqueSeedVarieties methods
        jest.spyOn(service as any, 'getUniqueRegions').mockResolvedValue(['North Region']);
        jest.spyOn(service as any, 'getUniqueSeedVarieties').mockResolvedValue(['Wheat Premium']);
        
        mockRepository.find.mockResolvedValue(historicalData);

        const result = await service.bulkPredictDemand(queryDto);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('getRegionalSummary', () => {
      it('should return regional demand summary', async () => {
        const region = 'North Region';
        const year = 2024;

        mockRepository.find
          .mockResolvedValueOnce(historicalData) // For predictions
          .mockResolvedValueOnce(historicalData); // For growth rate calculation

        const result = await service.getRegionalSummary(region, year);

        expect(result).toBeDefined();
        expect(result.region).toBe(region);
        expect(result).toHaveProperty('totalPredictedDemand');
        expect(result).toHaveProperty('topSeeds');
        expect(result).toHaveProperty('seasonalBreakdown');
        expect(result).toHaveProperty('growthRate');
      });
    });

    describe('getPredictionAnalytics', () => {
      it('should return prediction analytics', async () => {
        mockRepository.createQueryBuilder.mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
        }));
        
        mockRepository.count.mockResolvedValue(100);
        mockRepository.find.mockResolvedValue(historicalData);

        const result = await service.getPredictionAnalytics();

        expect(result).toBeDefined();
        expect(result).toHaveProperty('totalFarmers');
        expect(result).toHaveProperty('totalRegions');
        expect(result).toHaveProperty('dataPointsAnalyzed');
        expect(result).toHaveProperty('trendsIdentified');
        expect(Array.isArray(result.trendsIdentified)).toBe(true);
      });
    });
  });

  describe('Private Helper Methods', () => {
    const historicalData = [
      { ...mockSeedUsage, year: 2020, quantityUsed: 40 },
      { ...mockSeedUsage, year: 2021, quantityUsed: 45 },
      { ...mockSeedUsage, year: 2022, quantityUsed: 50 },
      { ...mockSeedUsage, year: 2023, quantityUsed: 55 },
    ];
    describe('calculateHistoricalTrend', () => {
      it('should calculate trend correctly for increasing data', () => {
        const records = [
          { quantityUsed: 40, year: 2020 } as SeedUsage,
          { quantityUsed: 45, year: 2021 } as SeedUsage,
          { quantityUsed: 50, year: 2022 } as SeedUsage,
          { quantityUsed: 55, year: 2023 } as SeedUsage,
        ];

        const trend = (service as any).calculateHistoricalTrend(records);
        
        expect(typeof trend).toBe('number');
        expect(trend).toBeGreaterThan(0); // Should show increasing trend
      });

      it('should return 0 for insufficient data', () => {
        const records = [{ quantityUsed: 40, year: 2020 } as SeedUsage];
        
        const trend = (service as any).calculateHistoricalTrend(records);
        
        expect(trend).toBe(0);
      });
    });

    describe('calculateSeasonalPattern', () => {
      it('should calculate seasonal patterns correctly', () => {
        const records = [
          { quantityUsed: 40, season: PredictionSeason.SPRING } as SeedUsage,
          { quantityUsed: 30, season: PredictionSeason.SUMMER } as SeedUsage,
          { quantityUsed: 50, season: PredictionSeason.SPRING } as SeedUsage,
          { quantityUsed: 25, season: PredictionSeason.SUMMER } as SeedUsage,
        ];

        const springPattern = (service as any).calculateSeasonalPattern(records, PredictionSeason.SPRING);
        const summerPattern = (service as any).calculateSeasonalPattern(records, PredictionSeason.SUMMER);
        
        expect(typeof springPattern).toBe('number');
        expect(typeof summerPattern).toBe('number');
        expect(springPattern).toBeGreaterThan(summerPattern); // Spring should have higher demand
      });
    });

    describe('calculateConfidence', () => {
      it('should calculate confidence based on data quality', () => {
        const records = historicalData;
        
        const confidence = (service as any).calculateConfidence(records);
        
        expect(typeof confidence).toBe('number');
        expect(confidence).toBeGreaterThanOrEqual(20);
        expect(confidence).toBeLessThanOrEqual(95);
      });

      it('should give higher confidence for more data points', () => {
        const moreRecords = [...historicalData, ...historicalData]; // Double the data
        const lessRecords = historicalData.slice(0, 2); // Half the data
        
        const moreConfidence = (service as any).calculateConfidence(moreRecords);
        const lessConfidence = (service as any).calculateConfidence(lessRecords);
        
        expect(moreConfidence).toBeGreaterThan(lessConfidence);
      });
    });

    describe('generateRecommendations', () => {
      it('should generate appropriate recommendations', () => {
        const records = historicalData;
        const predictedDemand = 60;
        const confidence = 80;
        
        const recommendations = (service as any).generateRecommendations(records, predictedDemand, confidence);
        
        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.every(rec => typeof rec === 'string')).toBe(true);
      });

      it('should recommend inventory increase for high demand growth', () => {
        const records = [
          { quantityUsed: 30, year: 2022, yield: 2500 } as SeedUsage,
          { quantityUsed: 35, year: 2023, yield: 2800 } as SeedUsage,
        ];
        const highDemand = 50; // Much higher than recent average
        const confidence = 80;
        
        const recommendations = (service as any).generateRecommendations(records, highDemand, confidence);
        
        expect(recommendations.some(rec => rec.includes('increasing'))).toBe(true);
      });

      it('should recommend data collection for low confidence', () => {
        const records = historicalData;
        const predictedDemand = 45;
        const lowConfidence = 40;
        
        const recommendations = (service as any).generateRecommendations(records, predictedDemand, lowConfidence);
        
        expect(recommendations.some(rec => rec.includes('confidence'))).toBe(true);
      });
    });

    describe('calculatePriceRange', () => {
      it('should calculate price range when cost data is available', () => {
        const records = [
          { seedCostPerKg: 20 } as SeedUsage,
          { seedCostPerKg: 25 } as SeedUsage,
          { seedCostPerKg: 30 } as SeedUsage,
        ];
        
        const priceRange = (service as any).calculatePriceRange(records);
        
        expect(priceRange).toBeDefined();
        expect(priceRange.min).toBe(20);
        expect(priceRange.max).toBe(30);
        expect(priceRange.average).toBe(25);
      });

      it('should return undefined when no cost data available', () => {
        const records = [
          { seedCostPerKg: null } as SeedUsage,
          { seedCostPerKg: undefined } as SeedUsage,
        ];
        
        const priceRange = (service as any).calculatePriceRange(records);
        
        expect(priceRange).toBeUndefined();
      });
    });
  });

  describe('Data Quality Methods', () => {
    describe('calculateVariance', () => {
      it('should calculate variance correctly', () => {
        const values = [10, 20, 30, 40, 50];
        
        const variance = (service as any).calculateVariance(values);
        
        expect(typeof variance).toBe('number');
        expect(variance).toBeGreaterThan(0);
      });

      it('should return 0 variance for identical values', () => {
        const values = [25, 25, 25, 25];
        
        const variance = (service as any).calculateVariance(values);
        
        expect(variance).toBe(0);
      });
    });

    describe('calculateGrowthRate', () => {
      it('should calculate growth rate correctly', () => {
        const records = [
          { quantityUsed: 100, year: 2020 } as SeedUsage,
          { quantityUsed: 110, year: 2021 } as SeedUsage,
          { quantityUsed: 120, year: 2022 } as SeedUsage,
        ];
        
        const growthRate = (service as any).calculateGrowthRate(records);
        
        expect(typeof growthRate).toBe('number');
        expect(growthRate).toBeGreaterThan(0); // Should show positive growth
      });

      it('should return 0 for no data', () => {
        const records: SeedUsage[] = [];
        
        const growthRate = (service as any).calculateGrowthRate(records);
        
        expect(growthRate).toBe(0);
      });
    });
  });
});
