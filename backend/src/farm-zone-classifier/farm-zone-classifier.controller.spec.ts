import { Test, TestingModule } from '@nestjs/testing';
import { FarmZoneClassifierController } from './farm-zone-classifier.controller';
import { FarmZoneClassifierService } from './farm-zone-classifier.service';
import { ProductivityZone } from './entities/farm-zone.entity';
import { CreateFarmZoneDto } from './dto/create-farm-zone.dto';
import { UpdateFarmZoneDto } from './dto/update-farm-zone.dto';
import { ClassifyFarmDto, BulkClassifyFarmsDto } from './dto/classify-farm.dto';
import { ClassificationResultDto, BulkClassificationResultDto } from './dto/farm-zone-response.dto';

describe('FarmZoneClassifierController', () => {
  let controller: FarmZoneClassifierController;
  let service: FarmZoneClassifierService;

  const mockHistoricalData = {
    yields: [3.5, 4.0, 3.8, 4.2, 3.9],
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [7.5, 8.0, 7.8, 8.2, 7.9],
    moistureLevels: [55, 60, 58, 62, 59],
  };

  const mockFarmZone = {
    id: 'farm-zone-1',
    farmProfile: {
      id: 'farm-profile-1',
      farmSize: 10.5,
      latitude: 10.5,
      longitude: 7.4,
      cropType: 'Maize',
      farmerName: 'John Doe',
      farmerContact: '+234123456789',
    },
    zoneType: ProductivityZone.HIGH_YIELD,
    historicalData: mockHistoricalData,
    averageYield: 3.88,
    productivityScore: 85.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClassificationResult: ClassificationResultDto = {
    farmProfileId: 'farm-profile-1',
    zoneType: ProductivityZone.HIGH_YIELD,
    productivityScore: 85.5,
    averageYield: 3.88,
    confidence: 95,
    factors: {
      yieldConsistency: 88,
      soilQuality: 78,
      moistureAdequacy: 100,
      seasonalPerformance: 75,
    },
    recommendations: [
      'Maintain current farming practices',
      'Consider expanding cultivation area',
    ],
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByFarmProfile: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    classifyFarm: jest.fn(),
    bulkClassifyFarms: jest.fn(),
    getZoneStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmZoneClassifierController],
      providers: [
        {
          provide: FarmZoneClassifierService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FarmZoneClassifierController>(FarmZoneClassifierController);
    service = module.get<FarmZoneClassifierService>(FarmZoneClassifierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new farm zone', async () => {
      const createDto: CreateFarmZoneDto = {
        farmProfileId: 'farm-profile-1',
        historicalData: mockHistoricalData,
      };

      mockService.create.mockResolvedValue(mockFarmZone);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockFarmZone);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all farm zones', async () => {
      mockService.findAll.mockResolvedValue([mockFarmZone]);

      const result = await controller.findAll();

      expect(result).toEqual([mockFarmZone]);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered farm zones by zone type', async () => {
      mockService.findAll.mockResolvedValue([mockFarmZone]);

      const result = await controller.findAll(ProductivityZone.HIGH_YIELD);

      expect(result).toEqual([mockFarmZone]);
      expect(service.findAll).toHaveBeenCalledWith(ProductivityZone.HIGH_YIELD);
    });
  });

  describe('getStatistics', () => {
    it('should return zone statistics', async () => {
      const mockStats = {
        [ProductivityZone.HIGH_YIELD]: 5,
        [ProductivityZone.MODERATE_YIELD]: 10,
        [ProductivityZone.LOW_YIELD]: 3,
      };

      mockService.getZoneStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(result).toEqual(mockStats);
      expect(service.getZoneStatistics).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a specific farm zone', async () => {
      mockService.findOne.mockResolvedValue(mockFarmZone);

      const result = await controller.findOne('farm-zone-1');

      expect(result).toEqual(mockFarmZone);
      expect(service.findOne).toHaveBeenCalledWith('farm-zone-1');
    });
  });

  describe('findByFarmProfile', () => {
    it('should return farm zone by farm profile ID', async () => {
      mockService.findByFarmProfile.mockResolvedValue(mockFarmZone);

      const result = await controller.findByFarmProfile('farm-profile-1');

      expect(result).toEqual(mockFarmZone);
      expect(service.findByFarmProfile).toHaveBeenCalledWith('farm-profile-1');
    });

    it('should return message when no farm zone found', async () => {
      mockService.findByFarmProfile.mockResolvedValue(null);

      const result = await controller.findByFarmProfile('farm-profile-1');

      expect(result).toEqual({ message: 'No farm zone classification found for this farm profile' });
    });
  });

  describe('update', () => {
    it('should update a farm zone', async () => {
      const updateDto: UpdateFarmZoneDto = {
        averageYield: 4.0,
        productivityScore: 90,
      };

      const updatedFarmZone = { ...mockFarmZone, ...updateDto };
      mockService.update.mockResolvedValue(updatedFarmZone);

      const result = await controller.update('farm-zone-1', updateDto);

      expect(result).toEqual(updatedFarmZone);
      expect(service.update).toHaveBeenCalledWith('farm-zone-1', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a farm zone', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('farm-zone-1');

      expect(service.remove).toHaveBeenCalledWith('farm-zone-1');
    });
  });

  describe('classifyFarm', () => {
    it('should classify a single farm', async () => {
      const classifyDto: ClassifyFarmDto = {
        farmProfileId: 'farm-profile-1',
        forceRecalculation: false,
      };

      mockService.classifyFarm.mockResolvedValue(mockClassificationResult);

      const result = await controller.classifyFarm(classifyDto);

      expect(result).toEqual(mockClassificationResult);
      expect(service.classifyFarm).toHaveBeenCalledWith(classifyDto);
    });
  });

  describe('bulkClassifyFarms', () => {
    it('should classify multiple farms in bulk', async () => {
      const bulkClassifyDto: BulkClassifyFarmsDto = {
        farmProfileIds: ['farm-profile-1', 'farm-profile-2'],
        forceRecalculation: false,
      };

      const mockBulkResult: BulkClassificationResultDto = {
        totalProcessed: 2,
        successful: 2,
        failed: 0,
        results: [mockClassificationResult],
        errors: [],
      };

      mockService.bulkClassifyFarms.mockResolvedValue(mockBulkResult);

      const result = await controller.bulkClassifyFarms(bulkClassifyDto);

      expect(result).toEqual(mockBulkResult);
      expect(service.bulkClassifyFarms).toHaveBeenCalledWith(bulkClassifyDto);
    });
  });
});
