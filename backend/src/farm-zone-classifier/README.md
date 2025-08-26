# Farm Zone Classifier Module

## Overview

The Farm Zone Classifier Module is a standalone, modularized system that classifies farms into productivity zones based on historical data analysis. It categorizes farms into three main productivity zones:

- **High-Yield**: Farms with excellent productivity and consistent performance
- **Moderate-Yield**: Farms with average productivity that have potential for improvement
- **Low-Yield**: Farms requiring urgent intervention and improvement strategies

## Features

### Core Functionality
- **Farm Classification**: Analyze historical data to classify farms into productivity zones
- **Bulk Processing**: Classify multiple farms simultaneously
- **Historical Data Analysis**: Process yields, soil quality scores, and moisture levels
- **Productivity Scoring**: Calculate comprehensive productivity scores (0-100)
- **Recommendation Engine**: Generate actionable recommendations based on classification
- **Statistics Dashboard**: View distribution of farms across productivity zones

### Classification Factors
The module analyzes multiple factors to determine farm productivity:

1. **Yield Consistency (30% weight)**: Measures stability of crop yields over time
2. **Soil Quality (25% weight)**: Average soil quality scores from historical data
3. **Moisture Adequacy (25% weight)**: Optimal moisture level maintenance
4. **Seasonal Performance (20% weight)**: Improvement trends across seasons

### Classification Criteria
- **High-Yield**: Productivity score ≥ 75% AND average yield ≥ 3.5 tons/hectare
- **Low-Yield**: Productivity score < 50% OR average yield < 2.0 tons/hectare
- **Moderate-Yield**: All other farms

## API Endpoints

### Farm Zone Management
- `POST /farm-zone-classifier` - Create new farm zone classification
- `GET /farm-zone-classifier` - Get all farm zones (with optional filtering)
- `GET /farm-zone-classifier/:id` - Get specific farm zone by ID
- `GET /farm-zone-classifier/farm-profile/:farmProfileId` - Get farm zone by farm profile
- `PATCH /farm-zone-classifier/:id` - Update farm zone classification
- `DELETE /farm-zone-classifier/:id` - Delete farm zone classification

### Classification Operations
- `POST /farm-zone-classifier/classify` - Classify a single farm
- `POST /farm-zone-classifier/classify/bulk` - Bulk classify multiple farms

### Analytics
- `GET /farm-zone-classifier/statistics` - Get productivity zone statistics

## Data Models

### FarmZone Entity
```typescript
{
  id: string;
  farmProfile: FarmProfile;
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
```

### Classification Result
```typescript
{
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
```

## Usage Examples

### Create Farm Zone Classification
```typescript
const createDto = {
  farmProfileId: 'farm-profile-uuid',
  historicalData: {
    yields: [3.5, 4.0, 3.8, 4.2, 3.9],
    seasons: ['2021-Wet', '2021-Dry', '2022-Wet', '2022-Dry', '2023-Wet'],
    soilQualityScores: [7.5, 8.0, 7.8, 8.2, 7.9],
    moistureLevels: [55, 60, 58, 62, 59]
  }
};
```

### Classify Single Farm
```typescript
const classifyDto = {
  farmProfileId: 'farm-profile-uuid',
  forceRecalculation: false
};
```

### Bulk Classification
```typescript
const bulkDto = {
  farmProfileIds: ['uuid1', 'uuid2', 'uuid3'],
  forceRecalculation: true
};
```

## Installation & Setup

1. The module is automatically imported in the main AppModule
2. Ensure database entities are synchronized
3. FarmProfile entities must exist before creating farm zones

## Testing

The module includes comprehensive test coverage:

- **Unit Tests**: Service and controller logic testing
- **Integration Tests**: End-to-end API testing with database operations
- **Classification Logic Tests**: Validation of productivity zone assignments

Run tests:
```bash
npm run test farm-zone-classifier
npm run test:e2e farm-zone-classifier
```

## Dependencies

- **TypeORM**: Database operations
- **NestJS**: Framework and dependency injection
- **Class Validator**: Input validation
- **Swagger**: API documentation

## Recommendations Engine

The module generates contextual recommendations based on classification results:

### High-Yield Farms
- Maintain current farming practices
- Consider expanding cultivation area
- Focus on yield consistency if needed

### Moderate-Yield Farms
- Implement soil improvement strategies
- Optimize irrigation scheduling
- Consider soil testing and fertilization
- Improve water management systems

### Low-Yield Farms
- Urgent intervention required
- Comprehensive soil analysis recommended
- Consider crop rotation or alternative crops
- Implement intensive soil rehabilitation
- Install proper irrigation systems

## Future Enhancements

- Machine learning integration for improved classification accuracy
- Weather data integration for environmental factor analysis
- Crop-specific classification models
- Predictive analytics for yield forecasting
- Integration with IoT sensors for real-time data collection
