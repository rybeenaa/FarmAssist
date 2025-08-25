import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { RecommendationLoggingService } from './recommendation-logging.service';
import { UpdateOutcomeDto } from './dto/update-outcome.dto';
import { RecommendationType, RecommendationOutcome } from './entities/recommendation-log.entity';

@Controller('recommendation-logging')
export class RecommendationLoggingController {
  constructor(
    private readonly recommendationLoggingService: RecommendationLoggingService,
  ) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('farmId') farmId?: string,
    @Query('type') recommendationType?: RecommendationType,
    @Query('outcome') outcome?: RecommendationOutcome,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options = {
      userId,
      farmId,
      recommendationType,
      outcome,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    return this.recommendationLoggingService.findAll(options);
  }

  @Get('statistics')
  async getStatistics(
    @Query('userId') userId?: string,
    @Query('farmId') farmId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const options = {
      userId,
      farmId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.recommendationLoggingService.getStatistics(options);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.recommendationLoggingService.findOne(id);
  }

  @Patch(':id/outcome')
  async updateOutcome(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateOutcomeDto: UpdateOutcomeDto,
  ) {
    return this.recommendationLoggingService.updateOutcome(id, updateOutcomeDto);
  }
}