import { ProductivityZone } from '../entities/farm-zone.entity';

export class FarmZoneResponseDto {
  id: string;
  farmProfile: {
    id: string;
    farmSize: number;
    latitude: number;
    longitude: number;
    cropType: string;
    farmerName: string;
    farmerContact: string;
  };
  zoneType: ProductivityZone;
  historicalData: {
    yields: number[];
    seasons: string[];
    soilQualityScores: number[];
    moistureLevels: number[];
  };
  averageYield: number;
  productivityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ClassificationResultDto {
  farmProfileId: string;
  zoneType: ProductivityZone;
  productivityScore: number;
  averageYield: number;
  confidence: number;
  factors: {
    yieldConsistency: number;
    soilQuality: number;
    moistureAdequacy: number;
    seasonalPerformance: number;
  };
  recommendations: string[];
}

export class BulkClassificationResultDto {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: ClassificationResultDto[];
  errors: Array<{
    farmProfileId: string;
    error: string;
  }>;
}
