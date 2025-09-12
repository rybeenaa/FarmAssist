import { Injectable } from '@nestjs/common';
import { EstimateBudgetDto } from './estimate-budget.dto';
@Injectable()
export class FarmBudgetService {
  private cropCosts = {
    maize: 50000,
    rice: 70000,
    wheat: 65000,
    cassava: 40000,
    default: 50000,
  };

  private livestockCosts = {
    cattle: 150000,
    goat: 20000,
    poultry: 1500,
    default: 10000,
  };

  estimateBudget(dto: EstimateBudgetDto) {
    const { farmSize, cropType, livestockCount = 0 } = dto;

    const cropUnitCost =
      this.cropCosts[cropType.toLowerCase()] ?? this.cropCosts.default;
    const cropBudget = farmSize * cropUnitCost;

    const livestockUnitCost =
      this.livestockCosts[cropType.toLowerCase()] ??
      this.livestockCosts.default;
    const livestockBudget = livestockCount * livestockUnitCost;

    const totalBudget = cropBudget + livestockBudget;

    return {
      farmSize,
      cropType,
      livestockCount,
      cropBudget,
      livestockBudget,
      totalBudget,
      assumptions: {
        cropUnitCost,
        livestockUnitCost,
      },
    };
  }
}
