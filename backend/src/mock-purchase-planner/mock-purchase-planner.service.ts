import { Injectable, Inject } from '@nestjs/common';
import { PlannerRepository } from './repositories/planner.repository';
import { CreatePlannerDto } from './dto/create-planner.dto';
import { RecommendationDto } from './dto/recommendation.dto';

@Injectable()
export class MockPurchasePlannerService {
  constructor(@Inject('PlannerRepository') private repo: PlannerRepository) {}

  async createPlanner(dto: CreatePlannerDto) {
    const planner = await this.repo.create({ name: dto.name, items: dto.items });
    return planner;
  }

  async getPlanner(id: string) {
    return this.repo.findById(id);
  }

  async recommend(dto: CreatePlannerDto): Promise<RecommendationDto[]> {
    const horizon = dto.horizonDays ?? 30;
    const out: RecommendationDto[] = [];

    for (const it of dto.items) {
      const lead = (it.leadTimeDays ?? 7);
      const safety = it.safetyFactor ?? 0.1;

      // total need before deadline
      const totalNeeded = it.avgDailyUse * Math.min(it.daysUntilNeed, horizon);
      const safetyQty = totalNeeded * safety;
      const required = Math.max(0, totalNeeded + safetyQty - (it.currentStock ?? 0));

      // order date must account for lead time so it arrives by daysUntilNeed
      const today = new Date();
      const needDate = new Date(today);
      needDate.setDate(needDate.getDate() + it.daysUntilNeed);

      const orderBy = new Date(needDate);
      orderBy.setDate(orderBy.getDate() - lead);

      out.push({
        itemName: it.name,
        recommendedQuantity: Math.ceil(required),
        recommendedOrderDate: orderBy.toISOString(),
        reason: `Needed in ${it.daysUntilNeed} days; lead time ${lead}d; safety ${Math.round(safety * 100)}%`,
      });
    }

    return out;
  }
}
