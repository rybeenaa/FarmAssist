import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmZone, ProductivityZone } from '../entities/farm-zone.entity';

export interface PerformanceMetrics {
  classificationAccuracy: number;
  averageProcessingTime: number;
  totalClassifications: number;
  errorRate: number;
  zoneDistribution: Record<ProductivityZone, number>;
  confidenceDistribution: {
    high: number; // > 80%
    medium: number; // 60-80%
    low: number; // < 60%
  };
}

export interface ClassificationPerformanceLog {
  timestamp: Date;
  farmProfileId: string;
  processingTimeMs: number;
  confidence: number;
  zoneType: ProductivityZone;
  success: boolean;
  errorMessage?: string;
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private performanceLogs: ClassificationPerformanceLog[] = [];
  private readonly MAX_LOGS = 10000; // Keep last 10k logs in memory

  constructor(
    @InjectRepository(FarmZone)
    private readonly farmZoneRepository: Repository<FarmZone>,
  ) {}

  /**
   * Log classification performance
   */
  logClassification(log: ClassificationPerformanceLog): void {
    this.performanceLogs.push(log);
    
    // Keep only recent logs
    if (this.performanceLogs.length > this.MAX_LOGS) {
      this.performanceLogs = this.performanceLogs.slice(-this.MAX_LOGS);
    }

    // Log slow classifications
    if (log.processingTimeMs > 1000) {
      this.logger.warn(`Slow classification detected: ${log.processingTimeMs}ms for farm ${log.farmProfileId}`);
    }

    // Log low confidence classifications
    if (log.confidence < 60) {
      this.logger.warn(`Low confidence classification: ${log.confidence}% for farm ${log.farmProfileId}`);
    }
  }

  /**
   * Get current performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const recentLogs = this.getRecentLogs(24); // Last 24 hours
    const totalClassifications = recentLogs.length;
    
    if (totalClassifications === 0) {
      return this.getEmptyMetrics();
    }

    const successfulClassifications = recentLogs.filter(log => log.success);
    const errorRate = ((totalClassifications - successfulClassifications.length) / totalClassifications) * 100;
    
    const averageProcessingTime = successfulClassifications.reduce((sum, log) => sum + log.processingTimeMs, 0) / successfulClassifications.length;
    
    // Calculate zone distribution from recent classifications
    const zoneDistribution: Record<ProductivityZone, number> = {
      [ProductivityZone.HIGH_YIELD]: 0,
      [ProductivityZone.MODERATE_YIELD]: 0,
      [ProductivityZone.LOW_YIELD]: 0,
    };

    successfulClassifications.forEach(log => {
      zoneDistribution[log.zoneType]++;
    });

    // Calculate confidence distribution
    const confidenceDistribution = {
      high: successfulClassifications.filter(log => log.confidence > 80).length,
      medium: successfulClassifications.filter(log => log.confidence >= 60 && log.confidence <= 80).length,
      low: successfulClassifications.filter(log => log.confidence < 60).length,
    };

    // Calculate classification accuracy (simplified - would need ground truth data for real accuracy)
    const classificationAccuracy = this.estimateClassificationAccuracy(successfulClassifications);

    return {
      classificationAccuracy,
      averageProcessingTime: Math.round(averageProcessingTime),
      totalClassifications,
      errorRate: Math.round(errorRate * 100) / 100,
      zoneDistribution,
      confidenceDistribution,
    };
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(hours: number = 24): {
    hourlyMetrics: Array<{
      hour: string;
      classifications: number;
      averageProcessingTime: number;
      errorRate: number;
      averageConfidence: number;
    }>;
    trends: {
      processingTimetrend: 'improving' | 'stable' | 'degrading';
      errorRateTrend: 'improving' | 'stable' | 'degrading';
      confidenceTrend: 'improving' | 'stable' | 'degrading';
    };
  } {
    const recentLogs = this.getRecentLogs(hours);
    const hourlyMetrics = this.calculateHourlyMetrics(recentLogs, hours);
    const trends = this.calculateTrends(hourlyMetrics);

    return {
      hourlyMetrics,
      trends,
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const recentLogs = this.getRecentLogs(1); // Last hour
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (recentLogs.length === 0) {
      return {
        status: 'healthy',
        issues: [],
        recommendations: ['System is idle - no recent classifications'],
      };
    }

    const errorRate = (recentLogs.filter(log => !log.success).length / recentLogs.length) * 100;
    const avgProcessingTime = recentLogs.reduce((sum, log) => sum + log.processingTimeMs, 0) / recentLogs.length;
    const lowConfidenceRate = (recentLogs.filter(log => log.confidence < 60).length / recentLogs.length) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check error rate
    if (errorRate > 10) {
      status = 'critical';
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
      recommendations.push('Investigate classification errors and data quality');
    } else if (errorRate > 5) {
      status = 'warning';
      issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
      recommendations.push('Monitor error patterns and consider data validation improvements');
    }

    // Check processing time
    if (avgProcessingTime > 2000) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`Slow processing time: ${avgProcessingTime.toFixed(0)}ms`);
      recommendations.push('Consider optimizing classification algorithm or database queries');
    }

    // Check confidence levels
    if (lowConfidenceRate > 30) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High low-confidence rate: ${lowConfidenceRate.toFixed(1)}%`);
      recommendations.push('Review data quality requirements and consider additional data sources');
    }

    return {
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Clear performance logs (for maintenance)
   */
  clearLogs(): void {
    this.performanceLogs = [];
    this.logger.log('Performance logs cleared');
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(hours: number = 24): ClassificationPerformanceLog[] {
    return this.getRecentLogs(hours);
  }

  // Private helper methods
  private getRecentLogs(hours: number): ClassificationPerformanceLog[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.performanceLogs.filter(log => log.timestamp >= cutoffTime);
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      classificationAccuracy: 0,
      averageProcessingTime: 0,
      totalClassifications: 0,
      errorRate: 0,
      zoneDistribution: {
        [ProductivityZone.HIGH_YIELD]: 0,
        [ProductivityZone.MODERATE_YIELD]: 0,
        [ProductivityZone.LOW_YIELD]: 0,
      },
      confidenceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }

  private estimateClassificationAccuracy(logs: ClassificationPerformanceLog[]): number {
    // Simplified accuracy estimation based on confidence levels
    // In a real system, this would compare against ground truth data
    const totalConfidence = logs.reduce((sum, log) => sum + log.confidence, 0);
    return logs.length > 0 ? totalConfidence / logs.length : 0;
  }

  private calculateHourlyMetrics(logs: ClassificationPerformanceLog[], hours: number) {
    const hourlyData: { [hour: string]: ClassificationPerformanceLog[] } = {};
    
    // Initialize hourly buckets
    for (let i = 0; i < hours; i++) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000).toISOString().slice(0, 13);
      hourlyData[hour] = [];
    }

    // Group logs by hour
    logs.forEach(log => {
      const hour = log.timestamp.toISOString().slice(0, 13);
      if (hourlyData[hour]) {
        hourlyData[hour].push(log);
      }
    });

    // Calculate metrics for each hour
    return Object.entries(hourlyData).map(([hour, hourLogs]) => {
      const successfulLogs = hourLogs.filter(log => log.success);
      return {
        hour,
        classifications: hourLogs.length,
        averageProcessingTime: successfulLogs.length > 0 
          ? successfulLogs.reduce((sum, log) => sum + log.processingTimeMs, 0) / successfulLogs.length 
          : 0,
        errorRate: hourLogs.length > 0 
          ? ((hourLogs.length - successfulLogs.length) / hourLogs.length) * 100 
          : 0,
        averageConfidence: successfulLogs.length > 0 
          ? successfulLogs.reduce((sum, log) => sum + log.confidence, 0) / successfulLogs.length 
          : 0,
      };
    }).reverse(); // Most recent first
  }

  private calculateTrends(hourlyMetrics: any[]): {
    processingTimeTrend: 'improving' | 'stable' | 'degrading';
    errorRateTrend: 'improving' | 'stable' | 'degrading';
    confidenceTrend: 'improving' | 'stable' | 'degrading';
  } {
    if (hourlyMetrics.length < 2) {
      return {
        processingTimeTrend: 'stable',
        errorRateTrend: 'stable',
        confidenceTrend: 'stable',
      };
    }

    const recent = hourlyMetrics.slice(0, Math.ceil(hourlyMetrics.length / 2));
    const older = hourlyMetrics.slice(Math.ceil(hourlyMetrics.length / 2));

    const recentAvgProcessingTime = recent.reduce((sum, m) => sum + m.averageProcessingTime, 0) / recent.length;
    const olderAvgProcessingTime = older.reduce((sum, m) => sum + m.averageProcessingTime, 0) / older.length;

    const recentAvgErrorRate = recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;
    const olderAvgErrorRate = older.reduce((sum, m) => sum + m.errorRate, 0) / older.length;

    const recentAvgConfidence = recent.reduce((sum, m) => sum + m.averageConfidence, 0) / recent.length;
    const olderAvgConfidence = older.reduce((sum, m) => sum + m.averageConfidence, 0) / older.length;

    return {
      processingTimeT rend: this.getTrend(recentAvgProcessingTime, olderAvgProcessingTime, false),
      errorRateTrend: this.getTrend(recentAvgErrorRate, olderAvgErrorRate, false),
      confidenceTrend: this.getTrend(recentAvgConfidence, olderAvgConfidence, true),
    };
  }

  private getTrend(recent: number, older: number, higherIsBetter: boolean): 'improving' | 'stable' | 'degrading' {
    const changePercent = older > 0 ? ((recent - older) / older) * 100 : 0;
    const threshold = 5; // 5% change threshold

    if (Math.abs(changePercent) < threshold) return 'stable';
    
    if (higherIsBetter) {
      return changePercent > 0 ? 'improving' : 'degrading';
    } else {
      return changePercent < 0 ? 'improving' : 'degrading';
    }
  }
}
