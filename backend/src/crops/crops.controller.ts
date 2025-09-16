import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { QueryCropsDto } from './dto/query-crops.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

@ApiTags('crops')
@Controller('crops')
export class CropsController {
  constructor(private readonly service: CropsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a crop metadata record' })
  create(@Body() dto: CreateCropDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List crops with optional filters' })
  findAll(@Query() query: QueryCropsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single crop by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update crop metadata' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCropDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crop' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}


