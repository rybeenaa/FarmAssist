import { Controller, Post, Body } from '@nestjs/common';
import { FarmBudgetService } from './dto/farm-budget.service';
import { EstimateBudgetDto } from './dto/estimate-budget.dto';

@Controller('farm-budget')
export class FarmBudgetController {
  constructor(private readonly farmBudgetService: FarmBudgetService) {}

  @Post('estimate')
  estimateBudget(@Body() dto: EstimateBudgetDto) {
    return this.farmBudgetService.estimateBudget(dto);
  }
}
