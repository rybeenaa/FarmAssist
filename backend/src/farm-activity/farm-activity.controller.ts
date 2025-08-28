import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { FarmActivityService } from './farm-activity.service';
import { CreateActivityDto } from './dto/create-farm-activity.dto';
import { UpdateActivityDto } from './dto/update-farm-activity.dto';

@Controller('activities')
export class FarmActivityController {
  constructor(private readonly svc: FarmActivityService) {}

  @Post()
  async create(@Body() body: CreateActivityDto) {
    return this.svc.create(body);
  }

  @Get()
  async findAll(@Query() query?: { filter?: any; pagination?: { skip?: number; take?: number } }) {
    return this.svc.list(query?.filter, query?.pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateActivityDto) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}