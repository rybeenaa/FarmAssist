/**
 * Blockchain Audit Logger Usage Examples
 * 
 * This file demonstrates how to integrate and use the Blockchain Audit Logger
 * module in various scenarios within the FarmAssist platform.
 */

import { Injectable, Logger } from '@nestjs/common';
import { BlockchainAuditLoggerService } from '../services/blockchain-audit-logger.service';
import { AuditEventType } from '../entities/audit-log.entity';

@Injectable()
export class AuditLoggerUsageExamples {
  private readonly logger = new Logger(AuditLoggerUsageExamples.name);

  constructor(
    private readonly auditLogger: BlockchainAuditLoggerService,
  ) {}

  /**
   * Example 1: Log Purchase Decision
   * Use case: Track critical purchase decisions for transparency
   */
  async logPurchaseDecision(purchaseData: {
    purchaseId: string;
    farmerId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    paymentMethod: string;
    location: { latitude: number; longitude: number };
  }): Promise<void> {
    try {
      this.logger.log(`Logging purchase decision: ${purchaseData.purchaseId}`);

      await this.auditLogger.createAuditLog({
        eventType: AuditEventType.PURCHASE_DECISION,
        description: `Purchase decision by farmer ${purchaseData.farmerId}`,
        originalData: {
          purchaseId: purchaseData.purchaseId,
          farmerId: purchaseData.farmerId,
          items: purchaseData.items,
          totalAmount: purchaseData.totalAmount,
          paymentMethod: purchaseData.paymentMethod,
          location: purchaseData.location,
          timestamp: new Date().toISOString(),
          // Hash sensitive data
          itemsHash: this.hashSensitiveData(purchaseData.items),
        },
        userId: purchaseData.farmerId,
        entityId: purchaseData.purchaseId,
        entityType: 'purchase',
        metadata: {
          source: 'purchase_service',
          version: '1.0.0',
          itemCount: purchaseData.items.length,
          category: 'agricultural_inputs',
        },
      });

      this.logger.log(`Purchase decision logged to blockchain: ${purchaseData.purchaseId}`);
    } catch (error) {
      this.logger.error(`Failed to log purchase decision: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 2: Log Payment Transaction
   * Use case: Create immutable payment records for financial transparency
   */
  async logPaymentTransaction(paymentData: {
    transactionId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
  }): Promise<void> {
    try {
      this.logger.log(`Logging payment transaction: ${paymentData.transactionId}`);

      await this.auditLogger.createAuditLog({
        eventType: AuditEventType.PAYMENT_TRANSACTION,
        description: `Payment transaction ${paymentData.transactionId}`,
        originalData: {
          transactionId: paymentData.transactionId,
          fromUserId: paymentData.fromUserId,
          toUserId: paymentData.toUserId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          paymentMethod: paymentData.paymentMethod,
          status: paymentData.status,
          timestamp: new Date().toISOString(),
          // Create transaction fingerprint
          transactionFingerprint: this.createTransactionFingerprint(paymentData),
        },
        userId: paymentData.fromUserId,
        entityId: paymentData.transactionId,
        entityType: 'payment',
        metadata: {
          source: 'payment_service',
          paymentMethod: paymentData.paymentMethod,
          currency: paymentData.currency,
          riskLevel: this.assessTransactionRisk(paymentData),
        },
      });

      this.logger.log(`Payment transaction logged to blockchain: ${paymentData.transactionId}`);
    } catch (error) {
      this.logger.error(`Failed to log payment transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 3: Log Inventory Updates
   * Use case: Track inventory changes for supply chain transparency
   */
  async logInventoryUpdate(inventoryData: {
    inventoryId: string;
    itemId: string;
    previousQuantity: number;
    newQuantity: number;
    changeReason: string;
    userId: string;
  }): Promise<void> {
    try {
      this.logger.log(`Logging inventory update: ${inventoryData.inventoryId}`);

      await this.auditLogger.createAuditLog({
        eventType: AuditEventType.INVENTORY_UPDATE,
        description: `Inventory update for item ${inventoryData.itemId}`,
        originalData: {
          inventoryId: inventoryData.inventoryId,
          itemId: inventoryData.itemId,
          previousQuantity: inventoryData.previousQuantity,
          newQuantity: inventoryData.newQuantity,
          quantityChange: inventoryData.newQuantity - inventoryData.previousQuantity,
          changeReason: inventoryData.changeReason,
          timestamp: new Date().toISOString(),
          changePercentage: this.calculateChangePercentage(
            inventoryData.previousQuantity,
            inventoryData.newQuantity
          ),
        },
        userId: inventoryData.userId,
        entityId: inventoryData.inventoryId,
        entityType: 'inventory',
        metadata: {
          source: 'inventory_service',
          changeType: inventoryData.newQuantity > inventoryData.previousQuantity ? 'increase' : 'decrease',
          changeReason: inventoryData.changeReason,
        },
      });

      this.logger.log(`Inventory update logged to blockchain: ${inventoryData.inventoryId}`);
    } catch (error) {
      this.logger.error(`Failed to log inventory update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 4: Bulk Log Farm Classifications
   * Use case: Log multiple farm classifications for audit trail
   */
  async logFarmClassifications(classifications: Array<{
    farmId: string;
    farmerId: string;
    zoneType: string;
    productivityScore: number;
    recommendations: string[];
  }>): Promise<void> {
    try {
      this.logger.log(`Logging ${classifications.length} farm classifications`);

      const auditLogs = classifications.map(classification => ({
        eventType: AuditEventType.FARM_CLASSIFICATION,
        description: `Farm classification for ${classification.farmId}`,
        originalData: {
          farmId: classification.farmId,
          farmerId: classification.farmerId,
          zoneType: classification.zoneType,
          productivityScore: classification.productivityScore,
          recommendations: classification.recommendations,
          timestamp: new Date().toISOString(),
          classificationHash: this.hashSensitiveData({
            farmId: classification.farmId,
            score: classification.productivityScore,
          }),
        },
        userId: classification.farmerId,
        entityId: classification.farmId,
        entityType: 'farm_classification',
        metadata: {
          source: 'farm_zone_classifier',
          zoneType: classification.zoneType,
          scoreRange: this.getScoreRange(classification.productivityScore),
        },
      }));

      const result = await this.auditLogger.createBulkAuditLogs({
        auditLogs,
        enableBatching: true,
        batchSize: 25,
      });

      this.logger.log(`Farm classifications logged: ${result.successful} successful, ${result.failed} failed`);
    } catch (error) {
      this.logger.error(`Failed to log farm classifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 5: Log Price Changes
   * Use case: Track agricultural input price changes for market transparency
   */
  async logPriceChange(priceData: {
    itemId: string;
    itemName: string;
    previousPrice: number;
    newPrice: number;
    changeReason: string;
    marketId: string;
  }): Promise<void> {
    try {
      this.logger.log(`Logging price change: ${priceData.itemName}`);

      const priceChangePercentage = ((priceData.newPrice - priceData.previousPrice) / priceData.previousPrice) * 100;

      await this.auditLogger.createAuditLog({
        eventType: AuditEventType.PRICE_CHANGE,
        description: `Price change for ${priceData.itemName}`,
        originalData: {
          itemId: priceData.itemId,
          itemName: priceData.itemName,
          previousPrice: priceData.previousPrice,
          newPrice: priceData.newPrice,
          priceChange: priceData.newPrice - priceData.previousPrice,
          priceChangePercentage,
          changeReason: priceData.changeReason,
          marketId: priceData.marketId,
          timestamp: new Date().toISOString(),
          priceHistory: this.createPriceHistoryHash(priceData),
        },
        entityId: priceData.itemId,
        entityType: 'price_change',
        metadata: {
          source: 'price_tracker_service',
          marketId: priceData.marketId,
          changeDirection: priceData.newPrice > priceData.previousPrice ? 'increase' : 'decrease',
          changeSignificance: Math.abs(priceChangePercentage) > 10 ? 'significant' : 'minor',
        },
      });

      this.logger.log(`Price change logged to blockchain: ${priceData.itemName}`);
    } catch (error) {
      this.logger.error(`Failed to log price change: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 6: Log System Events
   * Use case: Track critical system events for security and compliance
   */
  async logSystemEvent(eventData: {
    eventType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    affectedEntities: string[];
    systemState: Record<string, any>;
  }): Promise<void> {
    try {
      this.logger.log(`Logging system event: ${eventData.eventType}`);

      await this.auditLogger.createAuditLog({
        eventType: AuditEventType.SYSTEM_EVENT,
        description: eventData.description,
        originalData: {
          eventType: eventData.eventType,
          severity: eventData.severity,
          affectedEntities: eventData.affectedEntities,
          systemState: eventData.systemState,
          timestamp: new Date().toISOString(),
          systemStateHash: this.hashSensitiveData(eventData.systemState),
        },
        userId: eventData.userId,
        entityId: `system-event-${Date.now()}`,
        entityType: 'system_event',
        metadata: {
          source: 'system_monitor',
          severity: eventData.severity,
          affectedEntityCount: eventData.affectedEntities.length,
          eventCategory: this.categorizeSystemEvent(eventData.eventType),
        },
      });

      this.logger.log(`System event logged to blockchain: ${eventData.eventType}`);
    } catch (error) {
      this.logger.error(`Failed to log system event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 7: Verify Audit Trail
   * Use case: Verify the integrity of audit logs for compliance
   */
  async verifyAuditTrail(entityId: string, entityType: string): Promise<{
    totalLogs: number;
    verifiedLogs: number;
    failedVerifications: number;
    blockchainConfirmed: number;
    integrityStatus: 'intact' | 'compromised' | 'partial';
  }> {
    try {
      this.logger.log(`Verifying audit trail for ${entityType}: ${entityId}`);

      // Get all audit logs for the entity
      const auditLogs = await this.auditLogger.getAuditLogs({
        entityId,
        entityType,
        limit: 1000,
      });

      let verifiedLogs = 0;
      let failedVerifications = 0;
      let blockchainConfirmed = 0;

      // Verify each audit log
      for (const auditLog of auditLogs.data) {
        try {
          const verification = await this.auditLogger.verifyAuditLog(auditLog.id);
          
          if (verification.isValid) {
            verifiedLogs++;
          } else {
            failedVerifications++;
          }

          if (verification.blockchainVerification?.isConfirmed) {
            blockchainConfirmed++;
          }
        } catch (error) {
          failedVerifications++;
          this.logger.warn(`Verification failed for audit log ${auditLog.id}: ${error.message}`);
        }
      }

      // Determine integrity status
      let integrityStatus: 'intact' | 'compromised' | 'partial';
      if (failedVerifications === 0) {
        integrityStatus = 'intact';
      } else if (verifiedLogs === 0) {
        integrityStatus = 'compromised';
      } else {
        integrityStatus = 'partial';
      }

      const result = {
        totalLogs: auditLogs.total,
        verifiedLogs,
        failedVerifications,
        blockchainConfirmed,
        integrityStatus,
      };

      this.logger.log(`Audit trail verification completed for ${entityType}:${entityId}`, result);
      return result;
    } catch (error) {
      this.logger.error(`Audit trail verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 8: Generate Compliance Report
   * Use case: Generate audit reports for regulatory compliance
   */
  async generateComplianceReport(params: {
    fromDate: Date;
    toDate: Date;
    eventTypes?: AuditEventType[];
    userId?: string;
  }): Promise<{
    reportId: string;
    period: { from: Date; to: Date };
    summary: {
      totalEvents: number;
      eventsByType: Record<string, number>;
      blockchainConfirmed: number;
      integrityVerified: number;
    };
    auditLogs: any[];
    complianceScore: number;
    recommendations: string[];
  }> {
    try {
      this.logger.log('Generating compliance report');

      // Query audit logs for the period
      const auditLogs = await this.auditLogger.getAuditLogs({
        fromDate: params.fromDate.toISOString(),
        toDate: params.toDate.toISOString(),
        userId: params.userId,
        limit: 10000,
      });

      // Filter by event types if specified
      let filteredLogs = auditLogs.data;
      if (params.eventTypes && params.eventTypes.length > 0) {
        filteredLogs = auditLogs.data.filter(log => 
          params.eventTypes.includes(log.eventType as AuditEventType)
        );
      }

      // Calculate summary statistics
      const eventsByType: Record<string, number> = {};
      let blockchainConfirmed = 0;
      let integrityVerified = 0;

      for (const log of filteredLogs) {
        eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
        
        if (log.isBlockchainConfirmed) {
          blockchainConfirmed++;
        }

        // Verify a sample of logs for integrity
        if (Math.random() < 0.1) { // Verify 10% sample
          try {
            const verification = await this.auditLogger.verifyAuditLog(log.id);
            if (verification.isValid) {
              integrityVerified++;
            }
          } catch (error) {
            this.logger.warn(`Verification failed for log ${log.id}`);
          }
        }
      }

      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore({
        totalEvents: filteredLogs.length,
        blockchainConfirmed,
        integrityVerified,
      });

      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations({
        totalEvents: filteredLogs.length,
        blockchainConfirmed,
        complianceScore,
      });

      const report = {
        reportId: `compliance-${Date.now()}`,
        period: { from: params.fromDate, to: params.toDate },
        summary: {
          totalEvents: filteredLogs.length,
          eventsByType,
          blockchainConfirmed,
          integrityVerified,
        },
        auditLogs: filteredLogs,
        complianceScore,
        recommendations,
      };

      this.logger.log(`Compliance report generated: ${report.reportId}`);
      return report;
    } catch (error) {
      this.logger.error(`Failed to generate compliance report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 9: Emergency Audit Log
   * Use case: Log critical security events or system failures
   */
  async logEmergencyEvent(emergencyData: {
    eventType: string;
    severity: 'critical' | 'high';
    description: string;
    affectedSystems: string[];
    responseActions: string[];
    userId?: string;
  }): Promise<void> {
    try {
      this.logger.error(`EMERGENCY EVENT: ${emergencyData.eventType}`);

      // Create high-priority audit log
      await this.auditLogger.createAuditLog({
        eventType: AuditEventType.SYSTEM_EVENT,
        description: `EMERGENCY: ${emergencyData.description}`,
        originalData: {
          emergencyType: emergencyData.eventType,
          severity: emergencyData.severity,
          description: emergencyData.description,
          affectedSystems: emergencyData.affectedSystems,
          responseActions: emergencyData.responseActions,
          timestamp: new Date().toISOString(),
          emergencyId: `emergency-${Date.now()}`,
          systemSnapshot: await this.captureSystemSnapshot(),
        },
        userId: emergencyData.userId,
        entityId: `emergency-${Date.now()}`,
        entityType: 'emergency_event',
        metadata: {
          source: 'emergency_response_system',
          severity: emergencyData.severity,
          priority: 'immediate',
          requiresInvestigation: true,
          affectedSystemCount: emergencyData.affectedSystems.length,
        },
      });

      this.logger.log(`Emergency event logged to blockchain: ${emergencyData.eventType}`);
    } catch (error) {
      this.logger.error(`Failed to log emergency event: ${error.message}`);
      // In emergency situations, we might want to use alternative logging
      throw error;
    }
  }

  // Helper methods
  private hashSensitiveData(data: any): string {
    return require('crypto').createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private createTransactionFingerprint(paymentData: any): string {
    const fingerprint = `${paymentData.fromUserId}:${paymentData.toUserId}:${paymentData.amount}:${paymentData.timestamp}`;
    return require('crypto').createHash('sha256').update(fingerprint).digest('hex');
  }

  private calculateChangePercentage(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private assessTransactionRisk(paymentData: any): 'low' | 'medium' | 'high' {
    if (paymentData.amount > 10000) return 'high';
    if (paymentData.amount > 1000) return 'medium';
    return 'low';
  }

  private getScoreRange(score: number): string {
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private categorizeSystemEvent(eventType: string): string {
    if (eventType.includes('security')) return 'security';
    if (eventType.includes('performance')) return 'performance';
    if (eventType.includes('error')) return 'error';
    return 'general';
  }

  private calculateComplianceScore(metrics: {
    totalEvents: number;
    blockchainConfirmed: number;
    integrityVerified: number;
  }): number {
    if (metrics.totalEvents === 0) return 100;
    
    const blockchainRate = (metrics.blockchainConfirmed / metrics.totalEvents) * 100;
    const integrityRate = metrics.integrityVerified > 0 ? 100 : 90; // Assume good if not tested
    
    return Math.round((blockchainRate * 0.7) + (integrityRate * 0.3));
  }

  private generateComplianceRecommendations(metrics: {
    totalEvents: number;
    blockchainConfirmed: number;
    complianceScore: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (metrics.complianceScore < 80) {
      recommendations.push('Improve blockchain confirmation rate');
    }
    
    if (metrics.blockchainConfirmed < metrics.totalEvents * 0.9) {
      recommendations.push('Investigate failed blockchain submissions');
    }
    
    if (metrics.totalEvents < 100) {
      recommendations.push('Increase audit logging coverage');
    }
    
    return recommendations;
  }

  private async captureSystemSnapshot(): Promise<Record<string, any>> {
    return {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }
}
