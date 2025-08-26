import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FarmZoneClassifierService } from './farm-zone-classifier.service';
import { CreateFarmZoneDto } from './dto/create-farm-zone.dto';
import { UpdateFarmZoneDto } from './dto/update-farm-zone.dto';
import { ClassifyFarmDto, BulkClassifyFarmsDto } from './dto/classify-farm.dto';
import { ProductivityZone } from './entities/farm-zone.entity';
import {
  FarmZoneResponseDto,
  ClassificationResultDto,
  BulkClassificationResultDto,
} from './dto/farm-zone-response.dto';

@ApiTags('Farm Zone Classifier')
@Controller('farm-zone-classifier')
export class FarmZoneClassifierController {
  constructor(private readonly farmZoneClassifierService: FarmZoneClassifierService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new farm zone classification' })
  @ApiBody({ type: CreateFarmZoneDto })
  @ApiResponse({
    status: 201,
    description: 'Farm zone classification created successfully',
    type: FarmZoneResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Farm profile not found' })
  async create(@Body(ValidationPipe) createFarmZoneDto: CreateFarmZoneDto) {
    return await this.farmZoneClassifierService.create(createFarmZoneDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all farm zone classifications' })
  @ApiQuery({
    name: 'zoneType',
    required: false,
    enum: ProductivityZone,
    description: 'Filter by productivity zone type',
  })
  @ApiResponse({
    status: 200,
    description: 'List of farm zone classifications',
    type: [FarmZoneResponseDto],
  })
  async findAll(@Query('zoneType') zoneType?: ProductivityZone) {
    return await this.farmZoneClassifierService.findAll(zoneType);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get productivity zone statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics of farms by productivity zones',
    schema: {
      type: 'object',
      properties: {
        'high-yield': { type: 'number' },
        'moderate-yield': { type: 'number' },
        'low-yield': { type: 'number' },
      },
    },
  })
  async getStatistics() {
    return await this.farmZoneClassifierService.getZoneStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific farm zone classification by ID' })
  @ApiParam({ name: 'id', description: 'Farm zone ID' })
  @ApiResponse({
    status: 200,
    description: 'Farm zone classification details',
    type: FarmZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Farm zone not found' })
  async findOne(@Param('id') id: string) {
    return await this.farmZoneClassifierService.findOne(id);
  }

  @Get('farm-profile/:farmProfileId')
  @ApiOperation({ summary: 'Get farm zone classification by farm profile ID' })
  @ApiParam({ name: 'farmProfileId', description: 'Farm profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Farm zone classification for the specified farm profile',
    type: FarmZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Farm zone not found for this profile' })
  async findByFarmProfile(@Param('farmProfileId') farmProfileId: string) {
    const farmZone = await this.farmZoneClassifierService.findByFarmProfile(farmProfileId);
    if (!farmZone) {
      return { message: 'No farm zone classification found for this farm profile' };
    }
    return farmZone;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a farm zone classification' })
  @ApiParam({ name: 'id', description: 'Farm zone ID' })
  @ApiBody({ type: UpdateFarmZoneDto })
  @ApiResponse({
    status: 200,
    description: 'Farm zone classification updated successfully',
    type: FarmZoneResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Farm zone not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFarmZoneDto: UpdateFarmZoneDto,
  ) {
    return await this.farmZoneClassifierService.update(id, updateFarmZoneDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a farm zone classification' })
  @ApiParam({ name: 'id', description: 'Farm zone ID' })
  @ApiResponse({ status: 204, description: 'Farm zone classification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Farm zone not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.farmZoneClassifierService.remove(id);
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify a single farm into productivity zones' })
  @ApiBody({ type: ClassifyFarmDto })
  @ApiResponse({
    status: 200,
    description: 'Farm classification result',
    type: ClassificationResultDto,
  })
  @ApiResponse({ status: 404, description: 'Farm profile not found' })
  async classifyFarm(@Body(ValidationPipe) classifyFarmDto: ClassifyFarmDto) {
    return await this.farmZoneClassifierService.classifyFarm(classifyFarmDto);
  }

  @Post('classify/bulk')
  @ApiOperation({ summary: 'Classify multiple farms in bulk' })
  @ApiBody({ type: BulkClassifyFarmsDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk classification results',
    type: BulkClassificationResultDto,
  })
  async bulkClassifyFarms(@Body(ValidationPipe) bulkClassifyDto: BulkClassifyFarmsDto) {
    return await this.farmZoneClassifierService.bulkClassifyFarms(bulkClassifyDto);
  }
}
