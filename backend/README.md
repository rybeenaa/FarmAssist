<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).



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
