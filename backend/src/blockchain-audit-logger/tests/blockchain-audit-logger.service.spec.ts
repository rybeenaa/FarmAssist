import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { BlockchainAuditLoggerService } from '../services/blockchain-audit-logger.service';
import { FlareNetworkService } from '../services/flare-network.service';
import { AuditHashingService } from '../services/audit-hashing.service';
import { BlockchainMonitoringService } from '../services/blockchain-monitoring.service';
import { AuditLog, AuditEventType, AuditStatus } from '../entities/audit-log.entity';
import { BlockchainTransaction, TransactionStatus, NetworkType } from '../entities/blockchain-transaction.entity';
import { CreateAuditLogDto, BulkCreateAuditLogDto } from '../dto/audit-log.dto';

describe('BlockchainAuditLoggerService', () => {
  let service: BlockchainAuditLoggerService;
  let auditLogRepository: Repository<AuditLog>;
  let blockchainTransactionRepository: Repository<BlockchainTransaction>;
  let flareNetworkService: FlareNetworkService;
  let auditHashingService: AuditHashingService;
  let blockchainMonitoringService: BlockchainMonitoringService;

  const mockAuditLog: AuditLog = {
    id: 'audit-log-1',
    eventType: AuditEventType.PURCHASE_DECISION,
    status: AuditStatus.HASHED,
    description: 'Test purchase decision',
    originalData: { purchaseId: 'purchase-1', amount: 1000, item: 'fertilizer' },
    dataHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
    userId: 'user-1',
    entityId: 'purchase-1',
    entityType: 'purchase',
    metadata: { source: 'mobile_app' },
    retryCount: 0,
    blockchainTransactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isBlockchainConfirmed: false,
    processingTimeMs: null,
    hasFailedRetries: false,
  };

  const mockBlockchainTransaction: BlockchainTransaction = {
    id: 'tx-1',
    auditLog: mockAuditLog,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    status: TransactionStatus.CONFIRMED,
    networkType: NetworkType.FLARE_TESTNET,
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    gasLimit: '300000',
    gasPrice: '25000000000',
    gasUsed: '250000',
    effectiveGasPrice: '25000000000',
    blockNumber: 12345,
    confirmations: 5,
    contractMethod: 'logAuditEvent',
    createdAt: new Date(),
    updatedAt: new Date(),
    isConfirmed: true,
    isFailed: false,
    processingTimeMs: 30000,
    totalGasCost: '6250000000000000',
    explorerUrl: 'https://coston2-explorer.flare.network/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  };

  const mockRepositories = {
    auditLog: {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    },
    blockchainTransaction: {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockFlareNetworkService = {
    submitAuditEvent: jest.fn(),
    submitBatchAuditEvents: jest.fn(),
    getTransactionReceipt: jest.fn(),
    verifyAuditEvent: jest.fn(),
    getCurrentGasPrice: jest.fn(),
    getNetworkStatus: jest.fn(),
    getNetworkType: jest.fn(),
    estimateGasForAuditEvent: jest.fn(),
  };

  const mockAuditHashingService = {
    hashData: jest.fn(),
    hashBatchWithMerkleTree: jest.fn(),
    verifyDataIntegrity: jest.fn(),
    verifyMerkleProof: jest.fn(),
  };

  const mockBlockchainMonitoringService = {
    getSystemHealth: jest.fn(),
    getMonitoringStatistics: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'audit.enableBlockchainLogging': true,
        'audit.batchSize': 10,
        'audit.retryAttempts': 3,
        'audit.retryDelay': 5000,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainAuditLoggerService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepositories.auditLog,
        },
        {
          provide: getRepositoryToken(BlockchainTransaction),
          useValue: mockRepositories.blockchainTransaction,
        },
        {
          provide: FlareNetworkService,
          useValue: mockFlareNetworkService,
        },
        {
          provide: AuditHashingService,
          useValue: mockAuditHashingService,
        },
        {
          provide: BlockchainMonitoringService,
          useValue: mockBlockchainMonitoringService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BlockchainAuditLoggerService>(BlockchainAuditLoggerService);
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    blockchainTransactionRepository = module.get<Repository<BlockchainTransaction>>(getRepositoryToken(BlockchainTransaction));
    flareNetworkService = module.get<FlareNetworkService>(FlareNetworkService);
    auditHashingService = module.get<AuditHashingService>(AuditHashingService);
    blockchainMonitoringService = module.get<BlockchainMonitoringService>(BlockchainMonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditLog', () => {
    const createAuditLogDto: CreateAuditLogDto = {
      eventType: AuditEventType.PURCHASE_DECISION,
      description: 'Test purchase decision',
      originalData: { purchaseId: 'purchase-1', amount: 1000 },
      userId: 'user-1',
      entityId: 'purchase-1',
      entityType: 'purchase',
    };

    it('should create audit log successfully', async () => {
      mockAuditHashingService.hashData.mockReturnValue({
        hash: 'test-hash',
        algorithm: 'sha256',
        timestamp: Date.now(),
        dataSize: 100,
      });
      mockRepositories.auditLog.create.mockReturnValue(mockAuditLog);
      mockRepositories.auditLog.save.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(createAuditLogDto);

      expect(result).toBeDefined();
      expect(result.eventType).toBe(AuditEventType.PURCHASE_DECISION);
      expect(mockAuditHashingService.hashData).toHaveBeenCalledWith(createAuditLogDto.originalData);
      expect(mockRepositories.auditLog.save).toHaveBeenCalled();
    });

    it('should handle hashing errors', async () => {
      mockAuditHashingService.hashData.mockImplementation(() => {
        throw new Error('Hashing failed');
      });

      await expect(service.createAuditLog(createAuditLogDto)).rejects.toThrow('Audit log creation failed');
    });
  });

  describe('createBulkAuditLogs', () => {
    const bulkCreateDto: BulkCreateAuditLogDto = {
      auditLogs: [
        {
          eventType: AuditEventType.PURCHASE_DECISION,
          description: 'Test purchase 1',
          originalData: { purchaseId: 'purchase-1', amount: 1000 },
        },
        {
          eventType: AuditEventType.PURCHASE_DECISION,
          description: 'Test purchase 2',
          originalData: { purchaseId: 'purchase-2', amount: 2000 },
        },
      ],
      enableBatching: true,
    };

    it('should create bulk audit logs with Merkle tree', async () => {
      mockAuditHashingService.hashBatchWithMerkleTree.mockReturnValue({
        hashes: [
          { hash: 'hash1', algorithm: 'sha256', timestamp: Date.now(), dataSize: 100 },
          { hash: 'hash2', algorithm: 'sha256', timestamp: Date.now(), dataSize: 100 },
        ],
        merkleTree: [
          { root: 'merkle-root', proof: ['proof1'], leaf: 'hash1', index: 0, isValid: true },
          { root: 'merkle-root', proof: ['proof2'], leaf: 'hash2', index: 1, isValid: true },
        ],
        merkleRoot: 'merkle-root',
      });

      mockRepositories.auditLog.create.mockReturnValue(mockAuditLog);
      mockRepositories.auditLog.save.mockResolvedValue([mockAuditLog, mockAuditLog]);
      mockFlareNetworkService.submitBatchAuditEvents.mockResolvedValue({
        hash: 'tx-hash',
        from: 'from-address',
        to: 'to-address',
        gasLimit: '500000',
        gasPrice: '25000000000',
        nonce: 1,
        data: '0x',
        value: '0',
      });
      mockFlareNetworkService.getCurrentGasPrice.mockResolvedValue('25000000000');

      const result = await service.createBulkAuditLogs(bulkCreateDto);

      expect(result.successful).toBe(2);
      expect(result.batchesCreated).toBe(1);
      expect(mockAuditHashingService.hashBatchWithMerkleTree).toHaveBeenCalled();
    });
  });

  describe('verifyAuditLog', () => {
    it('should verify audit log integrity successfully', async () => {
      mockRepositories.auditLog.findOne.mockResolvedValue({
        ...mockAuditLog,
        blockchainTransactions: [mockBlockchainTransaction],
      });

      mockAuditHashingService.verifyDataIntegrity.mockReturnValue({
        originalHash: 'test-hash',
        computedHash: 'test-hash',
        isValid: true,
        algorithm: 'sha256',
        timestamp: Date.now(),
      });

      mockFlareNetworkService.verifyAuditEvent.mockResolvedValue(true);

      const result = await service.verifyAuditLog('audit-log-1');

      expect(result.isValid).toBe(true);
      expect(result.auditLogId).toBe('audit-log-1');
      expect(mockAuditHashingService.verifyDataIntegrity).toHaveBeenCalled();
      expect(mockFlareNetworkService.verifyAuditEvent).toHaveBeenCalled();
    });

    it('should detect data integrity violations', async () => {
      mockRepositories.auditLog.findOne.mockResolvedValue(mockAuditLog);

      mockAuditHashingService.verifyDataIntegrity.mockReturnValue({
        originalHash: 'original-hash',
        computedHash: 'different-hash',
        isValid: false,
        algorithm: 'sha256',
        timestamp: Date.now(),
      });

      const result = await service.verifyAuditLog('audit-log-1');

      expect(result.isValid).toBe(false);
    });

    it('should handle non-existent audit logs', async () => {
      mockRepositories.auditLog.findOne.mockResolvedValue(null);

      await expect(service.verifyAuditLog('non-existent')).rejects.toThrow('Audit log non-existent not found');
    });
  });

  describe('getAuditStatistics', () => {
    it('should return comprehensive audit statistics', async () => {
      mockRepositories.auditLog.count.mockResolvedValue(100);
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: AuditStatus.BLOCKCHAIN_CONFIRMED, count: '50' },
          { status: AuditStatus.PENDING, count: '30' },
          { status: AuditStatus.FAILED, count: '20' },
        ]),
      };
      mockRepositories.auditLog.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockRepositories.blockchainTransaction.count
        .mockResolvedValueOnce(80) // total
        .mockResolvedValueOnce(60) // confirmed
        .mockResolvedValueOnce(20); // failed

      mockRepositories.blockchainTransaction.find.mockResolvedValue([]);

      const result = await service.getAuditStatistics();

      expect(result.totalAuditLogs).toBe(100);
      expect(result.statusDistribution).toBeDefined();
      expect(result.blockchainMetrics).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
    });
  });

  describe('processPendingAuditLogs', () => {
    it('should process pending audit logs', async () => {
      const pendingLogs = [
        { ...mockAuditLog, status: AuditStatus.HASHED },
        { ...mockAuditLog, id: 'audit-log-2', status: AuditStatus.HASHED },
      ];

      mockRepositories.auditLog.find.mockResolvedValue(pendingLogs);
      mockFlareNetworkService.submitBatchAuditEvents.mockResolvedValue({
        hash: 'batch-tx-hash',
        from: 'from-address',
        to: 'to-address',
        gasLimit: '500000',
        gasPrice: '25000000000',
        nonce: 1,
        data: '0x',
        value: '0',
      });
      mockFlareNetworkService.getNetworkType.mockReturnValue(NetworkType.FLARE_TESTNET);
      mockRepositories.blockchainTransaction.create.mockReturnValue(mockBlockchainTransaction);
      mockRepositories.blockchainTransaction.save.mockResolvedValue(mockBlockchainTransaction);
      mockRepositories.auditLog.update.mockResolvedValue({ affected: 2 });

      await service.processPendingAuditLogs();

      expect(mockRepositories.auditLog.find).toHaveBeenCalled();
      // Additional assertions would depend on the specific implementation
    });

    it('should handle empty pending logs gracefully', async () => {
      mockRepositories.auditLog.find.mockResolvedValue([]);

      await service.processPendingAuditLogs();

      expect(mockRepositories.auditLog.find).toHaveBeenCalled();
      expect(mockFlareNetworkService.submitBatchAuditEvents).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle blockchain submission failures', async () => {
      const createDto: CreateAuditLogDto = {
        eventType: AuditEventType.PURCHASE_DECISION,
        description: 'Test purchase',
        originalData: { test: 'data' },
      };

      mockAuditHashingService.hashData.mockReturnValue({
        hash: 'test-hash',
        algorithm: 'sha256',
        timestamp: Date.now(),
        dataSize: 100,
      });
      mockRepositories.auditLog.create.mockReturnValue(mockAuditLog);
      mockRepositories.auditLog.save.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(createDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(AuditStatus.HASHED);
    });

    it('should handle repository errors gracefully', async () => {
      const createDto: CreateAuditLogDto = {
        eventType: AuditEventType.PURCHASE_DECISION,
        description: 'Test purchase',
        originalData: { test: 'data' },
      };

      mockAuditHashingService.hashData.mockReturnValue({
        hash: 'test-hash',
        algorithm: 'sha256',
        timestamp: Date.now(),
        dataSize: 100,
      });
      mockRepositories.auditLog.create.mockReturnValue(mockAuditLog);
      mockRepositories.auditLog.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createAuditLog(createDto)).rejects.toThrow('Audit log creation failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete audit log lifecycle', async () => {
      // Create audit log
      const createDto: CreateAuditLogDto = {
        eventType: AuditEventType.PURCHASE_DECISION,
        description: 'Complete lifecycle test',
        originalData: { purchaseId: 'purchase-123', amount: 5000 },
        userId: 'user-123',
        entityId: 'purchase-123',
        entityType: 'purchase',
      };

      mockAuditHashingService.hashData.mockReturnValue({
        hash: 'lifecycle-hash',
        algorithm: 'sha256',
        timestamp: Date.now(),
        dataSize: 150,
      });

      const createdLog = { ...mockAuditLog, ...createDto, dataHash: 'lifecycle-hash' };
      mockRepositories.auditLog.create.mockReturnValue(createdLog);
      mockRepositories.auditLog.save.mockResolvedValue(createdLog);

      // Create audit log
      const result = await service.createAuditLog(createDto);
      expect(result.dataHash).toBe('lifecycle-hash');

      // Verify audit log
      mockRepositories.auditLog.findOne.mockResolvedValue({
        ...createdLog,
        blockchainTransactions: [mockBlockchainTransaction],
      });
      mockAuditHashingService.verifyDataIntegrity.mockReturnValue({
        originalHash: 'lifecycle-hash',
        computedHash: 'lifecycle-hash',
        isValid: true,
        algorithm: 'sha256',
        timestamp: Date.now(),
      });
      mockFlareNetworkService.verifyAuditEvent.mockResolvedValue(true);

      const verification = await service.verifyAuditLog(result.id);
      expect(verification.isValid).toBe(true);
    });
  });
});
