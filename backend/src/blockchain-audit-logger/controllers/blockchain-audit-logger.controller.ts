import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { BlockchainAuditLoggerService } from '../services/blockchain-audit-logger.service';
import { FlareNetworkService } from '../services/flare-network.service';
import { BlockchainMonitoringService } from '../services/blockchain-monitoring.service';
import {
  CreateAuditLogDto,
  BulkCreateAuditLogDto,
  QueryAuditLogsDto,
  AuditLogResponseDto,
  BulkAuditResultDto,
  AuditVerificationDto,
  AuditStatisticsDto,
} from '../dto/audit-log.dto';
import { AuditEventType } from '../entities/audit-log.entity';

/**
 * Standalone Blockchain Audit Logger Controller
 * 
 * This controller provides REST API endpoints for blockchain audit logging
 * functionality. It's completely independent from other backend modules.
 * 
 * Features:
 * - Secure audit log creation and management
 * - Blockchain transaction monitoring
 * - Data integrity verification
 * - Performance monitoring and analytics
 * - System health monitoring
 */
@ApiTags('Blockchain Audit Logger')
@Controller('blockchain-audit-logger')
@ApiBearerAuth()
export class BlockchainAuditLoggerController {
  private readonly logger = new Logger(BlockchainAuditLoggerController.name);

  constructor(
    private readonly blockchainAuditLoggerService: BlockchainAuditLoggerService,
    private readonly flareNetworkService: FlareNetworkService,
    private readonly blockchainMonitoringService: BlockchainMonitoringService,
  ) {}

  @Post('audit-logs')
  @ApiOperation({ 
    summary: 'Create a new audit log entry',
    description: 'Creates a new audit log entry with secure hashing and queues it for blockchain submission'
  })
  @ApiBody({ type: CreateAuditLogDto })
  @ApiResponse({
    status: 201,
    description: 'Audit log created successfully',
    type: AuditLogResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createAuditLog(@Body(ValidationPipe) createAuditLogDto: CreateAuditLogDto) {
    this.logger.log(`Creating audit log: ${createAuditLogDto.eventType}`);
    return await this.blockchainAuditLoggerService.createAuditLog(createAuditLogDto);
  }

  @Post('audit-logs/bulk')
  @ApiOperation({ 
    summary: 'Create multiple audit log entries in bulk',
    description: 'Creates multiple audit logs with optional Merkle tree optimization for efficient blockchain submission'
  })
  @ApiBody({ type: BulkCreateAuditLogDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk audit logs created successfully',
    type: BulkAuditResultDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async createBulkAuditLogs(@Body(ValidationPipe) bulkCreateDto: BulkCreateAuditLogDto) {
    this.logger.log(`Creating bulk audit logs: ${bulkCreateDto.auditLogs.length} items`);
    return await this.blockchainAuditLoggerService.createBulkAuditLogs(bulkCreateDto);
  }

  @Get('audit-logs')
  @ApiOperation({ 
    summary: 'Get audit logs with filtering and pagination',
    description: 'Retrieves audit logs with optional filtering by event type, user, entity, date range, etc.'
  })
  @ApiQuery({ name: 'eventType', required: false, enum: AuditEventType })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max 1000' })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'onlyBlockchainConfirmed', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/AuditLogResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getAuditLogs(@Query(ValidationPipe) queryDto: QueryAuditLogsDto) {
    return await this.blockchainAuditLoggerService.getAuditLogs(queryDto);
  }

  @Get('audit-logs/:id')
  @ApiOperation({ 
    summary: 'Get specific audit log by ID',
    description: 'Retrieves detailed information about a specific audit log including blockchain transactions'
  })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log details',
    type: AuditLogResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLog(@Param('id') id: string) {
    const auditLogs = await this.blockchainAuditLoggerService.getAuditLogs({
      entityId: id,
      limit: 1,
    });
    
    if (auditLogs.data.length === 0) {
      throw new Error('Audit log not found');
    }
    
    return auditLogs.data[0];
  }

  @Post('audit-logs/:id/verify')
  @ApiOperation({ 
    summary: 'Verify audit log integrity',
    description: 'Verifies data integrity, Merkle proof, and blockchain confirmation for an audit log'
  })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log verification result',
    type: AuditVerificationDto,
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async verifyAuditLog(@Param('id') id: string) {
    return await this.blockchainAuditLoggerService.verifyAuditLog(id);
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get comprehensive audit statistics',
    description: 'Returns detailed statistics about audit logs, blockchain transactions, and system performance'
  })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics',
    type: AuditStatisticsDto,
  })
  async getStatistics() {
    return await this.blockchainAuditLoggerService.getAuditStatistics();
  }

  @Get('network/status')
  @ApiOperation({ 
    summary: 'Get Flare Network connection status',
    description: 'Returns current network status, connection health, and configuration details'
  })
  @ApiResponse({
    status: 200,
    description: 'Network status information',
    schema: {
      type: 'object',
      properties: {
        isConnected: { type: 'boolean' },
        chainId: { type: 'number' },
        blockNumber: { type: 'number' },
        gasPrice: { type: 'string' },
        walletBalance: { type: 'string' },
        networkName: { type: 'string' },
      },
    },
  })
  async getNetworkStatus() {
    return await this.flareNetworkService.getNetworkStatus();
  }

  @Get('network/configuration')
  @ApiOperation({ 
    summary: 'Get service configuration status',
    description: 'Returns configuration status including provider, wallet, and contract initialization'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration status',
    schema: {
      type: 'object',
      properties: {
        hasProvider: { type: 'boolean' },
        hasWallet: { type: 'boolean' },
        hasContract: { type: 'boolean' },
        networkType: { type: 'string' },
        contractAddress: { type: 'string' },
        walletAddress: { type: 'string' },
      },
    },
  })
  async getConfiguration() {
    return this.flareNetworkService.getConfigurationStatus();
  }

  @Get('monitoring/health')
  @ApiOperation({ 
    summary: 'Get system health status',
    description: 'Returns overall system health including network connectivity, wallet balance, and recent issues'
  })
  @ApiResponse({
    status: 200,
    description: 'System health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        lastChecked: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getSystemHealth() {
    return await this.blockchainMonitoringService.getSystemHealth();
  }

  @Get('monitoring/statistics')
  @ApiOperation({ 
    summary: 'Get monitoring statistics',
    description: 'Returns comprehensive monitoring statistics including transaction metrics and alert summaries'
  })
  @ApiResponse({
    status: 200,
    description: 'Monitoring statistics',
  })
  async getMonitoringStatistics() {
    return await this.blockchainMonitoringService.getMonitoringStatistics();
  }

  @Post('monitoring/force-check')
  @ApiOperation({ 
    summary: 'Force check all pending transactions',
    description: 'Manually triggers a check of all pending blockchain transactions'
  })
  @ApiResponse({
    status: 200,
    description: 'Force check completed',
    schema: {
      type: 'object',
      properties: {
        checked: { type: 'number' },
        confirmed: { type: 'number' },
        failed: { type: 'number' },
        stillPending: { type: 'number' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async forceCheckTransactions() {
    this.logger.log('Force checking pending transactions requested');
    return await this.blockchainMonitoringService.forceCheckPendingTransactions();
  }

  @Get('gas/estimate')
  @ApiOperation({ 
    summary: 'Estimate gas costs for audit operations',
    description: 'Returns current gas price and estimated costs for different types of audit operations'
  })
  @ApiQuery({ name: 'eventType', required: false, enum: AuditEventType })
  @ApiQuery({ name: 'batchSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Gas estimation results',
    schema: {
      type: 'object',
      properties: {
        currentGasPrice: { type: 'string' },
        singleEventEstimate: {
          type: 'object',
          properties: {
            gasEstimate: { type: 'string' },
            gasPrice: { type: 'string' },
            estimatedCost: { type: 'string' },
          },
        },
        batchEventEstimate: {
          type: 'object',
          properties: {
            gasEstimate: { type: 'string' },
            gasPrice: { type: 'string' },
            estimatedCost: { type: 'string' },
          },
        },
      },
    },
  })
  async estimateGasCosts(
    @Query('eventType') eventType: AuditEventType = AuditEventType.SYSTEM_EVENT,
    @Query('batchSize') batchSize: number = 10,
  ) {
    try {
      const currentGasPrice = await this.flareNetworkService.getCurrentGasPrice();
      
      // Estimate for single event
      const singleEventEstimate = await this.flareNetworkService.estimateGasForAuditEvent(
        '0'.repeat(64), // Dummy hash
        eventType,
        { test: true },
      );

      // Estimate for batch (simplified calculation)
      const batchGasEstimate = (BigInt(singleEventEstimate.gasEstimate) * BigInt(batchSize) / 2n).toString(); // Batch is more efficient
      const batchEstimatedCost = (BigInt(batchGasEstimate) * BigInt(currentGasPrice)).toString();

      return {
        currentGasPrice,
        singleEventEstimate,
        batchEventEstimate: {
          gasEstimate: batchGasEstimate,
          gasPrice: currentGasPrice,
          estimatedCost: batchEstimatedCost,
        },
      };
    } catch (error) {
      this.logger.error(`Gas estimation failed: ${error.message}`);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }
}
