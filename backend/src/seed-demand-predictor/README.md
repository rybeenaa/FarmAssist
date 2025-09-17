# Seed Demand Predictor Module

## Overview

The Seed Demand Predictor module is a comprehensive NestJS module that provides intelligent seed demand forecasting capabilities for FarmAssist. It analyzes historical seed usage patterns, regional trends, seasonal variations, and various agricultural factors to predict future seed demands with confidence scoring.

## Features

- **Historical Seed Usage Tracking**: Track and manage seed usage data including farmer information, quantities, areas planted, and agricultural conditions
- **Advanced Demand Prediction**: Generate seed demand forecasts using trend analysis, seasonal patterns, and regional growth factors
- **Confidence Scoring**: Each prediction includes a confidence score based on data quality and historical consistency
- **Regional Analysis**: Comprehensive regional demand summaries and growth rate analysis
- **Bulk Predictions**: Support for generating multiple predictions across regions, seasons, and seed varieties
- **Price Range Estimation**: Predict seed price ranges based on historical cost data
- **Recommendation System**: Intelligent recommendations for inventory management and supply chain optimization
- **Analytics Dashboard**: Detailed analytics on prediction accuracy and trend identification

## Module Structure

```
seed-demand-predictor/
├── dto/
│   ├── create-seed-usage.dto.ts       # DTO for creating seed usage records
│   ├── update-seed-usage.dto.ts       # DTO for updating seed usage records
│   └── prediction-query.dto.ts        # DTOs for prediction queries (single & bulk)
├── entities/
│   └── seed-usage.entity.ts           # TypeORM entity for seed usage data
├── types/
│   └── prediction.types.ts            # TypeScript types and enums
├── seed-demand-predictor.controller.ts # REST API controller
├── seed-demand-predictor.service.ts    # Business logic service
├── seed-demand-predictor.module.ts     # NestJS module definition
├── seed-demand-predictor.service.spec.ts # Unit tests for service
├── seed-demand-predictor.controller.spec.ts # Integration tests for controller
└── README.md                          # This documentation
```

## API Endpoints

### Seed Usage Data Management

#### POST `/seed-demand-predictor/usage`
Create a new seed usage record.

```json
{
  "farmerId": 1,
  "farmerName": "John Doe",
  "seedVariety": "Wheat Premium",
  "quantityUsed": 50.5,
  "areaPlanted": 2.5,
  "season": "spring",
  "year": 2023,
  "region": "North Region",
  "yield": 3500,
  "seedCostPerKg": 25.50,
  "cropType": "cereal"
}
```

#### GET `/seed-demand-predictor/usage`
Retrieve all seed usage records.

#### GET `/seed-demand-predictor/usage/:id`
Retrieve a specific seed usage record by ID.

#### PUT `/seed-demand-predictor/usage/:id`
Update an existing seed usage record.

#### DELETE `/seed-demand-predictor/usage/:id`
Delete a seed usage record.

### Prediction Endpoints

#### GET `/seed-demand-predictor/predict`
Generate seed demand predictions.

**Query Parameters:**
- `region` (optional): Target region for predictions
- `season` (optional): Specific season (spring, summer, fall, winter)
- `seedVariety` (optional): Specific seed variety
- `cropType` (optional): Type of crop (cereal, vegetable, fruit, legume, oilseed, fiber, forage, other)
- `yearsBack` (optional): Number of historical years to analyze (default: 3)
- `predictionYear` (optional): Target year for predictions (default: next year)

**Response:**
```json
{
  "statusCode": 200,
  "message": "Seed demand predictions generated successfully",
  "data": {
    "predictions": [
      {
        "seedVariety": "Wheat Premium",
        "region": "North Region",
        "season": "spring",
        "year": 2024,
        "predictedDemand": 60.5,
        "confidence": 85,
        "factors": {
          "historicalTrend": 0.15,
          "seasonalPattern": 0.1,
          "regionalGrowth": 0.05
        },
        "recommendations": [
          "Increase inventory by 20%",
          "Monitor weather conditions"
        ],
        "priceRange": {
          "min": 20,
          "max": 30,
          "average": 25
        }
      }
    ],
    "summary": {
      "totalPredictions": 1,
      "averageConfidence": 85,
      "totalPredictedDemand": 60.5
    }
  }
}
```

#### GET `/seed-demand-predictor/predict/bulk`
Generate bulk predictions for multiple regions and varieties.

**Query Parameters:**
- `regions[]`: Array of regions
- `seasons[]`: Array of seasons
- `seedVarieties[]`: Array of seed varieties
- `cropTypes[]`: Array of crop types
- `yearsBack`: Number of historical years
- `predictionYear`: Target year for predictions

#### GET `/seed-demand-predictor/regional-summary/:region`
Get comprehensive demand summary for a specific region.

**Optional Query Parameters:**
- `year`: Target year for summary (default: current year)

#### GET `/seed-demand-predictor/analytics`
Retrieve prediction analytics and trends.

### Health and Status Endpoints

#### GET `/seed-demand-predictor/health`
Health check endpoint.

#### GET `/seed-demand-predictor/status`
Service status and feature information.

## Data Models

### SeedUsage Entity

The `SeedUsage` entity tracks historical seed consumption data:

```typescript
{
  id: number;
  farmerId: number;
  farmerName: string;
  seedVariety: string;
  quantityUsed: number;        // in kg
  areaPlanted: number;         // in hectares
  season: PredictionSeason;    // spring, summer, fall, winter
  year: number;
  region: string;
  yield?: number;              // in kg per hectare
  seedCostPerKg?: number;      // cost in local currency
  cropType?: CropType;         // cereal, vegetable, etc.
  weatherConditions?: {
    avgTemperature: number;
    totalRainfall: number;
    humidity: number;
  };
  soilConditions?: {
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Prediction Result

```typescript
{
  seedVariety: string;
  region: string;
  season: PredictionSeason;
  year: number;
  predictedDemand: number;     // in kg
  confidence: number;          // percentage (0-100)
  factors: {
    historicalTrend: number;   // growth rate
    seasonalPattern: number;   // seasonal adjustment
    regionalGrowth: number;    // regional growth factor
  };
  recommendations: string[];   // actionable recommendations
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}
```

## Usage Examples

### Creating Seed Usage Records

```typescript
import { SeedDemandPredictorService } from './seed-demand-predictor.service';

// Inject the service
constructor(private seedDemandService: SeedDemandPredictorService) {}

// Create a new record
const seedUsageData = {
  farmerId: 123,
  farmerName: "Jane Smith",
  seedVariety: "Corn Hybrid XYZ",
  quantityUsed: 75.0,
  areaPlanted: 5.0,
  season: PredictionSeason.SPRING,
  year: 2023,
  region: "Central Valley",
  yield: 8500,
  seedCostPerKg: 45.00,
  cropType: CropType.CEREAL
};

const record = await this.seedDemandService.createSeedUsage(seedUsageData);
```

### Generating Predictions

```typescript
// Single prediction query
const predictionQuery = {
  region: "North Region",
  season: PredictionSeason.SPRING,
  seedVariety: "Wheat Premium",
  yearsBack: 5,
  predictionYear: 2024
};

const predictions = await this.seedDemandService.predictSeedDemand(predictionQuery);

// Bulk prediction query
const bulkQuery = {
  regions: ["North Region", "South Region"],
  seasons: [PredictionSeason.SPRING, PredictionSeason.SUMMER],
  seedVarieties: ["Wheat Premium", "Corn Hybrid"],
  yearsBack: 3,
  predictionYear: 2024
};

const bulkPredictions = await this.seedDemandService.bulkPredictDemand(bulkQuery);
```

## Prediction Algorithm

The prediction algorithm combines several factors:

1. **Historical Trend Analysis**: Analyzes year-over-year growth patterns
2. **Seasonal Pattern Recognition**: Identifies seasonal demand variations
3. **Regional Growth Factors**: Accounts for regional agricultural development
4. **Data Quality Assessment**: Evaluates data consistency and completeness
5. **Confidence Scoring**: Generates confidence levels based on data quality and pattern consistency

### Confidence Score Calculation

The confidence score (0-100) is calculated based on:
- Data completeness (40% weight)
- Historical consistency (30% weight)
- Trend stability (20% weight)
- Regional data coverage (10% weight)

## Testing

The module includes comprehensive test suites:

### Unit Tests
- **Service Tests**: Located in `seed-demand-predictor.service.spec.ts`
  - CRUD operations
  - Prediction algorithms
  - Helper methods
  - Error handling

### Integration Tests
- **Controller Tests**: Located in `seed-demand-predictor.controller.spec.ts`
  - API endpoint testing
  - Request/response validation
  - Error handling
  - Edge cases

Run tests with:
```bash
# Unit tests
npm test seed-demand-predictor.service.spec.ts

# Integration tests
npm test seed-demand-predictor.controller.spec.ts

# All tests
npm test seed-demand-predictor
```

## Configuration

The module uses standard NestJS/TypeORM configuration. Ensure your database connection is properly configured in your main application module.

### Environment Variables

No specific environment variables are required for this module, but ensure the following database variables are set:
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

## Error Handling

The module implements comprehensive error handling:

- **Validation Errors**: Input validation using class-validator decorators
- **Database Errors**: Proper handling of TypeORM exceptions
- **Business Logic Errors**: Custom error messages for business rule violations
- **Not Found Errors**: Appropriate 404 responses for missing resources

## Performance Considerations

- Database queries are optimized with proper indexing recommendations
- Bulk operations are designed for efficiency
- Caching can be implemented for frequently accessed predictions
- Pagination is supported for large datasets

## Future Enhancements

Potential future improvements:
- Machine learning integration for more sophisticated predictions
- Weather data integration for climate-based adjustments
- Market price prediction correlation
- Real-time demand adjustments
- Integration with external agricultural data sources
- Advanced visualization and reporting features

## Support

For questions, issues, or contributions related to the Seed Demand Predictor module, please refer to the main FarmAssist project documentation or contact the development team.
