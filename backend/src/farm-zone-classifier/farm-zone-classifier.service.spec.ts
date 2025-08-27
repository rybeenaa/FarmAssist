import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FarmZoneClassifierService } from './farm-zone-classifier.service';
import { FarmZone, ProductivityZone } from './entities/farm-zone.entity';
import { FarmProfile } from '../farm-profile/farm-profile.entity';
import { CreateFarmZoneDto } from './dto/create-farm-zone.dto';
import { UpdateFarmZoneDto } from './dto/update-farm-zone.dto';

describe('FarmZoneClassifierService', () => {
  let service: FarmZoneClassifierService;
  let farmZoneRepository: Repository<FarmZone>;
  let farmProfileRepository: Repository<FarmProfile>;

  const mockFarmProfile: FarmProfile = {
    id: 'farm-profile-1',
    farmSize: 10.5,
    latitude: 10.5,
    longitude: 7.4,
    cropType: 'Maize',
    farmerName: 'John Doe',
    farmerContact: '+234123456789',
  };

  const mockHistoricalData = {
    yields: [3.5, 4.0, 3.8, 4.2, 3.9],
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [7.5, 8.0, 7.8, 8.2, 7.9],
    moistureLevels: [55, 60, 58, 62, 59],
  };

  const mockFarmZone: FarmZone = {
    id: 'farm-zone-1',
    farmProfile: mockFarmProfile,
    zoneType: ProductivityZone.HIGH_YIELD,
    historicalData: mockHistoricalData,
    averageYield: 3.88,
    productivityScore: 85.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFarmZoneRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockFarmProfileRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmZoneClassifierService,
        {
          provide: getRepositoryToken(FarmZone),
          useValue: mockFarmZoneRepository,
        },
        {
          provide: getRepositoryToken(FarmProfile),
          useValue: mockFarmProfileRepository,
        },
      ],
    }).compile();

    service = module.get<FarmZoneClassifierService>(FarmZoneClassifierService);
    farmZoneRepository = module.get<Repository<FarmZone>>(getRepositoryToken(FarmZone));
    farmProfileRepository = module.get<Repository<FarmProfile>>(getRepositoryToken(FarmProfile));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createFarmZoneDto: CreateFarmZoneDto = {
      farmProfileId: 'farm-profile-1',
      historicalData: mockHistoricalData,
    };

    it('should create a new farm zone successfully', async () => {
      mockFarmProfileRepository.findOne.mockResolvedValue(mockFarmProfile);
      mockFarmZoneRepository.findOne.mockResolvedValue(null); // No existing zone
      mockFarmZoneRepository.create.mockReturnValue(mockFarmZone);
      mockFarmZoneRepository.save.mockResolvedValue(mockFarmZone);

      const result = await service.create(createFarmZoneDto);

      expect(result).toEqual(mockFarmZone);
      expect(mockFarmProfileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'farm-profile-1' }
      });
      expect(mockFarmZoneRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when farm profile does not exist', async () => {
      mockFarmProfileRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createFarmZoneDto)).rejects.toThrow(NotFoundException);
      expect(mockFarmProfileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'farm-profile-1' }
      });
    });

    it('should throw BadRequestException when farm zone already exists', async () => {
      mockFarmProfileRepository.findOne.mockResolvedValue(mockFarmProfile);
      mockFarmZoneRepository.findOne.mockResolvedValue(mockFarmZone); // Existing zone

      await expect(service.create(createFarmZoneDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all farm zones', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockFarmZone]),
      };
      mockFarmZoneRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual([mockFarmZone]);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('farmZone.farmProfile', 'farmProfile');
    });

    it('should filter by zone type when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockFarmZone]),
      };
      mockFarmZoneRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(ProductivityZone.HIGH_YIELD);

      expect(result).toEqual([mockFarmZone]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('farmZone.zoneType = :zoneType', { 
        zoneType: ProductivityZone.HIGH_YIELD 
      });
    });
  });

  describe('findOne', () => {
    it('should return a farm zone by ID', async () => {
      mockFarmZoneRepository.findOne.mockResolvedValue(mockFarmZone);

      const result = await service.findOne('farm-zone-1');

      expect(result).toEqual(mockFarmZone);
      expect(mockFarmZoneRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'farm-zone-1' },
        relations: ['farmProfile']
      });
    });

    it('should throw NotFoundException when farm zone does not exist', async () => {
      mockFarmZoneRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateFarmZoneDto: UpdateFarmZoneDto = {
      historicalData: {
        yields: [4.0, 4.5, 4.2, 4.8, 4.3],
        seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
        soilQualityScores: [8.0, 8.5, 8.2, 8.8, 8.3],
        moistureLevels: [60, 65, 62, 68, 63],
      },
    };

    it('should update a farm zone successfully', async () => {
      mockFarmZoneRepository.findOne.mockResolvedValue(mockFarmZone);
      mockFarmZoneRepository.save.mockResolvedValue({ ...mockFarmZone, ...updateFarmZoneDto });

      const result = await service.update('farm-zone-1', updateFarmZoneDto);

      expect(mockFarmZoneRepository.save).toHaveBeenCalled();
      expect(result.historicalData).toEqual(updateFarmZoneDto.historicalData);
    });
  });

  describe('remove', () => {
    it('should remove a farm zone successfully', async () => {
      mockFarmZoneRepository.findOne.mockResolvedValue(mockFarmZone);
      mockFarmZoneRepository.remove.mockResolvedValue(mockFarmZone);

      await service.remove('farm-zone-1');

      expect(mockFarmZoneRepository.remove).toHaveBeenCalledWith(mockFarmZone);
    });
  });

  describe('classifyFarm', () => {
    it('should classify a farm and return classification result', async () => {
      mockFarmProfileRepository.findOne.mockResolvedValue(mockFarmProfile);
      mockFarmZoneRepository.findOne.mockResolvedValue(null); // No existing zone
      mockFarmZoneRepository.create.mockReturnValue(mockFarmZone);
      mockFarmZoneRepository.save.mockResolvedValue(mockFarmZone);

      const result = await service.classifyFarm({ farmProfileId: 'farm-profile-1' });

      expect(result).toHaveProperty('farmProfileId', 'farm-profile-1');
      expect(result).toHaveProperty('zoneType');
      expect(result).toHaveProperty('productivityScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('getZoneStatistics', () => {
    it('should return zone statistics', async () => {
      const mockStats = [
        { zoneType: ProductivityZone.HIGH_YIELD, count: '5' },
        { zoneType: ProductivityZone.MODERATE_YIELD, count: '10' },
        { zoneType: ProductivityZone.LOW_YIELD, count: '3' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStats),
      };
      mockFarmZoneRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getZoneStatistics();

      expect(result).toEqual({
        [ProductivityZone.HIGH_YIELD]: 5,
        [ProductivityZone.MODERATE_YIELD]: 10,
        [ProductivityZone.LOW_YIELD]: 3,
      });
    });
  });
});
