import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditLog, AuditEventType, AuditStatus } from '../entities/audit-log.entity';
import { BlockchainTransaction, TransactionStatus, NetworkType } from '../entities/blockchain-transaction.entity';
import { FlareNetworkService } from './flare-network.service';
import { AuditHashingService } from './audit-hashing.service';
import { BlockchainMonitoringService } from './blockchain-monitoring.service';
import {
  CreateAuditLogDto,
  BulkCreateAuditLogDto,
  QueryAuditLogsDto,
  AuditLogResponseDto,
  BulkAuditResultDto,
  AuditVerificationDto,
  AuditStatisticsDto,
} from '../dto/audit-log.dto';

@Injectable()
export class BlockchainAuditLoggerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainAuditLoggerService.name);
  private readonly enableBlockchainLogging: boolean;
  private readonly batchSize: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private isProcessing = false;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(BlockchainTransaction)
    private readonly blockchainTransactionRepository: Repository<BlockchainTransaction>,
    private readonly flareNetworkService: FlareNetworkService,
    private readonly auditHashingService: AuditHashingService,
    private readonly blockchainMonitoringService: BlockchainMonitoringService,
    private readonly configService: ConfigService,
  ) {
    this.enableBlockchainLogging = this.configService.get<boolean>('audit.enableBlockchainLogging', true);
    this.batchSize = this.configService.get<number>('audit.batchSize', 10);
    this.retryAttempts = this.configService.get<number>('audit.retryAttempts', 3);
    this.retryDelay = this.configService.get<number>('audit.retryDelay', 5000);
  }

  async onModuleInit() {
    this.logger.log('Blockchain Audit Logger Service initialized');
    this.logger.log(`Blockchain logging: ${this.enableBlockchainLogging ? 'enabled' : 'disabled'}`);
    this.logger.log(`Batch size: ${this.batchSize}, Retry attempts: ${this.retryAttempts}`);
    
    if (this.enableBlockchainLogging) {
      // Process any pending audit logs on startup
      setTimeout(() => this.processPendingAuditLogs(), 5000);
    }
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(createAuditLogDto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    try {
      this.logger.log(`Creating audit log: ${createAuditLogDto.eventType}`);
      
      // Hash the original data
      const hashResult = this.auditHashingService.hashData(createAuditLogDto.originalData);
      
      // Create audit log entity
      const auditLog = this.auditLogRepository.create({
        eventType: createAuditLogDto.eventType,
        description: createAuditLogDto.description,
        originalData: createAuditLogDto.originalData,
        dataHash: hashResult.hash,
        userId: createAuditLogDto.userId,
        entityId: createAuditLogDto.entityId,
        entityType: createAuditLogDto.entityType,
        metadata: createAuditLogDto.metadata,
        status: AuditStatus.HASHED,
      });

      const savedAuditLog = await this.auditLogRepository.save(auditLog);
      
      // Queue for blockchain submission if enabled
      if (this.enableBlockchainLogging) {
        this.queueForBlockchainSubmission(savedAuditLog.id);
      }

      return this.mapToResponseDto(savedAuditLog);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
      throw new Error(`Audit log creation failed: ${error.message}`);
    }
  }

  /**
   * Create multiple audit logs in bulk
   */
  async createBulkAuditLogs(bulkCreateDto: BulkCreateAuditLogDto): Promise<BulkAuditResultDto> {
    const startTime = Date.now();
    let successful = 0;
    let failed = 0;
    const results: Array<{ auditLogId: string; status: 'success' | 'failed'; error?: string }> = [];

    try {
      this.logger.log(`Creating bulk audit logs: ${bulkCreateDto.auditLogs.length} items`);

      if (bulkCreateDto.enableBatching && this.enableBlockchainLogging) {
        return await this.createBulkAuditLogsWithMerkleTree(bulkCreateDto);
      }

      // Process individually
      for (const auditLogDto of bulkCreateDto.auditLogs) {
        try {
          const auditLog = await this.createAuditLog(auditLogDto);
          results.push({
            auditLogId: auditLog.id,
            status: 'success',
          });
          successful++;
        } catch (error) {
          results.push({
            auditLogId: 'failed',
            status: 'failed',
            error: error.message,
          });
          failed++;
        }
      }

      // Estimate blockchain costs
      const gasEstimate = await this.estimateBlockchainCosts(successful);

      this.logger.log(`Bulk audit log creation completed: ${successful} successful, ${failed} failed (${Date.now() - startTime}ms)`);

      return {
        totalSubmitted: bulkCreateDto.auditLogs.length,
        successful,
        failed,
        batchesCreated: 0,
        results,
        estimatedBlockchainCost: gasEstimate,
      };
    } catch (error) {
      this.logger.error(`Bulk audit log creation failed: ${error.message}`);
      throw new Error(`Bulk creation failed: ${error.message}`);
    }
  }

  /**
   * Create bulk audit logs with Merkle tree optimization
   */
  private async createBulkAuditLogsWithMerkleTree(bulkCreateDto: BulkCreateAuditLogDto): Promise<BulkAuditResultDto> {
    try {
      this.logger.log(`Creating bulk audit logs with Merkle tree: ${bulkCreateDto.auditLogs.length} items`);

      // Hash all data and create Merkle tree
      const merkleResult = this.auditHashingService.hashBatchWithMerkleTree(
        bulkCreateDto.auditLogs.map(dto => dto.originalData)
      );

      const auditLogs: AuditLog[] = [];
      const results: Array<{ auditLogId: string; status: 'success' | 'failed'; error?: string }> = [];

      // Create audit log entries with Merkle proofs
      for (let i = 0; i < bulkCreateDto.auditLogs.length; i++) {
        try {
          const dto = bulkCreateDto.auditLogs[i];
          const hashResult = merkleResult.hashes[i];
          const merkleProof = merkleResult.merkleTree[i];

          const auditLog = this.auditLogRepository.create({
            eventType: dto.eventType,
            description: dto.description,
            originalData: dto.originalData,
            dataHash: hashResult.hash,
            merkleRoot: merkleResult.merkleRoot,
            merkleProof: merkleProof.proof,
            userId: dto.userId,
            entityId: dto.entityId,
            entityType: dto.entityType,
            metadata: dto.metadata,
            status: AuditStatus.HASHED,
          });

          auditLogs.push(auditLog);
        } catch (error) {
          results.push({
            auditLogId: 'failed',
            status: 'failed',
            error: error.message,
          });
        }
      }

      // Save all audit logs
      const savedAuditLogs = await this.auditLogRepository.save(auditLogs);
      
      // Add successful results
      savedAuditLogs.forEach(auditLog => {
        results.push({
          auditLogId: auditLog.id,
          status: 'success',
        });
      });

      // Queue batch for blockchain submission
      if (this.enableBlockchainLogging && savedAuditLogs.length > 0) {
        await this.queueBatchForBlockchainSubmission(savedAuditLogs, merkleResult.merkleRoot);
      }

      // Estimate blockchain costs
      const gasEstimate = await this.estimateBlockchainCosts(1); // One batch transaction

      this.logger.log(`Bulk audit logs with Merkle tree created: ${savedAuditLogs.length} items`);

      return {
        totalSubmitted: bulkCreateDto.auditLogs.length,
        successful: savedAuditLogs.length,
        failed: results.filter(r => r.status === 'failed').length,
        batchesCreated: 1,
        results,
        estimatedBlockchainCost: gasEstimate,
      };
    } catch (error) {
      this.logger.error(`Bulk audit logs with Merkle tree failed: ${error.message}`);
      throw new Error(`Merkle tree bulk creation failed: ${error.message}`);
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(queryDto: QueryAuditLogsDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('auditLog')
        .leftJoinAndSelect('auditLog.blockchainTransactions', 'transactions');

      // Apply filters
      if (queryDto.eventType) {
        queryBuilder.andWhere('auditLog.eventType = :eventType', { eventType: queryDto.eventType });
      }

      if (queryDto.userId) {
        queryBuilder.andWhere('auditLog.userId = :userId', { userId: queryDto.userId });
      }

      if (queryDto.entityId) {
        queryBuilder.andWhere('auditLog.entityId = :entityId', { entityId: queryDto.entityId });
      }

      if (queryDto.entityType) {
        queryBuilder.andWhere('auditLog.entityType = :entityType', { entityType: queryDto.entityType });
      }

      if (queryDto.fromDate) {
        queryBuilder.andWhere('auditLog.createdAt >= :fromDate', { fromDate: new Date(queryDto.fromDate) });
      }

      if (queryDto.toDate) {
        queryBuilder.andWhere('auditLog.createdAt <= :toDate', { toDate: new Date(queryDto.toDate) });
      }

      if (queryDto.onlyBlockchainConfirmed) {
        queryBuilder.andWhere('auditLog.status IN (:...statuses)', {
          statuses: [AuditStatus.BLOCKCHAIN_CONFIRMED, AuditStatus.VERIFIED]
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and get results
      const auditLogs = await queryBuilder
        .orderBy('auditLog.createdAt', 'DESC')
        .skip(queryDto.offset || 0)
        .take(queryDto.limit || 50)
        .getMany();

      const data = auditLogs.map(auditLog => this.mapToResponseDto(auditLog));

      return {
        data,
        total,
        page: Math.floor((queryDto.offset || 0) / (queryDto.limit || 50)) + 1,
        limit: queryDto.limit || 50,
      };
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error.message}`);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyAuditLog(auditLogId: string): Promise<AuditVerificationDto> {
    try {
      const auditLog = await this.auditLogRepository.findOne({
        where: { id: auditLogId },
        relations: ['blockchainTransactions'],
      });

      if (!auditLog) {
        throw new Error(`Audit log ${auditLogId} not found`);
      }

      // Verify data integrity
      const integrityCheck = this.auditHashingService.verifyDataIntegrity(
        auditLog.originalData,
        auditLog.dataHash,
      );

      // Verify Merkle proof if available
      let merkleVerification;
      if (auditLog.merkleRoot && auditLog.merkleProof) {
        const isValidMerkle = this.auditHashingService.verifyMerkleProof(
          auditLog.dataHash,
          auditLog.merkleProof,
          auditLog.merkleRoot,
        );

        merkleVerification = {
          isValid: isValidMerkle,
          merkleRoot: auditLog.merkleRoot,
          proof: auditLog.merkleProof,
        };
      }

      // Verify blockchain confirmation
      let blockchainVerification;
      const confirmedTransaction = auditLog.blockchainTransactions?.find(
        tx => tx.status === TransactionStatus.CONFIRMED
      );

      if (confirmedTransaction) {
        // Verify on blockchain
        const isBlockchainVerified = await this.flareNetworkService.verifyAuditEvent(auditLog.dataHash);
        
        blockchainVerification = {
          isConfirmed: isBlockchainVerified,
          confirmations: confirmedTransaction.confirmations,
          blockNumber: confirmedTransaction.blockNumber,
          transactionHash: confirmedTransaction.transactionHash,
        };
      }

      const isValid = integrityCheck.isValid && 
                     (!merkleVerification || merkleVerification.isValid) &&
                     (!blockchainVerification || blockchainVerification.isConfirmed);

      return {
        auditLogId,
        isValid,
        dataHash: auditLog.dataHash,
        blockchainHash: blockchainVerification?.transactionHash,
        merkleVerification,
        blockchainVerification,
        verifiedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to verify audit log: ${error.message}`);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(): Promise<AuditStatisticsDto> {
    try {
      const totalAuditLogs = await this.auditLogRepository.count();
      
      // Status distribution
      const statusStats = await this.auditLogRepository
        .createQueryBuilder('auditLog')
        .select('auditLog.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('auditLog.status')
        .getRawMany();

      const statusDistribution = {};
      statusStats.forEach(stat => {
        statusDistribution[stat.status] = parseInt(stat.count, 10);
      });

      // Event type distribution
      const eventTypeStats = await this.auditLogRepository
        .createQueryBuilder('auditLog')
        .select('auditLog.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('auditLog.eventType')
        .getRawMany();

      const eventTypeDistribution = {};
      eventTypeStats.forEach(stat => {
        eventTypeDistribution[stat.eventType] = parseInt(stat.count, 10);
      });

      // Blockchain metrics
      const blockchainMetrics = await this.calculateBlockchainMetrics();

      // Performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics();

      // Time range analysis
      const now = new Date();
      const last24Hours = await this.auditLogRepository.count({
        where: { createdAt: Between(new Date(now.getTime() - 24 * 60 * 60 * 1000), now) }
      });
      const last7Days = await this.auditLogRepository.count({
        where: { createdAt: Between(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now) }
      });
      const last30Days = await this.auditLogRepository.count({
        where: { createdAt: Between(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now) }
      });

      return {
        totalAuditLogs,
        statusDistribution,
        eventTypeDistribution,
        blockchainMetrics,
        performanceMetrics,
        timeRangeAnalysis: {
          last24Hours,
          last7Days,
          last30Days,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get audit statistics: ${error.message}`);
      throw new Error(`Statistics calculation failed: ${error.message}`);
    }
  }

  /**
   * Process pending audit logs for blockchain submission
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingAuditLogs(): Promise<void> {
    if (!this.enableBlockchainLogging || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    
    try {
      this.logger.log('Processing pending audit logs for blockchain submission');

      // Get pending audit logs
      const pendingLogs = await this.auditLogRepository.find({
        where: { status: AuditStatus.HASHED },
        take: this.batchSize * 2, // Process multiple batches
        order: { createdAt: 'ASC' },
      });

      if (pendingLogs.length === 0) {
        this.logger.debug('No pending audit logs to process');
        return;
      }

      // Process in batches
      const batches = this.chunkArray(pendingLogs, this.batchSize);
      
      for (const batch of batches) {
        try {
          await this.processBatch(batch);
        } catch (error) {
          this.logger.error(`Failed to process batch: ${error.message}`);
        }
      }

      this.logger.log(`Processed ${pendingLogs.length} audit logs in ${batches.length} batches`);
    } catch (error) {
      this.logger.error(`Failed to process pending audit logs: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retry failed blockchain submissions
   * Runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async retryFailedSubmissions(): Promise<void> {
    if (!this.enableBlockchainLogging) {
      return;
    }

    try {
      this.logger.log('Retrying failed blockchain submissions');

      const failedLogs = await this.auditLogRepository.find({
        where: { 
          status: AuditStatus.FAILED,
          retryCount: { $lt: this.retryAttempts } as any,
        },
        take: 50,
        order: { lastRetryAt: 'ASC' },
      });

      if (failedLogs.length === 0) {
        this.logger.debug('No failed submissions to retry');
        return;
      }

      for (const auditLog of failedLogs) {
        try {
          await this.retryBlockchainSubmission(auditLog);
        } catch (error) {
          this.logger.error(`Retry failed for audit log ${auditLog.id}: ${error.message}`);
        }
      }

      this.logger.log(`Retried ${failedLogs.length} failed submissions`);
    } catch (error) {
      this.logger.error(`Failed to retry submissions: ${error.message}`);
    }
  }

  // Private helper methods continue in next part...
}
