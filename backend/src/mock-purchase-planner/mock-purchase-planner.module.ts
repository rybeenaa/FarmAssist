import { Module } from '@nestjs/common';
import { MockPurchasePlannerService } from './mock-purchase-planner.service';
import { MockPurchasePlannerController } from './mock-purchase-planner.controller';
import { MemoryPlannerRepository } from './repositories/memory-planner.repository';

@Module({
  controllers: [MockPurchasePlannerController],
  providers: [
    { provide: 'PlannerRepository', useClass: MemoryPlannerRepository },
    MockPurchasePlannerService,
  ],
  exports: [MockPurchasePlannerService],
})
export class MockPurchasePlannerModule {}
