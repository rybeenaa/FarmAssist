import { Module } from '@nestjs/common';
import { FarmBudgetService } from './dto/farm-budget.service';
import { FarmBudgetController } from './farm-budget.controller';

@Module({
  controllers: [FarmBudgetController],
  providers: [FarmBudgetService],
  exports: [FarmBudgetService],
})
export class FarmBudgetModule {}
