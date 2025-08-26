import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainTransaction, TransactionStatus } from '../entities/blockchain-transaction.entity';
import { AuditLog, AuditStatus } from '../entities/audit-log.entity';
import { FlareNetworkService } from './flare-network.service';

export interface AlertConfig {
  enableAlerts: boolean;
  maxGasPrice: string;
  minConfirmations: number;
  webhookUrl?: string;
}

export interface SystemAlert {
  type: 'gas_price' | 'transaction_failed' | 'confirmation_delay' | 'network_issue' | 'wallet_balance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class BlockchainMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainMonitoringService.name);
  private readonly alertConfig: AlertConfig;
  private alerts: SystemAlert[] = [];
  private readonly maxAlerts = 1000;

  constructor(
    @InjectRepository(BlockchainTransaction)
    private readonly blockchainTransactionRepository: Repository<BlockchainTransaction>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly flareNetworkService: FlareNetworkService,
    private readonly configService: ConfigService,
  ) {
    this.alertConfig = {
      enableAlerts: this.configService.get<boolean>('monitoring.enableAlerts', true),
      maxGasPrice: this.configService.get<string>('monitoring.maxGasPrice', '100000000000'),
      minConfirmations: this.configService.get<number>('monitoring.minConfirmations', 3),
      webhookUrl: this.configService.get<string>('monitoring.alertWebhookUrl'),
    };
  }

  async onModuleInit() {
    this.logger.log('Blockchain Monitoring Service initialized');
    this.logger.log(`Alerts: ${this.alertConfig.enableAlerts ? 'enabled' : 'disabled'}`);
    this.logger.log(`Max gas price: ${this.alertConfig.maxGasPrice} wei`);
    this.logger.log(`Min confirmations: ${this.alertConfig.minConfirmations}`);
  }

  /**
   * Monitor pending transactions for confirmations
   * Runs every 2 minutes
   */
  @Cron(CronExpression.EVERY_2_MINUTES)
  async monitorPendingTransactions(): Promise<void> {
    try {
      this.logger.debug('Monitoring pending blockchain transactions');

      const pendingTransactions = await this.blockchainTransactionRepository.find({
        where: { status: TransactionStatus.SUBMITTED },
        relations: ['auditLog'],
        take: 100, // Limit to avoid overwhelming the system
      });

      if (pendingTransactions.length === 0) {
        this.logger.debug('No pending transactions to monitor');
        return;
      }

      this.logger.log(`Monitoring ${pendingTransactions.length} pending transactions`);

      for (const transaction of pendingTransactions) {
        try {
          await this.checkTransactionStatus(transaction);
        } catch (error) {
          this.logger.error(`Failed to check transaction ${transaction.transactionHash}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to monitor pending transactions: ${error.message}`);
    }
  }

  /**
   * Monitor gas prices and network health
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async monitorNetworkHealth(): Promise<void> {
    try {
      this.logger.debug('Monitoring network health');

      const networkStatus = await this.flareNetworkService.getNetworkStatus();

      if (!networkStatus.isConnected) {
        await this.createAlert({
          type: 'network_issue',
          severity: 'critical',
          message: 'Lost connection to Flare Network',
          details: { networkStatus },
          timestamp: new Date(),
        });
        return;
      }

      // Check gas prices
      const currentGasPrice = BigInt(networkStatus.gasPrice);
      const maxGasPrice = BigInt(this.alertConfig.maxGasPrice);

      if (currentGasPrice > maxGasPrice) {
        await this.createAlert({
          type: 'gas_price',
          severity: 'high',
          message: `Gas price exceeded threshold: ${networkStatus.gasPrice} wei`,
          details: {
            currentGasPrice: networkStatus.gasPrice,
            maxGasPrice: this.alertConfig.maxGasPrice,
            networkName: networkStatus.networkName,
          },
          timestamp: new Date(),
        });
      }

      // Check wallet balance
      if (networkStatus.walletBalance) {
        const balance = parseFloat(networkStatus.walletBalance);
        if (balance < 0.1) { // Less than 0.1 FLR
          await this.createAlert({
            type: 'wallet_balance',
            severity: balance < 0.01 ? 'critical' : 'high',
            message: `Low wallet balance: ${balance} FLR`,
            details: {
              balance: networkStatus.walletBalance,
              networkName: networkStatus.networkName,
            },
            timestamp: new Date(),
          });
        }
      }

      this.logger.debug(`Network health check completed: ${networkStatus.networkName}`);
    } catch (error) {
      this.logger.error(`Network health monitoring failed: ${error.message}`);
      
      await this.createAlert({
        type: 'network_issue',
        severity: 'high',
        message: `Network health check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Check individual transaction status
   */
  private async checkTransactionStatus(transaction: BlockchainTransaction): Promise<void> {
    try {
      const receipt = await this.flareNetworkService.getTransactionReceipt(transaction.transactionHash);

      if (!receipt) {
        // Transaction not yet mined, check if it's been too long
        const submittedAt = transaction.submittedAt || transaction.createdAt;
        const timeSinceSubmission = Date.now() - submittedAt.getTime();
        
        if (timeSinceSubmission > 30 * 60 * 1000) { // 30 minutes
          await this.createAlert({
            type: 'confirmation_delay',
            severity: 'medium',
            message: `Transaction confirmation delayed: ${transaction.transactionHash}`,
            details: {
              transactionHash: transaction.transactionHash,
              timeSinceSubmission: Math.round(timeSinceSubmission / 1000 / 60),
              auditLogId: transaction.auditLog?.id,
            },
            timestamp: new Date(),
          });
        }
        return;
      }

      // Update transaction with receipt data
      transaction.blockNumber = receipt.blockNumber;
      transaction.blockHash = receipt.blockHash;
      transaction.transactionIndex = receipt.transactionIndex;
      transaction.gasUsed = receipt.gasUsed;
      transaction.effectiveGasPrice = receipt.effectiveGasPrice;
      transaction.logs = receipt.logs;
      transaction.confirmedAt = new Date();

      if (receipt.status === 1) {
        // Transaction successful
        transaction.status = TransactionStatus.CONFIRMED;
        
        // Update audit log status
        if (transaction.auditLog) {
          transaction.auditLog.status = AuditStatus.BLOCKCHAIN_CONFIRMED;
          transaction.auditLog.blockchainConfirmedAt = new Date();
          await this.auditLogRepository.save(transaction.auditLog);
        }

        this.logger.log(`Transaction confirmed: ${transaction.transactionHash} (Block: ${receipt.blockNumber})`);
      } else {
        // Transaction failed
        transaction.status = TransactionStatus.REVERTED;
        transaction.revertReason = 'Transaction reverted';
        transaction.failedAt = new Date();

        // Update audit log status
        if (transaction.auditLog) {
          transaction.auditLog.status = AuditStatus.FAILED;
          transaction.auditLog.lastError = 'Blockchain transaction reverted';
          await this.auditLogRepository.save(transaction.auditLog);
        }

        await this.createAlert({
          type: 'transaction_failed',
          severity: 'high',
          message: `Transaction reverted: ${transaction.transactionHash}`,
          details: {
            transactionHash: transaction.transactionHash,
            blockNumber: receipt.blockNumber,
            auditLogId: transaction.auditLog?.id,
          },
          timestamp: new Date(),
        });

        this.logger.error(`Transaction reverted: ${transaction.transactionHash}`);
      }

      await this.blockchainTransactionRepository.save(transaction);
    } catch (error) {
      this.logger.error(`Failed to check transaction status for ${transaction.transactionHash}: ${error.message}`);
      
      // Mark transaction as failed after multiple check failures
      const timeSinceSubmission = Date.now() - (transaction.submittedAt || transaction.createdAt).getTime();
      if (timeSinceSubmission > 60 * 60 * 1000) { // 1 hour
        transaction.status = TransactionStatus.FAILED;
        transaction.errorMessage = error.message;
        transaction.failedAt = new Date();
        
        if (transaction.auditLog) {
          transaction.auditLog.status = AuditStatus.FAILED;
          transaction.auditLog.lastError = `Transaction monitoring failed: ${error.message}`;
          await this.auditLogRepository.save(transaction.auditLog);
        }

        await this.blockchainTransactionRepository.save(transaction);
      }
    }
  }

  /**
   * Create system alert
   */
  private async createAlert(alert: SystemAlert): Promise<void> {
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    this.logger.warn(`ALERT [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);

    // Send webhook notification if configured
    if (this.alertConfig.webhookUrl && this.alertConfig.enableAlerts) {
      try {
        await this.sendWebhookAlert(alert);
      } catch (error) {
        this.logger.error(`Failed to send webhook alert: ${error.message}`);
      }
    }
  }

  /**
   * Send alert via webhook
   */
  private async sendWebhookAlert(alert: SystemAlert): Promise<void> {
    if (!this.alertConfig.webhookUrl) return;

    try {
      const payload = {
        text: `🚨 FarmAssist Blockchain Alert`,
        attachments: [
          {
            color: this.getAlertColor(alert.severity),
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
              { title: 'Message', value: alert.message, short: false },
              { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true },
            ],
          },
        ],
      };

      // In a real implementation, you would use an HTTP client to send this
      this.logger.debug(`Webhook alert payload prepared for ${alert.type}`);
    } catch (error) {
      this.logger.error(`Failed to prepare webhook alert: ${error.message}`);
    }
  }

  /**
   * Get alert color based on severity
   */
  private getAlertColor(severity: string): string {
    const colors = {
      low: '#36a64f',      // Green
      medium: '#ff9500',   // Orange
      high: '#ff0000',     // Red
      critical: '#8b0000', // Dark Red
    };
    return colors[severity] || '#808080';
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24): SystemAlert[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoffTime);
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStatistics(): Promise<{
    networkStatus: any;
    transactionMetrics: {
      pending: number;
      confirmed: number;
      failed: number;
      averageConfirmationTime: number;
    };
    alertSummary: {
      total: number;
      bySeverity: Record<string, number>;
      byType: Record<string, number>;
    };
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      issues: string[];
    };
  }> {
    try {
      const networkStatus = await this.flareNetworkService.getNetworkStatus();
      
      // Transaction metrics
      const pending = await this.blockchainTransactionRepository.count({
        where: { status: TransactionStatus.SUBMITTED }
      });
      const confirmed = await this.blockchainTransactionRepository.count({
        where: { status: TransactionStatus.CONFIRMED }
      });
      const failed = await this.blockchainTransactionRepository.count({
        where: { status: TransactionStatus.FAILED }
      });

      // Calculate average confirmation time
      const confirmedTxs = await this.blockchainTransactionRepository.find({
        where: { status: TransactionStatus.CONFIRMED },
        select: ['submittedAt', 'confirmedAt'],
        take: 100,
        order: { confirmedAt: 'DESC' },
      });

      const averageConfirmationTime = confirmedTxs.length > 0
        ? confirmedTxs.reduce((sum, tx) => {
            if (tx.submittedAt && tx.confirmedAt) {
              return sum + (tx.confirmedAt.getTime() - tx.submittedAt.getTime());
            }
            return sum;
          }, 0) / confirmedTxs.length
        : 0;

      // Alert summary
      const recentAlerts = this.getRecentAlerts(24);
      const alertSummary = {
        total: recentAlerts.length,
        bySeverity: this.groupAlertsBySeverity(recentAlerts),
        byType: this.groupAlertsByType(recentAlerts),
      };

      // System health assessment
      const systemHealth = this.assessSystemHealth(networkStatus, { pending, confirmed, failed }, recentAlerts);

      return {
        networkStatus,
        transactionMetrics: {
          pending,
          confirmed,
          failed,
          averageConfirmationTime: Math.round(averageConfirmationTime),
        },
        alertSummary,
        systemHealth,
      };
    } catch (error) {
      this.logger.error(`Failed to get monitoring statistics: ${error.message}`);
      throw new Error(`Monitoring statistics failed: ${error.message}`);
    }
  }

  /**
   * Force check all pending transactions
   */
  async forceCheckPendingTransactions(): Promise<{
    checked: number;
    confirmed: number;
    failed: number;
    stillPending: number;
  }> {
    try {
      this.logger.log('Force checking all pending transactions');

      const pendingTransactions = await this.blockchainTransactionRepository.find({
        where: { status: TransactionStatus.SUBMITTED },
        relations: ['auditLog'],
      });

      let confirmed = 0;
      let failed = 0;
      let stillPending = 0;

      for (const transaction of pendingTransactions) {
        try {
          const receipt = await this.flareNetworkService.getTransactionReceipt(transaction.transactionHash);
          
          if (receipt) {
            if (receipt.status === 1) {
              confirmed++;
              transaction.status = TransactionStatus.CONFIRMED;
            } else {
              failed++;
              transaction.status = TransactionStatus.REVERTED;
            }
            
            // Update transaction details
            transaction.blockNumber = receipt.blockNumber;
            transaction.gasUsed = receipt.gasUsed;
            transaction.effectiveGasPrice = receipt.effectiveGasPrice;
            transaction.confirmedAt = new Date();
            
            await this.blockchainTransactionRepository.save(transaction);
            
            // Update audit log
            if (transaction.auditLog) {
              transaction.auditLog.status = receipt.status === 1 
                ? AuditStatus.BLOCKCHAIN_CONFIRMED 
                : AuditStatus.FAILED;
              transaction.auditLog.blockchainConfirmedAt = new Date();
              await this.auditLogRepository.save(transaction.auditLog);
            }
          } else {
            stillPending++;
          }
        } catch (error) {
          this.logger.error(`Failed to check transaction ${transaction.transactionHash}: ${error.message}`);
          stillPending++;
        }
      }

      this.logger.log(`Force check completed: ${confirmed} confirmed, ${failed} failed, ${stillPending} still pending`);

      return {
        checked: pendingTransactions.length,
        confirmed,
        failed,
        stillPending,
      };
    } catch (error) {
      this.logger.error(`Force check failed: ${error.message}`);
      throw new Error(`Force check failed: ${error.message}`);
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    lastChecked: Date;
  }> {
    try {
      const networkStatus = await this.flareNetworkService.getNetworkStatus();
      const recentAlerts = this.getRecentAlerts(1); // Last hour
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check network connectivity
      if (!networkStatus.isConnected) {
        issues.push('Network connection lost');
        recommendations.push('Check Flare Network RPC endpoint configuration');
      }

      // Check wallet balance
      if (networkStatus.walletBalance) {
        const balance = parseFloat(networkStatus.walletBalance);
        if (balance < 0.01) {
          issues.push(`Critical wallet balance: ${balance} FLR`);
          recommendations.push('Add funds to wallet immediately');
        } else if (balance < 0.1) {
          issues.push(`Low wallet balance: ${balance} FLR`);
          recommendations.push('Consider adding funds to wallet');
        }
      }

      // Check recent alerts
      const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
      const highAlerts = recentAlerts.filter(alert => alert.severity === 'high');

      if (criticalAlerts.length > 0) {
        issues.push(`${criticalAlerts.length} critical alerts in the last hour`);
        recommendations.push('Review and address critical alerts immediately');
      }

      if (highAlerts.length > 3) {
        issues.push(`${highAlerts.length} high-severity alerts in the last hour`);
        recommendations.push('Investigate recurring high-severity issues');
      }

      // Check pending transactions
      const pendingCount = await this.blockchainTransactionRepository.count({
        where: { status: TransactionStatus.SUBMITTED }
      });

      if (pendingCount > 50) {
        issues.push(`High number of pending transactions: ${pendingCount}`);
        recommendations.push('Check network congestion and gas prices');
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalAlerts.length > 0 || !networkStatus.isConnected) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'warning';
      }

      return {
        status,
        issues,
        recommendations,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error(`System health check failed: ${error.message}`);
      return {
        status: 'critical',
        issues: [`Health check failed: ${error.message}`],
        recommendations: ['Check system configuration and network connectivity'],
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Clear old alerts
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearOldAlerts(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffTime);
    
    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      this.logger.log(`Cleared ${removedCount} old alerts`);
    }
  }

  // Private helper methods
  private groupAlertsBySeverity(alerts: SystemAlert[]): Record<string, number> {
    const groups = { low: 0, medium: 0, high: 0, critical: 0 };
    alerts.forEach(alert => {
      groups[alert.severity]++;
    });
    return groups;
  }

  private groupAlertsByType(alerts: SystemAlert[]): Record<string, number> {
    const groups: Record<string, number> = {};
    alerts.forEach(alert => {
      groups[alert.type] = (groups[alert.type] || 0) + 1;
    });
    return groups;
  }

  private assessSystemHealth(
    networkStatus: any,
    transactionMetrics: any,
    recentAlerts: SystemAlert[]
  ): { status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
    const issues: string[] = [];
    
    if (!networkStatus.isConnected) {
      issues.push('Network disconnected');
    }
    
    if (transactionMetrics.pending > 20) {
      issues.push('High number of pending transactions');
    }
    
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical alerts`);
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0 || !networkStatus.isConnected) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { status, issues };
  }
}
