import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SeedDemandPredictorController } from './seed-demand-predictor.controller';
import { SeedDemandPredictorService } from './seed-demand-predictor.service';
import { CreateSeedUsageDto } from './dto/create-seed-usage.dto';
import { UpdateSeedUsageDto } from './dto/update-seed-usage.dto';
import { PredictionQueryDto, BulkPredictionQueryDto } from './dto/prediction-query.dto';
import { SeedUsage } from './entities/seed-usage.entity';
import { PredictionSeason, CropType } from './types/prediction.types';

describe('SeedDemandPredictorController', () => {
  let controller: SeedDemandPredictorController;
  let service: SeedDemandPredictorService;

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

  const mockPrediction = {
    seedVariety: 'Wheat Premium',
    region: 'North Region',
    season: PredictionSeason.SPRING,
    year: 2024,
    predictedDemand: 60.5,
    confidence: 85,
    factors: {
      historicalTrend: 0.15,
      seasonalPattern: 0.1,
      regionalGrowth: 0.05,
    },
    recommendations: ['Increase inventory by 20%', 'Monitor weather conditions'],
    priceRange: {
      min: 20,
      max: 30,
      average: 25,
    },
  };

  const mockService = {
    createSeedUsage: jest.fn(),
    findAllSeedUsage: jest.fn(),
    findSeedUsageById: jest.fn(),
    updateSeedUsage: jest.fn(),
    deleteSeedUsage: jest.fn(),
    predictSeedDemand: jest.fn(),
    bulkPredictDemand: jest.fn(),
    getRegionalSummary: jest.fn(),
    getPredictionAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedDemandPredictorController],
      providers: [
        {
          provide: SeedDemandPredictorService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SeedDemandPredictorController>(SeedDemandPredictorController);
    service = module.get<SeedDemandPredictorService>(SeedDemandPredictorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Seed Usage Data Management', () => {
    describe('POST /seed-demand-predictor/usage', () => {
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

      it('should create a new seed usage record', async () => {
        mockService.createSeedUsage.mockResolvedValue(mockSeedUsage);

        const result = await controller.createSeedUsage(createDto);

        expect(mockService.createSeedUsage).toHaveBeenCalledWith(createDto);
        expect(result).toEqual({
          statusCode: HttpStatus.CREATED,
          message: 'Seed usage record created successfully',
          data: mockSeedUsage,
        });
      });
    });

    describe('GET /seed-demand-predictor/usage', () => {
      it('should return all seed usage records', async () => {
        const seedUsageArray = [mockSeedUsage];
        mockService.findAllSeedUsage.mockResolvedValue(seedUsageArray);

        const result = await controller.getAllSeedUsage();

        expect(mockService.findAllSeedUsage).toHaveBeenCalled();
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Seed usage records retrieved successfully',
          data: seedUsageArray,
        });
      });
    });

    describe('GET /seed-demand-predictor/usage/:id', () => {
      it('should return a seed usage record by ID', async () => {
        mockService.findSeedUsageById.mockResolvedValue(mockSeedUsage);

        const result = await controller.getSeedUsageById(1);

        expect(mockService.findSeedUsageById).toHaveBeenCalledWith(1);
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Seed usage record retrieved successfully',
          data: mockSeedUsage,
        });
      });
    });

    describe('PUT /seed-demand-predictor/usage/:id', () => {
      const updateDto: UpdateSeedUsageDto = {
        quantityUsed: 60.0,
        notes: 'Updated notes',
      };

      it('should update a seed usage record', async () => {
        const updatedRecord = { ...mockSeedUsage, ...updateDto };
        mockService.updateSeedUsage.mockResolvedValue(updatedRecord);

        const result = await controller.updateSeedUsage(1, updateDto);

        expect(mockService.updateSeedUsage).toHaveBeenCalledWith(1, updateDto);
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Seed usage record updated successfully',
          data: updatedRecord,
        });
      });
    });

    describe('DELETE /seed-demand-predictor/usage/:id', () => {
      it('should delete a seed usage record', async () => {
        mockService.deleteSeedUsage.mockResolvedValue(undefined);

        const result = await controller.deleteSeedUsage(1);

        expect(mockService.deleteSeedUsage).toHaveBeenCalledWith(1);
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Seed usage record deleted successfully',
        });
      });
    });
  });

  describe('Prediction Endpoints', () => {
    describe('GET /seed-demand-predictor/predict', () => {
      const queryDto: PredictionQueryDto = {
        region: 'North Region',
        season: PredictionSeason.SPRING,
        seedVariety: 'Wheat Premium',
        yearsBack: 5,
        predictionYear: 2024,
      };

      it('should generate seed demand predictions', async () => {
        const predictions = [mockPrediction];
        mockService.predictSeedDemand.mockResolvedValue(predictions);

        const result = await controller.predictSeedDemand(queryDto);

        expect(mockService.predictSeedDemand).toHaveBeenCalledWith(queryDto);
        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.message).toBe('Seed demand predictions generated successfully');
        expect(result.data.predictions).toEqual(predictions);
        expect(result.data.summary).toHaveProperty('totalPredictions');
        expect(result.data.summary).toHaveProperty('averageConfidence');
        expect(result.data.summary).toHaveProperty('totalPredictedDemand');
      });

      it('should calculate correct summary statistics', async () => {
        const predictions = [mockPrediction, { ...mockPrediction, predictedDemand: 40, confidence: 75 }];
        mockService.predictSeedDemand.mockResolvedValue(predictions);

        const result = await controller.predictSeedDemand(queryDto);

        expect(result.data.summary.totalPredictions).toBe(2);
        expect(result.data.summary.averageConfidence).toBe(80); // (85 + 75) / 2
        expect(result.data.summary.totalPredictedDemand).toBe(100.5); // 60.5 + 40
      });
    });

    describe('GET /seed-demand-predictor/predict/bulk', () => {
      const bulkQueryDto: BulkPredictionQueryDto = {
        regions: ['North Region', 'South Region'],
        seasons: [PredictionSeason.SPRING],
        seedVarieties: ['Wheat Premium'],
        yearsBack: 3,
        predictionYear: 2024,
      };

      it('should generate bulk predictions', async () => {
        const predictions = [
          mockPrediction,
          { ...mockPrediction, region: 'South Region', predictedDemand: 45 },
        ];
        mockService.bulkPredictDemand.mockResolvedValue(predictions);

        const result = await controller.bulkPredictDemand(bulkQueryDto);

        expect(mockService.bulkPredictDemand).toHaveBeenCalledWith(bulkQueryDto);
        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.message).toBe('Bulk seed demand predictions generated successfully');
        expect(result.data.predictions).toEqual(predictions);
        expect(result.data.summary.regionCount).toBe(2); // Unique regions
        expect(result.data.summary.varietyCount).toBe(1); // Unique varieties
      });
    });

    describe('GET /seed-demand-predictor/regional-summary/:region', () => {
      const mockRegionalSummary = {
        region: 'North Region',
        totalPredictedDemand: 150.5,
        topSeeds: [
          { variety: 'Wheat Premium', demand: 60.5, percentage: 40.2 },
          { variety: 'Corn Hybrid', demand: 45.0, percentage: 29.9 },
        ],
        seasonalBreakdown: {
          [PredictionSeason.SPRING]: 80,
          [PredictionSeason.SUMMER]: 40,
          [PredictionSeason.FALL]: 30.5,
          [PredictionSeason.WINTER]: 0,
        },
        growthRate: 12.5,
      };

      it('should return regional demand summary', async () => {
        mockService.getRegionalSummary.mockResolvedValue(mockRegionalSummary);

        const result = await controller.getRegionalSummary('North Region', 2024);

        expect(mockService.getRegionalSummary).toHaveBeenCalledWith('North Region', 2024);
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Regional demand summary for North Region retrieved successfully',
          data: mockRegionalSummary,
        });
      });

      it('should handle optional year parameter', async () => {
        mockService.getRegionalSummary.mockResolvedValue(mockRegionalSummary);

        const result = await controller.getRegionalSummary('North Region');

        expect(mockService.getRegionalSummary).toHaveBeenCalledWith('North Region', undefined);
        expect(result.statusCode).toBe(HttpStatus.OK);
      });
    });

    describe('GET /seed-demand-predictor/analytics', () => {
      const mockAnalytics = {
        totalFarmers: 150,
        totalRegions: 12,
        dataPointsAnalyzed: 1250,
        trendsIdentified: [
          {
            type: 'increasing' as const,
            description: 'Overall seed demand increasing by 8.5% annually',
            confidence: 82,
          },
          {
            type: 'stable' as const,
            description: 'Wheat varieties showing stable demand patterns',
            confidence: 75,
          },
        ],
      };

      it('should return prediction analytics', async () => {
        mockService.getPredictionAnalytics.mockResolvedValue(mockAnalytics);

        const result = await controller.getPredictionAnalytics();

        expect(mockService.getPredictionAnalytics).toHaveBeenCalled();
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Prediction analytics retrieved successfully',
          data: mockAnalytics,
        });
      });
    });
  });

  describe('Health Check and Status Endpoints', () => {
    describe('GET /seed-demand-predictor/health', () => {
      it('should return health status', async () => {
        const result = await controller.healthCheck();

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.message).toBe('Seed Demand Predictor service is healthy');
        expect(result.data.status).toBe('healthy');
        expect(result.data.service).toBe('seed-demand-predictor');
        expect(result.data).toHaveProperty('timestamp');
        expect(result.data).toHaveProperty('uptime');
      });
    });

    describe('GET /seed-demand-predictor/status', () => {
      it('should return service status information', async () => {
        const result = await controller.getServiceStatus();

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.message).toBe('Service status retrieved successfully');
        expect(result.data.service).toBe('Seed Demand Predictor');
        expect(result.data.version).toBe('1.0.0');
        expect(Array.isArray(result.data.features)).toBe(true);
        expect(result.data.features.length).toBeGreaterThan(0);
        expect(Array.isArray(result.data.endpoints)).toBe(true);
        expect(result.data.endpoints.length).toBe(3); // Three endpoint categories
      });

      it('should contain all expected endpoint categories', async () => {
        const result = await controller.getServiceStatus();

        const categories = result.data.endpoints.map(e => e.category);
        expect(categories).toContain('Data Management');
        expect(categories).toContain('Predictions');
        expect(categories).toContain('Service Health');
      });

      it('should contain expected features', async () => {
        const result = await controller.getServiceStatus();

        expect(result.data.features).toContain('Historical seed usage tracking');
        expect(result.data.features).toContain('Advanced demand prediction algorithms');
        expect(result.data.features).toContain('Regional demand analysis');
        expect(result.data.features).toContain('Trend identification');
        expect(result.data.features).toContain('Confidence scoring');
        expect(result.data.features).toContain('Bulk predictions');
        expect(result.data.features).toContain('Analytics and reporting');
      });
    });
  });

  describe('Data Validation', () => {
    it('should handle edge case predictions with zero values', async () => {
      const queryDto: PredictionQueryDto = {
        region: 'Test Region',
        yearsBack: 1,
      };

      const emptyPredictions: any[] = [];
      mockService.predictSeedDemand.mockResolvedValue(emptyPredictions);

      const result = await controller.predictSeedDemand(queryDto);

      expect(result.data.summary.totalPredictions).toBe(0);
      expect(result.data.summary.averageConfidence).toBe(0);
      expect(result.data.summary.totalPredictedDemand).toBe(0);
    });

    it('should handle bulk predictions with mixed regions and varieties', async () => {
      const bulkQueryDto: BulkPredictionQueryDto = {
        regions: ['Region A', 'Region B', 'Region C'],
        seedVarieties: ['Variety 1', 'Variety 2'],
        yearsBack: 2,
      };

      const mixedPredictions = [
        { ...mockPrediction, region: 'Region A', seedVariety: 'Variety 1' },
        { ...mockPrediction, region: 'Region B', seedVariety: 'Variety 1' },
        { ...mockPrediction, region: 'Region A', seedVariety: 'Variety 2' },
        { ...mockPrediction, region: 'Region C', seedVariety: 'Variety 2' },
      ];

      mockService.bulkPredictDemand.mockResolvedValue(mixedPredictions);

      const result = await controller.bulkPredictDemand(bulkQueryDto);

      expect(result.data.summary.regionCount).toBe(3);
      expect(result.data.summary.varietyCount).toBe(2);
      expect(result.data.predictions.length).toBe(4);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors correctly', async () => {
      const createDto: CreateSeedUsageDto = {
        farmerId: 1,
        farmerName: 'Test Farmer',
        seedVariety: 'Test Variety',
        quantityUsed: 10,
        areaPlanted: 1,
        season: PredictionSeason.SPRING,
        year: 2023,
        region: 'Test Region',
      };

      const error = new Error('Database connection failed');
      mockService.createSeedUsage.mockRejectedValue(error);

      await expect(controller.createSeedUsage(createDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle prediction service errors', async () => {
      const queryDto: PredictionQueryDto = {
        region: 'Invalid Region',
        yearsBack: 5,
      };

      const error = new Error('No historical data found');
      mockService.predictSeedDemand.mockRejectedValue(error);

      await expect(controller.predictSeedDemand(queryDto)).rejects.toThrow('No historical data found');
    });
  });
});
