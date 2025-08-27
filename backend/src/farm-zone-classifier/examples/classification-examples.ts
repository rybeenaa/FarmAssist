/**
 * Farm Zone Classifier Examples
 * 
 * This file contains example data and usage patterns for the Farm Zone Classifier Module.
 * These examples demonstrate how different types of farms would be classified.
 */

import { ProductivityZone } from '../entities/farm-zone.entity';
import { CreateFarmZoneDto } from '../dto/create-farm-zone.dto';
import { ClassifyFarmDto } from '../dto/classify-farm.dto';

// Example 1: High-Yield Farm
export const highYieldFarmExample: CreateFarmZoneDto = {
  farmProfileId: 'high-yield-farm-uuid',
  historicalData: {
    yields: [4.5, 4.8, 4.6, 5.0, 4.7], // Consistently high yields (tons/hectare)
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [8.5, 9.0, 8.7, 9.2, 8.8], // High soil quality (0-10 scale)
    moistureLevels: [55, 60, 58, 62, 59], // Optimal moisture levels (40-70%)
  },
  // Optional: These will be calculated automatically if not provided
  averageYield: 4.72,
  productivityScore: 92.5,
};

// Example 2: Moderate-Yield Farm
export const moderateYieldFarmExample: CreateFarmZoneDto = {
  farmProfileId: 'moderate-yield-farm-uuid',
  historicalData: {
    yields: [2.8, 3.2, 2.9, 3.5, 3.1], // Moderate yields with some variation
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [6.0, 6.5, 6.2, 6.8, 6.3], // Average soil quality
    moistureLevels: [45, 50, 48, 52, 49], // Adequate moisture levels
  },
};

// Example 3: Low-Yield Farm
export const lowYieldFarmExample: CreateFarmZoneDto = {
  farmProfileId: 'low-yield-farm-uuid',
  historicalData: {
    yields: [1.5, 1.8, 1.6, 1.9, 1.7], // Low and inconsistent yields
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [3.0, 3.5, 3.2, 3.8, 3.3], // Poor soil quality
    moistureLevels: [25, 30, 28, 32, 29], // Inadequate moisture levels
  },
};

// Example 4: Farm with Inconsistent Performance
export const inconsistentFarmExample: CreateFarmZoneDto = {
  farmProfileId: 'inconsistent-farm-uuid',
  historicalData: {
    yields: [2.0, 4.5, 1.8, 4.2, 2.1], // Highly variable yields
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [5.0, 7.5, 4.8, 7.2, 5.1], // Variable soil quality
    moistureLevels: [35, 65, 32, 68, 38], // Variable moisture levels
  },
};

// Example Classification Requests
export const classificationExamples = {
  // Single farm classification
  singleFarm: {
    farmProfileId: 'farm-to-classify-uuid',
    forceRecalculation: false,
  } as ClassifyFarmDto,

  // Single farm with forced recalculation
  singleFarmForced: {
    farmProfileId: 'farm-to-reclassify-uuid',
    forceRecalculation: true,
  } as ClassifyFarmDto,

  // Bulk classification
  bulkFarms: {
    farmProfileIds: [
      'farm-1-uuid',
      'farm-2-uuid',
      'farm-3-uuid',
      'farm-4-uuid',
      'farm-5-uuid',
    ],
    forceRecalculation: false,
  },
};

// Expected Classification Results
export const expectedResults = {
  highYield: {
    zoneType: ProductivityZone.HIGH_YIELD,
    expectedProductivityScore: '>= 75',
    expectedAverageYield: '>= 3.5',
    expectedRecommendations: [
      'Maintain current farming practices',
      'Consider expanding cultivation area',
    ],
  },
  
  moderateYield: {
    zoneType: ProductivityZone.MODERATE_YIELD,
    expectedProductivityScore: '50-74',
    expectedAverageYield: '2.0-3.4',
    expectedRecommendations: [
      'Implement soil improvement strategies',
      'Optimize irrigation scheduling',
    ],
  },
  
  lowYield: {
    zoneType: ProductivityZone.LOW_YIELD,
    expectedProductivityScore: '< 50',
    expectedAverageYield: '< 2.0',
    expectedRecommendations: [
      'Urgent intervention required',
      'Comprehensive soil analysis recommended',
      'Consider crop rotation or alternative crops',
    ],
  },
};

// Sample API Usage Examples
export const apiUsageExamples = {
  // Create farm zone classification
  createFarmZone: `
    POST /farm-zone-classifier
    Content-Type: application/json
    
    {
      "farmProfileId": "farm-profile-uuid",
      "historicalData": {
        "yields": [3.5, 4.0, 3.8, 4.2, 3.9],
        "seasons": ["2021-Wet", "2021-Dry", "2022-Wet", "2022-Dry", "2023-Wet"],
        "soilQualityScores": [7.5, 8.0, 7.8, 8.2, 7.9],
        "moistureLevels": [55, 60, 58, 62, 59]
      }
    }
  `,

  // Get all farm zones with filtering
  getAllFarmZones: `
    GET /farm-zone-classifier?zoneType=high-yield
  `,

  // Classify a single farm
  classifyFarm: `
    POST /farm-zone-classifier/classify
    Content-Type: application/json
    
    {
      "farmProfileId": "farm-profile-uuid",
      "forceRecalculation": false
    }
  `,

  // Bulk classify farms
  bulkClassify: `
    POST /farm-zone-classifier/classify/bulk
    Content-Type: application/json
    
    {
      "farmProfileIds": ["uuid1", "uuid2", "uuid3"],
      "forceRecalculation": true
    }
  `,

  // Get statistics
  getStatistics: `
    GET /farm-zone-classifier/statistics
  `,
};

// Validation Rules
export const validationRules = {
  yields: {
    description: 'Array of yield values in tons per hectare',
    type: 'number[]',
    constraints: 'Each value should be >= 0',
  },
  seasons: {
    description: 'Array of season identifiers',
    type: 'string[]',
    constraints: 'Should match the length of yields array',
  },
  soilQualityScores: {
    description: 'Array of soil quality scores',
    type: 'number[]',
    constraints: 'Each value should be between 0 and 10',
  },
  moistureLevels: {
    description: 'Array of moisture level percentages',
    type: 'number[]',
    constraints: 'Each value should be between 0 and 100',
  },
};

// Performance Benchmarks
export const performanceBenchmarks = {
  classification: {
    singleFarm: '< 100ms',
    bulkClassification: '< 500ms per farm',
    databaseOperations: '< 200ms',
  },
  accuracy: {
    highYieldDetection: '> 90%',
    lowYieldDetection: '> 85%',
    overallAccuracy: '> 88%',
  },
};
