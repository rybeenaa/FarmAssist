export class RecommendationDto {
  itemName: string;
  recommendedQuantity: number;
  recommendedOrderDate: string; // ISO date
  reason?: string;
}
