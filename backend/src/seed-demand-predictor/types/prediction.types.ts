export enum PredictionSeason {
  SPRING = 'Spring',
  SUMMER = 'Summer',
  FALL = 'Fall',
  WINTER = 'Winter',
}

export enum CropType {
  CEREAL = 'Cereal',
  LEGUME = 'Legume',
  VEGETABLE = 'Vegetable',
  FRUIT = 'Fruit',
  OILSEED = 'Oilseed',
  FIBER = 'Fiber',
}

export interface PredictionFilters {
  region?: string;
  season?: PredictionSeason;
  cropType?: CropType;
  seedVariety?: string;
  yearsBack?: number; // how many years of historical data to consider
}

export interface SeedDemandPrediction {
  seedVariety: string;
  region: string;
  season: PredictionSeason;
  year: number;
  predictedDemand: number; // in kg
  confidence: number; // percentage (0-100)
  factors: {
    historicalTrend: number;
    seasonalPattern: number;
    regionalGrowth: number;
    weatherImpact?: number;
  };
  recommendations: string[];
  priceRange?: {
    min: number;
    max: number;
    average: number;
  };
}

export interface RegionalDemandSummary {
  region: string;
  totalPredictedDemand: number;
  topSeeds: {
    variety: string;
    demand: number;
    percentage: number;
  }[];
  seasonalBreakdown: Record<PredictionSeason, number>;
  growthRate: number; // year over year percentage
}

export interface PredictionAnalytics {
  totalFarmers: number;
  totalRegions: number;
  dataPointsAnalyzed: number;
  predictionAccuracy?: number; // if we have validation data
  trendsIdentified: {
    type: 'increasing' | 'decreasing' | 'stable';
    description: string;
    confidence: number;
  }[];
}

export interface WeatherImpactFactor {
  temperature: {
    optimal: number;
    current: number;
    impact: number; // -1 to 1
  };
  rainfall: {
    optimal: number;
    current: number;
    impact: number; // -1 to 1
  };
  humidity: {
    optimal: number;
    current: number;
    impact: number; // -1 to 1
  };
}
