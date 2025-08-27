import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditEventType } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @IsEnum(AuditEventType)
  eventType: AuditEventType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  originalData: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BulkCreateAuditLogDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuditLogDto)
  auditLogs: CreateAuditLogDto[];

  @IsOptional()
  @IsBoolean()
  enableBatching?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  batchSize?: number = 10;
}

export class VerifyAuditLogDto {
  @IsUUID()
  auditLogId: string;

  @IsOptional()
  @IsString()
  expectedHash?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  merkleProof?: string[];
}

export class QueryAuditLogsDto {
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  fromDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  toDate?: string; // ISO date string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsBoolean()
  onlyBlockchainConfirmed?: boolean = false;
}

export class AuditLogResponseDto {
  id: string;
  eventType: AuditEventType;
  status: string;
  description: string;
  dataHash: string;
  merkleRoot?: string;
  userId?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  retryCount: number;
  lastError?: string;
  blockchainSubmittedAt?: Date;
  blockchainConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  blockchainTransactions?: Array<{
    id: string;
    transactionHash: string;
    status: string;
    networkType: string;
    blockNumber?: number;
    confirmations: number;
    gasUsed?: string;
    totalGasCost?: string;
    explorerUrl: string;
  }>;
  isBlockchainConfirmed: boolean;
  processingTimeMs?: number;
}

export class BulkAuditResultDto {
  totalSubmitted: number;
  successful: number;
  failed: number;
  batchesCreated: number;
  results: Array<{
    auditLogId: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  estimatedBlockchainCost: {
    totalGasEstimate: string;
    estimatedCostWei: string;
    estimatedCostEth: string;
  };
}

export class AuditVerificationDto {
  auditLogId: string;
  isValid: boolean;
  dataHash: string;
  blockchainHash?: string;
  merkleVerification?: {
    isValid: boolean;
    merkleRoot: string;
    proof: string[];
  };
  blockchainVerification?: {
    isConfirmed: boolean;
    confirmations: number;
    blockNumber?: number;
    transactionHash?: string;
  };
  verifiedAt: Date;
}

export class AuditStatisticsDto {
  totalAuditLogs: number;
  statusDistribution: Record<string, number>;
  eventTypeDistribution: Record<string, number>;
  blockchainMetrics: {
    totalTransactions: number;
    confirmedTransactions: number;
    failedTransactions: number;
    averageConfirmationTime: number;
    totalGasCost: string;
  };
  performanceMetrics: {
    averageProcessingTime: number;
    successRate: number;
    retryRate: number;
  };
  timeRangeAnalysis: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}
