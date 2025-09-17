import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { SeedDemandPredictorService } from './seed-demand-predictor.service';
import { CreateSeedUsageDto } from './dto/create-seed-usage.dto';
import { UpdateSeedUsageDto } from './dto/update-seed-usage.dto';
import { PredictionQueryDto, BulkPredictionQueryDto } from './dto/prediction-query.dto';
import {
  SeedDemandPrediction,
  RegionalDemandSummary,
  PredictionAnalytics,
} from './types/prediction.types';
import { SeedUsage } from './entities/seed-usage.entity';

@Controller('seed-demand-predictor')
export class SeedDemandPredictorController {
  constructor(private readonly seedDemandPredictorService: SeedDemandPredictorService) {}

  // Seed Usage Data Management Endpoints

  @Post('usage')
  async createSeedUsage(
    @Body(ValidationPipe) createDto: CreateSeedUsageDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: SeedUsage;
  }> {
    const seedUsage = await this.seedDemandPredictorService.createSeedUsage(createDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Seed usage record created successfully',
      data: seedUsage,
    };
  }

  @Get('usage')
  async getAllSeedUsage(): Promise<{
    statusCode: number;
    message: string;
    data: SeedUsage[];
  }> {
    const seedUsage = await this.seedDemandPredictorService.findAllSeedUsage();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Seed usage records retrieved successfully',
      data: seedUsage,
    };
  }

  @Get('usage/:id')
  async getSeedUsageById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    statusCode: number;
    message: string;
    data: SeedUsage;
  }> {
    const seedUsage = await this.seedDemandPredictorService.findSeedUsageById(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Seed usage record retrieved successfully',
      data: seedUsage,
    };
  }

  @Put('usage/:id')
  async updateSeedUsage(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateSeedUsageDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: SeedUsage;
  }> {
    const seedUsage = await this.seedDemandPredictorService.updateSeedUsage(id, updateDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Seed usage record updated successfully',
      data: seedUsage,
    };
  }

  @Delete('usage/:id')
  async deleteSeedUsage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    statusCode: number;
    message: string;
  }> {
    await this.seedDemandPredictorService.deleteSeedUsage(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Seed usage record deleted successfully',
    };
  }

  // Prediction Endpoints

  @Get('predict')
  async predictSeedDemand(
    @Query(ValidationPipe) queryDto: PredictionQueryDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      predictions: SeedDemandPrediction[];
      summary: {
        totalPredictions: number;
        averageConfidence: number;
        totalPredictedDemand: number;
      };
    };
  }> {
    const predictions = await this.seedDemandPredictorService.predictSeedDemand(queryDto);
    
    const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0);
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(predictions.length, 1);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Seed demand predictions generated successfully',
      data: {
        predictions,
        summary: {
          totalPredictions: predictions.length,
          averageConfidence: Math.round(averageConfidence * 100) / 100,
          totalPredictedDemand: Math.round(totalPredictedDemand * 100) / 100,
        },
      },
    };
  }

  @Get('predict/bulk')
  async bulkPredictDemand(
    @Query(ValidationPipe) queryDto: BulkPredictionQueryDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      predictions: SeedDemandPrediction[];
      summary: {
        totalPredictions: number;
        averageConfidence: number;
        totalPredictedDemand: number;
        regionCount: number;
        varietyCount: number;
      };
    };
  }> {
    const predictions = await this.seedDemandPredictorService.bulkPredictDemand(queryDto);
    
    const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0);
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(predictions.length, 1);
    const uniqueRegions = new Set(predictions.map(p => p.region)).size;
    const uniqueVarieties = new Set(predictions.map(p => p.seedVariety)).size;
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Bulk seed demand predictions generated successfully',
      data: {
        predictions,
        summary: {
          totalPredictions: predictions.length,
          averageConfidence: Math.round(averageConfidence * 100) / 100,
          totalPredictedDemand: Math.round(totalPredictedDemand * 100) / 100,
          regionCount: uniqueRegions,
          varietyCount: uniqueVarieties,
        },
      },
    };
  }

  @Get('regional-summary/:region')
  async getRegionalSummary(
    @Param('region') region: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ): Promise<{
    statusCode: number;
    message: string;
    data: RegionalDemandSummary;
  }> {
    const summary = await this.seedDemandPredictorService.getRegionalSummary(region, year);
    
    return {
      statusCode: HttpStatus.OK,
      message: `Regional demand summary for ${region} retrieved successfully`,
      data: summary,
    };
  }

  @Get('analytics')
  async getPredictionAnalytics(): Promise<{
    statusCode: number;
    message: string;
    data: PredictionAnalytics;
  }> {
    const analytics = await this.seedDemandPredictorService.getPredictionAnalytics();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Prediction analytics retrieved successfully',
      data: analytics,
    };
  }

  // Health Check and Status Endpoints

  @Get('health')
  async healthCheck(): Promise<{
    statusCode: number;
    message: string;
    data: {
      status: string;
      timestamp: string;
      uptime: number;
      service: string;
    };
  }> {
    return {
      statusCode: HttpStatus.OK,
      message: 'Seed Demand Predictor service is healthy',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'seed-demand-predictor',
      },
    };
  }

  @Get('status')
  async getServiceStatus(): Promise<{
    statusCode: number;
    message: string;
    data: {
      service: string;
      version: string;
      features: string[];
      endpoints: {
        category: string;
        paths: string[];
      }[];
    };
  }> {
    return {
      statusCode: HttpStatus.OK,
      message: 'Service status retrieved successfully',
      data: {
        service: 'Seed Demand Predictor',
        version: '1.0.0',
        features: [
          'Historical seed usage tracking',
          'Advanced demand prediction algorithms',
          'Regional demand analysis',
          'Trend identification',
          'Confidence scoring',
          'Bulk predictions',
          'Analytics and reporting',
        ],
        endpoints: [
          {
            category: 'Data Management',
            paths: [
              'POST /seed-demand-predictor/usage',
              'GET /seed-demand-predictor/usage',
              'GET /seed-demand-predictor/usage/:id',
              'PUT /seed-demand-predictor/usage/:id',
              'DELETE /seed-demand-predictor/usage/:id',
            ],
          },
          {
            category: 'Predictions',
            paths: [
              'GET /seed-demand-predictor/predict',
              'GET /seed-demand-predictor/predict/bulk',
              'GET /seed-demand-predictor/regional-summary/:region',
              'GET /seed-demand-predictor/analytics',
            ],
          },
          {
            category: 'Service Health',
            paths: [
              'GET /seed-demand-predictor/health',
              'GET /seed-demand-predictor/status',
            ],
          },
        ],
      },
    };
  }
}
