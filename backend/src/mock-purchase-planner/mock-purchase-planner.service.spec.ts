import { MockPurchasePlannerService } from './mock-purchase-planner.service';
import { MemoryPlannerRepository } from './repositories/memory-planner.repository';

describe('MockPurchasePlannerService', () => {
  let svc: MockPurchasePlannerService;

  beforeEach(() => {
    const repo = new MemoryPlannerRepository();
    svc = new MockPurchasePlannerService(repo as any);
  });

  it('recommends ordering when stock insufficient', async () => {
    const dto = {
      name: 'test',
      horizonDays: 30,
      items: [
        {
          name: 'urea',
          avgDailyUse: 2,
          daysUntilNeed: 10,
          currentStock: 5,
          leadTimeDays: 3,
          safetyFactor: 0.2,
        },
      ],
    } as any;

    const recs = await svc.recommend(dto);
    expect(recs).toHaveLength(1);
    expect(recs[0].recommendedQuantity).toBeGreaterThan(0);
  });
});
