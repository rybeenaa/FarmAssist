import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { FarmZoneClassifierModule } from './farm-zone-classifier.module';
import { FarmZone, ProductivityZone } from './entities/farm-zone.entity';
import { FarmProfile } from '../farm-profile/farm-profile.entity';

describe('FarmZoneClassifier Integration Tests', () => {
  let app: INestApplication;
  let farmZoneRepository: Repository<FarmZone>;
  let farmProfileRepository: Repository<FarmProfile>;

  const testFarmProfile = {
    farmSize: 15.0,
    latitude: 10.5,
    longitude: 7.4,
    cropType: 'Maize',
    farmerName: 'Test Farmer',
    farmerContact: '+234123456789',
  };

  const testHistoricalData = {
    yields: [4.2, 4.5, 4.1, 4.8, 4.3],
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [8.0, 8.2, 7.9, 8.5, 8.1],
    moistureLevels: [60, 65, 58, 68, 62],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [FarmZone, FarmProfile],
          synchronize: true,
        }),
        FarmZoneClassifierModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    farmZoneRepository = moduleFixture.get('FarmZoneRepository');
    farmProfileRepository = moduleFixture.get('FarmProfileRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await farmZoneRepository.clear();
    await farmProfileRepository.clear();
  });

  describe('POST /farm-zone-classifier', () => {
    it('should create a new farm zone classification', async () => {
      // First create a farm profile
      const farmProfile = await farmProfileRepository.save(testFarmProfile);

      const createDto = {
        farmProfileId: farmProfile.id,
        historicalData: testHistoricalData,
      };

      const response = await request(app.getHttpServer())
        .post('/farm-zone-classifier')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.zoneType).toBe(ProductivityZone.HIGH_YIELD);
      expect(response.body.averageYield).toBeCloseTo(4.38, 1);
      expect(response.body.productivityScore).toBeGreaterThan(80);
    });

    it('should return 404 when farm profile does not exist', async () => {
      const createDto = {
        farmProfileId: 'non-existent-id',
        historicalData: testHistoricalData,
      };

      await request(app.getHttpServer())
        .post('/farm-zone-classifier')
        .send(createDto)
        .expect(404);
    });
  });

  describe('GET /farm-zone-classifier', () => {
    it('should return all farm zone classifications', async () => {
      // Create test data
      const farmProfile = await farmProfileRepository.save(testFarmProfile);
      await farmZoneRepository.save({
        farmProfile,
        zoneType: ProductivityZone.HIGH_YIELD,
        historicalData: testHistoricalData,
        averageYield: 4.38,
        productivityScore: 85.0,
      });

      const response = await request(app.getHttpServer())
        .get('/farm-zone-classifier')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].zoneType).toBe(ProductivityZone.HIGH_YIELD);
    });

    it('should filter by zone type', async () => {
      // Create test data with different zone types
      const farmProfile1 = await farmProfileRepository.save(testFarmProfile);
      const farmProfile2 = await farmProfileRepository.save({
        ...testFarmProfile,
        farmerName: 'Another Farmer',
      });

      await farmZoneRepository.save({
        farmProfile: farmProfile1,
        zoneType: ProductivityZone.HIGH_YIELD,
        historicalData: testHistoricalData,
        averageYield: 4.38,
        productivityScore: 85.0,
      });

      await farmZoneRepository.save({
        farmProfile: farmProfile2,
        zoneType: ProductivityZone.MODERATE_YIELD,
        historicalData: {
          ...testHistoricalData,
          yields: [2.5, 2.8, 2.6, 2.9, 2.7],
        },
        averageYield: 2.7,
        productivityScore: 60.0,
      });

      const response = await request(app.getHttpServer())
        .get('/farm-zone-classifier?zoneType=high-yield')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].zoneType).toBe(ProductivityZone.HIGH_YIELD);
    });
  });

  describe('GET /farm-zone-classifier/statistics', () => {
    it('should return zone statistics', async () => {
      // Create test data with different zone types
      const farmProfile1 = await farmProfileRepository.save(testFarmProfile);
      const farmProfile2 = await farmProfileRepository.save({
        ...testFarmProfile,
        farmerName: 'Another Farmer',
      });

      await farmZoneRepository.save({
        farmProfile: farmProfile1,
        zoneType: ProductivityZone.HIGH_YIELD,
        historicalData: testHistoricalData,
        averageYield: 4.38,
        productivityScore: 85.0,
      });

      await farmZoneRepository.save({
        farmProfile: farmProfile2,
        zoneType: ProductivityZone.MODERATE_YIELD,
        historicalData: testHistoricalData,
        averageYield: 2.7,
        productivityScore: 60.0,
      });

      const response = await request(app.getHttpServer())
        .get('/farm-zone-classifier/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('high-yield', 1);
      expect(response.body).toHaveProperty('moderate-yield', 1);
      expect(response.body).toHaveProperty('low-yield', 0);
    });
  });

  describe('POST /farm-zone-classifier/classify', () => {
    it('should classify a farm and return classification result', async () => {
      const farmProfile = await farmProfileRepository.save(testFarmProfile);

      const classifyDto = {
        farmProfileId: farmProfile.id,
        forceRecalculation: false,
      };

      const response = await request(app.getHttpServer())
        .post('/farm-zone-classifier/classify')
        .send(classifyDto)
        .expect(200);

      expect(response.body).toHaveProperty('farmProfileId', farmProfile.id);
      expect(response.body).toHaveProperty('zoneType');
      expect(response.body).toHaveProperty('productivityScore');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('factors');
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });
  });

  describe('POST /farm-zone-classifier/classify/bulk', () => {
    it('should classify multiple farms in bulk', async () => {
      const farmProfile1 = await farmProfileRepository.save(testFarmProfile);
      const farmProfile2 = await farmProfileRepository.save({
        ...testFarmProfile,
        farmerName: 'Another Farmer',
      });

      const bulkClassifyDto = {
        farmProfileIds: [farmProfile1.id, farmProfile2.id],
        forceRecalculation: false,
      };

      const response = await request(app.getHttpServer())
        .post('/farm-zone-classifier/classify/bulk')
        .send(bulkClassifyDto)
        .expect(200);

      expect(response.body).toHaveProperty('totalProcessed', 2);
      expect(response.body).toHaveProperty('successful', 2);
      expect(response.body).toHaveProperty('failed', 0);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.errors).toHaveLength(0);
    });
  });

  describe('Classification Logic Validation', () => {
    it('should classify high-yield farms correctly', async () => {
      const farmProfile = await farmProfileRepository.save(testFarmProfile);

      const highYieldData = {
        yields: [4.5, 4.8, 4.6, 5.0, 4.7],
        seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
        soilQualityScores: [8.5, 9.0, 8.7, 9.2, 8.8],
        moistureLevels: [55, 60, 58, 62, 59],
      };

      const createDto = {
        farmProfileId: farmProfile.id,
        historicalData: highYieldData,
      };

      const response = await request(app.getHttpServer())
        .post('/farm-zone-classifier')
        .send(createDto)
        .expect(201);

      expect(response.body.zoneType).toBe(ProductivityZone.HIGH_YIELD);
      expect(response.body.productivityScore).toBeGreaterThan(75);
      expect(response.body.averageYield).toBeGreaterThan(3.5);
    });

    it('should classify low-yield farms correctly', async () => {
      const farmProfile = await farmProfileRepository.save(testFarmProfile);

      const lowYieldData = {
        yields: [1.5, 1.8, 1.6, 1.9, 1.7],
        seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
        soilQualityScores: [3.0, 3.5, 3.2, 3.8, 3.3],
        moistureLevels: [25, 30, 28, 32, 29],
      };

      const createDto = {
        farmProfileId: farmProfile.id,
        historicalData: lowYieldData,
      };

      const response = await request(app.getHttpServer())
        .post('/farm-zone-classifier')
        .send(createDto)
        .expect(201);

      expect(response.body.zoneType).toBe(ProductivityZone.LOW_YIELD);
      expect(response.body.averageYield).toBeLessThan(2.0);
    });
  });
});
