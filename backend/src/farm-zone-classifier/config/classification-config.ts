/**
 * Farm Zone Classifier Configuration
 * 
 * This file contains all configurable parameters for the classification algorithm.
 * Modify these values to fine-tune classification behavior for different regions or crops.
 */

export interface ClassificationThresholds {
  highYield: {
    minProductivityScore: number;
    minAverageYield: number;
  };
  lowYield: {
    maxProductivityScore: number;
    maxAverageYield: number;
  };
}

export interface FactorWeights {
  yieldConsistency: number;
  soilQuality: number;
  moistureAdequacy: number;
  seasonalPerformance: number;
}

export interface MoistureRanges {
  optimal: { min: number; max: number };
  adequate: { min: number; max: number };
  poor: { min: number; max: number };
}

export interface CropSpecificConfig {
  [cropType: string]: {
    thresholds: ClassificationThresholds;
    optimalMoisture: { min: number; max: number };
    expectedYieldRange: { min: number; max: number };
    soilRequirements: {
      minPH: number;
      maxPH: number;
      preferredSoilTypes: string[];
    };
  };
}

export class ClassificationConfig {
  // Default classification thresholds
  static readonly DEFAULT_THRESHOLDS: ClassificationThresholds = {
    highYield: {
      minProductivityScore: 75,
      minAverageYield: 3.5,
    },
    lowYield: {
      maxProductivityScore: 50,
      maxAverageYield: 2.0,
    },
  };

  // Factor weights for productivity score calculation
  static readonly FACTOR_WEIGHTS: FactorWeights = {
    yieldConsistency: 0.30,
    soilQuality: 0.25,
    moistureAdequacy: 0.25,
    seasonalPerformance: 0.20,
  };

  // Moisture level ranges
  static readonly MOISTURE_RANGES: MoistureRanges = {
    optimal: { min: 40, max: 70 },
    adequate: { min: 30, max: 80 },
    poor: { min: 0, max: 100 }, // Outside adequate range
  };

  // Crop-specific configurations
  static readonly CROP_CONFIGS: CropSpecificConfig = {
    'Maize': {
      thresholds: {
        highYield: { minProductivityScore: 75, minAverageYield: 4.0 },
        lowYield: { maxProductivityScore: 50, maxAverageYield: 2.5 },
      },
      optimalMoisture: { min: 45, max: 65 },
      expectedYieldRange: { min: 2.0, max: 6.0 },
      soilRequirements: {
        minPH: 6.0,
        maxPH: 7.5,
        preferredSoilTypes: ['Loam', 'Sandy Loam', 'Clay Loam'],
      },
    },
    'Rice': {
      thresholds: {
        highYield: { minProductivityScore: 70, minAverageYield: 3.5 },
        lowYield: { maxProductivityScore: 45, maxAverageYield: 2.0 },
      },
      optimalMoisture: { min: 60, max: 90 },
      expectedYieldRange: { min: 1.5, max: 5.0 },
      soilRequirements: {
        minPH: 5.5,
        maxPH: 7.0,
        preferredSoilTypes: ['Clay', 'Clay Loam', 'Silty Clay'],
      },
    },
    'Cassava': {
      thresholds: {
        highYield: { minProductivityScore: 70, minAverageYield: 15.0 },
        lowYield: { maxProductivityScore: 45, maxAverageYield: 8.0 },
      },
      optimalMoisture: { min: 35, max: 60 },
      expectedYieldRange: { min: 5.0, max: 25.0 },
      soilRequirements: {
        minPH: 5.5,
        maxPH: 7.0,
        preferredSoilTypes: ['Sandy Loam', 'Loam', 'Well-drained Clay'],
      },
    },
    'Yam': {
      thresholds: {
        highYield: { minProductivityScore: 72, minAverageYield: 12.0 },
        lowYield: { maxProductivityScore: 48, maxAverageYield: 6.0 },
      },
      optimalMoisture: { min: 40, max: 70 },
      expectedYieldRange: { min: 4.0, max: 20.0 },
      soilRequirements: {
        minPH: 6.0,
        maxPH: 7.5,
        preferredSoilTypes: ['Well-drained Loam', 'Sandy Loam'],
      },
    },
    'Groundnut': {
      thresholds: {
        highYield: { minProductivityScore: 75, minAverageYield: 2.5 },
        lowYield: { maxProductivityScore: 50, maxAverageYield: 1.2 },
      },
      optimalMoisture: { min: 35, max: 55 },
      expectedYieldRange: { min: 0.8, max: 3.5 },
      soilRequirements: {
        minPH: 6.0,
        maxPH: 7.0,
        preferredSoilTypes: ['Sandy Loam', 'Loam'],
      },
    },
    'Sorghum': {
      thresholds: {
        highYield: { minProductivityScore: 73, minAverageYield: 3.0 },
        lowYield: { maxProductivityScore: 48, maxAverageYield: 1.5 },
      },
      optimalMoisture: { min: 30, max: 50 },
      expectedYieldRange: { min: 1.0, max: 4.5 },
      soilRequirements: {
        minPH: 6.0,
        maxPH: 8.0,
        preferredSoilTypes: ['Sandy Loam', 'Clay Loam', 'Well-drained Clay'],
      },
    },
    'Millet': {
      thresholds: {
        highYield: { minProductivityScore: 70, minAverageYield: 2.0 },
        lowYield: { maxProductivityScore: 45, maxAverageYield: 1.0 },
      },
      optimalMoisture: { min: 25, max: 45 },
      expectedYieldRange: { min: 0.5, max: 3.0 },
      soilRequirements: {
        minPH: 5.5,
        maxPH: 7.5,
        preferredSoilTypes: ['Sandy Loam', 'Sandy', 'Well-drained Loam'],
      },
    },
  };

  // Confidence calculation parameters
  static readonly CONFIDENCE_PARAMS = {
    minDataPoints: 3,
    optimalDataPoints: 5,
    completeDataBonus: 0.2,
    recentDataWeight: 1.5,
  };

  // Urgency calculation parameters
  static readonly URGENCY_PARAMS = {
    baseUrgencyMultiplier: 2,
    criticalYieldThreshold: 1.5,
    severeYieldThreshold: 2.0,
    decliningTrendPenalty: 25,
  };

  // Regional adjustment factors (for future enhancement)
  static readonly REGIONAL_ADJUSTMENTS = {
    'Northern Nigeria': {
      yieldAdjustment: 0.9, // Adjust for arid conditions
      moistureWeight: 0.35, // Increase moisture importance
    },
    'Middle Belt': {
      yieldAdjustment: 1.0, // Standard conditions
      moistureWeight: 0.25, // Standard moisture weight
    },
    'Southern Nigeria': {
      yieldAdjustment: 1.1, // Favorable conditions
      moistureWeight: 0.20, // Reduce moisture weight (abundant rainfall)
    },
  };

  /**
   * Get configuration for specific crop type
   */
  static getCropConfig(cropType: string) {
    return this.CROP_CONFIGS[cropType] || {
      thresholds: this.DEFAULT_THRESHOLDS,
      optimalMoisture: this.MOISTURE_RANGES.optimal,
      expectedYieldRange: { min: 1.0, max: 5.0 },
      soilRequirements: {
        minPH: 6.0,
        maxPH: 7.5,
        preferredSoilTypes: ['Loam'],
      },
    };
  }

  /**
   * Get regional adjustment factors
   */
  static getRegionalAdjustment(region: string) {
    return this.REGIONAL_ADJUSTMENTS[region] || {
      yieldAdjustment: 1.0,
      moistureWeight: 0.25,
    };
  }
}
