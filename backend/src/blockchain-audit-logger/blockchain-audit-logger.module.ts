import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainAuditLoggerService } from './services/blockchain-audit-logger.service';
import { FlareNetworkService } from './services/flare-network.service';
import { AuditHashingService } from './services/audit-hashing.service';
import { BlockchainMonitoringService } from './services/blockchain-monitoring.service';
import { BlockchainAuditLoggerController } from './controllers/blockchain-audit-logger.controller';
import { AuditLog } from './entities/audit-log.entity';
import { BlockchainTransaction } from './entities/blockchain-transaction.entity';

/**
 * Standalone Blockchain Audit Logger Module for Flare Network
 * 
 * This module is completely independent from the rest of the backend and provides:
 * - Secure hashing of critical data
 * - Blockchain transaction logging to Flare Network
 * - Audit trail verification and retrieval
 * - Transaction monitoring and alerting
 * 
 * Features:
 * - EVM-compatible smart contract interaction
 * - Merkle tree-based data integrity
 * - Automatic retry mechanisms
 * - Gas optimization strategies
 * - Real-time transaction monitoring
 */
@Module({
  imports: [
    ConfigModule.forFeature(() => ({
      // Flare Network Configuration
      flare: {
        mainnet: {
          rpcUrl: process.env.FLARE_MAINNET_RPC || 'https://flare-api.flare.network/ext/C/rpc',
          chainId: 14,
          name: 'Flare Mainnet',
        },
        testnet: {
          rpcUrl: process.env.FLARE_TESTNET_RPC || 'https://coston2-api.flare.network/ext/C/rpc',
          chainId: 114,
          name: 'Flare Testnet Coston2',
        },
        contractAddress: process.env.AUDIT_CONTRACT_ADDRESS,
        privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
        gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),
        gasPrice: process.env.GAS_PRICE || '25000000000', // 25 gwei
      },
      // Audit Configuration
      audit: {
        enableBlockchainLogging: process.env.ENABLE_BLOCKCHAIN_LOGGING === 'true',
        batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || '10'),
        retryAttempts: parseInt(process.env.AUDIT_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.AUDIT_RETRY_DELAY || '5000'),
        hashAlgorithm: process.env.HASH_ALGORITHM || 'sha256',
        enableMerkleTree: process.env.ENABLE_MERKLE_TREE === 'true',
      },
      // Monitoring Configuration
      monitoring: {
        enableAlerts: process.env.ENABLE_BLOCKCHAIN_ALERTS === 'true',
        maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000', // 100 gwei
        minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '3'),
        alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
      },
    })),
    TypeOrmModule.forFeature([AuditLog, BlockchainTransaction]),
  ],
  controllers: [BlockchainAuditLoggerController],
  providers: [
    BlockchainAuditLoggerService,
    FlareNetworkService,
    AuditHashingService,
    BlockchainMonitoringService,
  ],
  exports: [
    BlockchainAuditLoggerService,
    AuditHashingService,
  ],
})
export class BlockchainAuditLoggerModule {
  constructor() {
    console.log('🔗 Blockchain Audit Logger Module initialized');
    console.log('📋 Features: Flare Network integration, secure hashing, audit trails');
    console.log('🔒 Security: Merkle trees, transaction verification, gas optimization');
  }
}
