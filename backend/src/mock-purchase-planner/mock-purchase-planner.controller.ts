import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MockPurchasePlannerService } from './mock-purchase-planner.service';
import { CreatePlannerDto } from './dto/create-planner.dto';

@Controller('mock-purchase-planner')
export class MockPurchasePlannerController {
  constructor(private readonly svc: MockPurchasePlannerService) {}

  @Post('recommend')
  async recommend(@Body() dto: CreatePlannerDto) {
    return this.svc.recommend(dto);
  }

  @Post()
  async create(@Body() dto: CreatePlannerDto) {
    return this.svc.createPlanner(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.getPlanner(id);
  }
}
