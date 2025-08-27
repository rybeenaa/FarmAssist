import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { BlockchainAuditLoggerModule } from '../blockchain-audit-logger.module';
import { AuditLog, AuditEventType } from '../entities/audit-log.entity';
import { BlockchainTransaction } from '../entities/blockchain-transaction.entity';
import { CreateAuditLogDto, BulkCreateAuditLogDto } from '../dto/audit-log.dto';

describe('Blockchain Audit Logger Integration Tests', () => {
  let app: INestApplication;
  let auditLogRepository: Repository<AuditLog>;
  let blockchainTransactionRepository: Repository<BlockchainTransaction>;

  const testAuditLogDto: CreateAuditLogDto = {
    eventType: AuditEventType.PURCHASE_DECISION,
    description: 'Integration test purchase decision',
    originalData: {
      purchaseId: 'purchase-integration-test-1',
      farmerId: 'farmer-123',
      items: [
        { name: 'Fertilizer', quantity: 50, price: 25.99 },
        { name: 'Seeds', quantity: 100, price: 15.50 },
      ],
      totalAmount: 2849.50,
      timestamp: new Date().toISOString(),
      location: { latitude: 10.5, longitude: 7.4 },
    },
    userId: 'user-integration-test',
    entityId: 'purchase-integration-test-1',
    entityType: 'purchase',
    metadata: {
      source: 'integration_test',
      version: '1.0.0',
      testRun: true,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AuditLog, BlockchainTransaction],
          synchronize: true,
          logging: false,
        }),
        BlockchainAuditLoggerModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    auditLogRepository = moduleFixture.get('AuditLogRepository');
    blockchainTransactionRepository = moduleFixture.get('BlockchainTransactionRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await blockchainTransactionRepository.clear();
    await auditLogRepository.clear();
  });

  describe('POST /blockchain-audit-logger/audit-logs', () => {
    it('should create a new audit log', async () => {
      const response = await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs')
        .send(testAuditLogDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.eventType).toBe(AuditEventType.PURCHASE_DECISION);
      expect(response.body.description).toBe(testAuditLogDto.description);
      expect(response.body).toHaveProperty('dataHash');
      expect(response.body.dataHash).toMatch(/^[a-fA-F0-9]{64}$/); // SHA-256 hex format
      expect(response.body.status).toBe('hashed');
      expect(response.body.userId).toBe(testAuditLogDto.userId);
      expect(response.body.entityId).toBe(testAuditLogDto.entityId);
      expect(response.body.entityType).toBe(testAuditLogDto.entityType);

      // Verify in database
      const auditLog = await auditLogRepository.findOne({
        where: { id: response.body.id }
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.originalData).toEqual(testAuditLogDto.originalData);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        description: 'Missing event type',
        originalData: { test: 'data' },
      };

      await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs')
        .send(invalidDto)
        .expect(400);
    });

    it('should validate event type enum', async () => {
      const invalidDto = {
        ...testAuditLogDto,
        eventType: 'invalid_event_type',
      };

      await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /blockchain-audit-logger/audit-logs/bulk', () => {
    it('should create multiple audit logs in bulk', async () => {
      const bulkDto: BulkCreateAuditLogDto = {
        auditLogs: [
          {
            ...testAuditLogDto,
            description: 'Bulk test 1',
            originalData: { ...testAuditLogDto.originalData, purchaseId: 'bulk-1' },
            entityId: 'bulk-1',
          },
          {
            ...testAuditLogDto,
            description: 'Bulk test 2',
            originalData: { ...testAuditLogDto.originalData, purchaseId: 'bulk-2' },
            entityId: 'bulk-2',
          },
          {
            ...testAuditLogDto,
            description: 'Bulk test 3',
            originalData: { ...testAuditLogDto.originalData, purchaseId: 'bulk-3' },
            entityId: 'bulk-3',
          },
        ],
        enableBatching: true,
        batchSize: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs/bulk')
        .send(bulkDto)
        .expect(201);

      expect(response.body.totalSubmitted).toBe(3);
      expect(response.body.successful).toBe(3);
      expect(response.body.failed).toBe(0);
      expect(response.body.batchesCreated).toBe(1);
      expect(response.body.results).toHaveLength(3);
      expect(response.body).toHaveProperty('estimatedBlockchainCost');

      // Verify all audit logs were created
      const auditLogs = await auditLogRepository.find();
      expect(auditLogs).toHaveLength(3);

      // Check that Merkle tree data was added
      auditLogs.forEach(log => {
        expect(log.merkleRoot).toBeDefined();
        expect(log.merkleProof).toBeDefined();
        expect(log.merkleProof.length).toBeGreaterThan(0);
      });
    });

    it('should handle individual failures in bulk operation', async () => {
      const bulkDto: BulkCreateAuditLogDto = {
        auditLogs: [
          testAuditLogDto,
          {
            ...testAuditLogDto,
            eventType: 'invalid_type' as any, // This should fail validation
          },
          {
            ...testAuditLogDto,
            description: 'Valid bulk test',
            entityId: 'bulk-valid',
          },
        ],
        enableBatching: false, // Disable batching to test individual processing
      };

      const response = await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs/bulk')
        .send(bulkDto)
        .expect(201);

      expect(response.body.totalSubmitted).toBe(3);
      expect(response.body.successful).toBeLessThan(3);
      expect(response.body.failed).toBeGreaterThan(0);
    });
  });

  describe('GET /blockchain-audit-logger/audit-logs', () => {
    beforeEach(async () => {
      // Create test data
      const testLogs = [
        {
          eventType: AuditEventType.PURCHASE_DECISION,
          description: 'Test purchase 1',
          originalData: { purchaseId: 'test-1' },
          dataHash: 'hash1',
          userId: 'user-1',
          entityId: 'purchase-1',
          entityType: 'purchase',
        },
        {
          eventType: AuditEventType.PAYMENT_TRANSACTION,
          description: 'Test payment 1',
          originalData: { paymentId: 'payment-1' },
          dataHash: 'hash2',
          userId: 'user-2',
          entityId: 'payment-1',
          entityType: 'payment',
        },
      ];

      await auditLogRepository.save(testLogs);
    });

    it('should return all audit logs with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/audit-logs')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by event type', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/audit-logs')
        .query({ eventType: AuditEventType.PURCHASE_DECISION })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].eventType).toBe(AuditEventType.PURCHASE_DECISION);
    });

    it('should filter by user ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/audit-logs')
        .query({ userId: 'user-1' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe('user-1');
    });

    it('should apply pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/audit-logs')
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.page).toBe(1);
    });
  });

  describe('POST /blockchain-audit-logger/audit-logs/:id/verify', () => {
    it('should verify audit log integrity', async () => {
      // Create an audit log first
      const createResponse = await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs')
        .send(testAuditLogDto)
        .expect(201);

      const auditLogId = createResponse.body.id;

      // Verify the audit log
      const verifyResponse = await request(app.getHttpServer())
        .post(`/blockchain-audit-logger/audit-logs/${auditLogId}/verify`)
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('auditLogId', auditLogId);
      expect(verifyResponse.body).toHaveProperty('isValid');
      expect(verifyResponse.body).toHaveProperty('dataHash');
      expect(verifyResponse.body).toHaveProperty('verifiedAt');
      expect(verifyResponse.body.isValid).toBe(true);
    });

    it('should handle non-existent audit log', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/blockchain-audit-logger/audit-logs/${nonExistentId}/verify`)
        .expect(500); // Should return error for non-existent log
    });
  });

  describe('GET /blockchain-audit-logger/statistics', () => {
    beforeEach(async () => {
      // Create diverse test data
      const testLogs = [
        {
          eventType: AuditEventType.PURCHASE_DECISION,
          description: 'Purchase 1',
          originalData: { id: 1 },
          dataHash: 'hash1',
          status: 'blockchain_confirmed',
        },
        {
          eventType: AuditEventType.PURCHASE_DECISION,
          description: 'Purchase 2',
          originalData: { id: 2 },
          dataHash: 'hash2',
          status: 'hashed',
        },
        {
          eventType: AuditEventType.PAYMENT_TRANSACTION,
          description: 'Payment 1',
          originalData: { id: 3 },
          dataHash: 'hash3',
          status: 'failed',
        },
      ];

      await auditLogRepository.save(testLogs);
    });

    it('should return comprehensive statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('totalAuditLogs');
      expect(response.body).toHaveProperty('statusDistribution');
      expect(response.body).toHaveProperty('eventTypeDistribution');
      expect(response.body).toHaveProperty('blockchainMetrics');
      expect(response.body).toHaveProperty('performanceMetrics');
      expect(response.body).toHaveProperty('timeRangeAnalysis');

      expect(response.body.totalAuditLogs).toBe(3);
      expect(response.body.statusDistribution).toHaveProperty('blockchain_confirmed', 1);
      expect(response.body.statusDistribution).toHaveProperty('hashed', 1);
      expect(response.body.statusDistribution).toHaveProperty('failed', 1);
    });
  });

  describe('GET /blockchain-audit-logger/network/status', () => {
    it('should return network status', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/network/status')
        .expect(200);

      expect(response.body).toHaveProperty('isConnected');
      expect(response.body).toHaveProperty('chainId');
      expect(response.body).toHaveProperty('networkName');
      
      // In test environment, connection might fail, but structure should be correct
      expect(typeof response.body.isConnected).toBe('boolean');
    });
  });

  describe('GET /blockchain-audit-logger/network/configuration', () => {
    it('should return configuration status', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/network/configuration')
        .expect(200);

      expect(response.body).toHaveProperty('hasProvider');
      expect(response.body).toHaveProperty('hasWallet');
      expect(response.body).toHaveProperty('hasContract');
      expect(response.body).toHaveProperty('networkType');
      
      expect(typeof response.body.hasProvider).toBe('boolean');
      expect(typeof response.body.hasWallet).toBe('boolean');
      expect(typeof response.body.hasContract).toBe('boolean');
    });
  });

  describe('GET /blockchain-audit-logger/monitoring/health', () => {
    it('should return system health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/blockchain-audit-logger/monitoring/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('lastChecked');
      
      expect(['healthy', 'warning', 'critical']).toContain(response.body.status);
      expect(Array.isArray(response.body.issues)).toBe(true);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const incompleteDto = {
        description: 'Missing event type and original data',
      };

      await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs')
        .send(incompleteDto)
        .expect(400);
    });

    it('should handle invalid UUIDs in path parameters', async () => {
      await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs/invalid-uuid/verify')
        .expect(500);
    });
  });

  describe('Performance tests', () => {
    it('should handle large bulk operations efficiently', async () => {
      const largeAuditLogs = Array.from({ length: 50 }, (_, i) => ({
        ...testAuditLogDto,
        description: `Performance test ${i + 1}`,
        originalData: { ...testAuditLogDto.originalData, id: i + 1 },
        entityId: `performance-test-${i + 1}`,
      }));

      const bulkDto: BulkCreateAuditLogDto = {
        auditLogs: largeAuditLogs,
        enableBatching: true,
        batchSize: 25,
      };

      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/blockchain-audit-logger/audit-logs/bulk')
        .send(bulkDto)
        .expect(201);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.successful).toBe(50);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all logs were created
      const auditLogs = await auditLogRepository.find();
      expect(auditLogs).toHaveLength(50);
    });
  });
});
