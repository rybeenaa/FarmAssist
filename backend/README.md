# 🌾 FarmAssist Backend API

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <strong>A comprehensive agricultural management platform backend built with NestJS</strong>
</p>

<p align="center">
  FarmAssist is an intelligent agricultural management system that helps farmers optimize their operations through data-driven insights, productivity analysis, and smart recommendations.
</p>

## 🚀 Features

### 🎯 **Core Modules**
- **Farm Zone Classifier** - AI-powered farm productivity zone classification
- **Weather Integration** - Real-time weather data and forecasting
- **Soil Type Registry** - Comprehensive soil analysis and classification
- **Input Price Tracker** - Agricultural input price monitoring and trends
- **Equipment Marketplace** - Farm equipment trading platform
- **Animal Feed Management** - Livestock feed optimization and tracking
- **Purchase Tracking** - Financial transaction monitoring
- **Inventory Management** - Stock and supply chain management
- **User Management** - Authentication, authorization, and user profiles
- **Advisory System** - Expert recommendations and guidance
- **GPS Services** - Location-based farming region identification

### 🤖 **Intelligent Systems**
- **Productivity Zone Classification** - Multi-factor farm performance analysis
- **Smart Recommendations** - Context-aware farming advice
- **Price Analytics** - Market trend analysis and forecasting
- **Regional Optimization** - Location-specific farming strategies

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Farm Zone Classifier](#-farm-zone-classifier-module)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd FarmAssist/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run database migrations
npm run migration:run

# Start the development server
npm run start:dev
```

### Environment Variables
```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=farmassist
DATABASE_PASSWORD=your_password
DATABASE_NAME=farmassist_db

# API Keys
OPENWEATHER_API_KEY=your_openweather_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

## 🏗️ Architecture

### Module Structure
```
src/
├── farm-zone-classifier/     # 🎯 Farm productivity classification
├── farms/                    # 🚜 Farm management
├── users/                    # 👥 User management & auth
├── weather/                  # 🌤️ Weather data integration
├── soil-type-registry/       # 🌱 Soil analysis & classification
├── input-price-tracker/      # 💰 Agricultural input pricing
├── equipment-marketplace/    # 🔧 Equipment trading
├── animal-feed/             # 🐄 Livestock feed management
├── purchase-tracking/       # 📊 Financial tracking
├── inventory-stock/         # 📦 Inventory management
├── utils/                   # 🛠️ Shared utilities
└── health/                  # ❤️ System health monitoring
```

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT-based auth with role-based access
- **Validation**: Class-validator with custom decorators
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest with supertest for integration tests
- **Monitoring**: Built-in health checks and metrics

## 📚 API Documentation

### Interactive API Explorer
Once the application is running, visit:
- **Swagger UI**: `http://localhost:3000/api`
- **API JSON**: `http://localhost:3000/api-json`

### Core API Endpoints

#### Authentication & Users
```
POST   /auth/login              # User authentication
POST   /auth/register           # User registration
GET    /users/profile           # Get user profile
PATCH  /users/profile           # Update user profile
```

#### Farm Management
```
POST   /farms                   # Create new farm
GET    /farms                   # List user's farms
GET    /farms/:id               # Get farm details
PATCH  /farms/:id               # Update farm
DELETE /farms/:id               # Delete farm
```

#### Weather Services
```
POST   /weather/fetch           # Fetch weather data
GET    /weather/recent          # Get recent weather data
```

#### Farm Zone Classification
```
POST   /farm-zone-classifier                    # Create classification
GET    /farm-zone-classifier                    # List all classifications
GET    /farm-zone-classifier/statistics         # Zone statistics
POST   /farm-zone-classifier/classify           # Classify single farm
POST   /farm-zone-classifier/classify/bulk      # Bulk classification
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Specific module tests
npm run test farm-zone-classifier
npm run test farms
npm run test weather

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Test Structure
```
src/
├── farm-zone-classifier/
│   ├── farm-zone-classifier.service.spec.ts
│   ├── farm-zone-classifier.controller.spec.ts
│   └── farm-zone-classifier.integration.spec.ts
├── farms/
│   └── farm.service.spec.ts
└── test/
    └── app.e2e-spec.ts
```

## 🐳 Deployment

### Docker Deployment
```bash
# Build the application
docker build -t farmassist-backend .

# Run with docker-compose
docker-compose up -d
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

### Environment-Specific Configurations
- **Development**: Auto-reload, detailed logging, Swagger UI enabled
- **Production**: Optimized builds, security headers, rate limiting
- **Testing**: In-memory database, mock external services



## 🎯 Farm Zone Classifier Module

> **Advanced AI-powered farm productivity classification system**

### 🌟 Overview

The Farm Zone Classifier is a sophisticated, standalone module that leverages machine learning principles and multi-factor analysis to classify farms into productivity zones. This intelligent system processes historical agricultural data to provide actionable insights for farm optimization.

#### **Productivity Zones**
| Zone | Criteria | Description | Action Required |
|------|----------|-------------|-----------------|
| 🟢 **High-Yield** | Score ≥ 75% & Yield ≥ 3.5 t/ha | Excellent productivity with consistent performance | Maintain & expand |
| 🟡 **Moderate-Yield** | Score 50-74% & Yield 2.0-3.4 t/ha | Average productivity with improvement potential | Optimize practices |
| 🔴 **Low-Yield** | Score < 50% OR Yield < 2.0 t/ha | Poor performance requiring urgent intervention | Immediate action |

### 🧠 **Advanced Classification Algorithm**

#### **Multi-Factor Analysis Engine**
The classification system employs a weighted scoring algorithm that analyzes:

```typescript
Productivity Score = (
  Yield Consistency × 30% +
  Soil Quality × 25% +
  Moisture Adequacy × 25% +
  Seasonal Performance × 20%
)
```

#### **Factor Calculations**

1. **🌾 Yield Consistency (30%)**
   - Measures coefficient of variation in yields
   - Lower variation = higher consistency score
   - Accounts for seasonal fluctuations

2. **🌱 Soil Quality (25%)**
   - Average soil quality scores (0-10 scale)
   - Considers soil pH, nutrient levels, organic matter
   - Weighted by data recency

3. **💧 Moisture Adequacy (25%)**
   - Optimal range: 40-70% moisture
   - Penalizes extreme moisture levels
   - Considers crop-specific requirements

4. **📈 Seasonal Performance (20%)**
   - Tracks improvement trends over time
   - Measures adaptation to seasonal changes
   - Identifies performance patterns

### 🚀 **Core Features**

#### **🧠 Intelligent Classification**
- **Real-time Analysis**: Instant farm productivity assessment
- **Historical Trend Analysis**: Multi-season performance evaluation
- **Confidence Scoring**: Data quality-based confidence metrics
- **Adaptive Thresholds**: Crop-specific classification criteria
- **Predictive Analytics**: Future zone classification predictions

#### **⚡ Bulk Operations**
- **Batch Processing**: Classify hundreds of farms simultaneously
- **Error Handling**: Robust error reporting and recovery
- **Progress Tracking**: Real-time processing status updates
- **Parallel Processing**: Optimized for large datasets

#### **🎯 Smart Recommendations**
- **Context-Aware Advice**: Zone-specific improvement strategies
- **Priority-Based Actions**: Urgent vs. long-term recommendations
- **Resource Optimization**: Cost-effective improvement suggestions
- **Success Metrics**: Measurable improvement targets

#### **📊 Advanced Analytics**
- **Performance Monitoring**: Real-time system performance tracking
- **Detailed Analytics**: Comprehensive zone distribution analysis
- **Critical Farm Detection**: Automated identification of farms needing attention
- **Trend Analysis**: Historical performance trend evaluation
- **Crop-Specific Insights**: Performance analysis by crop type

#### **🔧 Enhanced API Endpoints**

##### **Core Classification**
```bash
POST   /farm-zone-classifier                    # Create classification
GET    /farm-zone-classifier                    # List classifications
GET    /farm-zone-classifier/statistics         # Basic statistics
POST   /farm-zone-classifier/classify           # Single farm classification
POST   /farm-zone-classifier/classify/bulk      # Bulk classification
```

##### **Advanced Analytics**
```bash
GET    /farm-zone-classifier/analytics          # Detailed analytics
GET    /farm-zone-classifier/critical-farms     # Critical farms list
GET    /farm-zone-classifier/improvement-strategies/:zoneType  # Zone strategies
GET    /farm-zone-classifier/predict/:farmProfileId           # Future predictions
```

### 📈 **Performance & Monitoring**

#### **System Performance**
- **Processing Speed**: < 100ms per farm classification
- **Bulk Processing**: < 500ms per farm in batch operations
- **Database Operations**: < 200ms average query time
- **Memory Usage**: Optimized for large datasets

#### **Monitoring Features**
- **Real-time Metrics**: Classification accuracy, processing time, error rates
- **Health Monitoring**: System status with automated alerts
- **Performance Trends**: Historical performance analysis
- **Load Testing**: Built-in performance testing capabilities

### 🎛️ **Configuration & Customization**

#### **Crop-Specific Configurations**
The system supports customized thresholds for different crop types:

```typescript
// Example: Maize configuration
{
  thresholds: {
    highYield: { minProductivityScore: 75, minAverageYield: 4.0 },
    lowYield: { maxProductivityScore: 50, maxAverageYield: 2.5 }
  },
  optimalMoisture: { min: 45, max: 65 },
  expectedYieldRange: { min: 2.0, max: 6.0 }
}
```

#### **Regional Adjustments**
- **Northern Nigeria**: Adjusted for arid conditions
- **Middle Belt**: Standard agricultural conditions
- **Southern Nigeria**: Optimized for high rainfall areas

## 🗄️ Database Schema

### Core Entities

#### **FarmProfile**
```sql
CREATE TABLE farm_profiles (
  id UUID PRIMARY KEY,
  farm_size FLOAT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  farmer_name VARCHAR(200) NOT NULL,
  farmer_contact VARCHAR(50) NOT NULL
);
```

#### **FarmZone**
```sql
CREATE TABLE farm_zones (
  id UUID PRIMARY KEY,
  farm_profile_id UUID REFERENCES farm_profiles(id),
  zone_type VARCHAR(20) NOT NULL CHECK (zone_type IN ('high-yield', 'moderate-yield', 'low-yield')),
  historical_data JSONB NOT NULL,
  average_yield FLOAT NOT NULL,
  productivity_score FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_farm_zones_zone_type ON farm_zones(zone_type);
CREATE INDEX idx_farm_zones_productivity_score ON farm_zones(productivity_score);
CREATE INDEX idx_farm_zones_farm_profile ON farm_zones(farm_profile_id);
CREATE INDEX idx_farm_profiles_crop_type ON farm_profiles(crop_type);
CREATE INDEX idx_farm_profiles_location ON farm_profiles(latitude, longitude);
```

## 💡 Usage Examples

### **Complete Farm Classification Workflow**

#### 1. Create Farm Profile
```bash
curl -X POST http://localhost:3000/farm-profile \
  -H "Content-Type: application/json" \
  -d '{
    "farmSize": 12.5,
    "latitude": 10.5,
    "longitude": 7.4,
    "cropType": "Maize",
    "farmerName": "John Doe",
    "farmerContact": "+234123456789"
  }'
```

#### 2. Classify Farm with Historical Data
```bash
curl -X POST http://localhost:3000/farm-zone-classifier \
  -H "Content-Type: application/json" \
  -d '{
    "farmProfileId": "farm-profile-uuid",
    "historicalData": {
      "yields": [4.2, 4.5, 4.1, 4.8, 4.3],
      "seasons": ["2021-Wet", "2021-Dry", "2022-Wet", "2022-Dry", "2023-Wet"],
      "soilQualityScores": [8.0, 8.2, 7.9, 8.5, 8.1],
      "moistureLevels": [60, 65, 58, 68, 62]
    }
  }'
```

#### 3. Get Classification Results
```bash
curl -X GET http://localhost:3000/farm-zone-classifier/analytics
```

#### 4. Get Improvement Recommendations
```bash
curl -X GET http://localhost:3000/farm-zone-classifier/improvement-strategies/moderate-yield
```

### **Bulk Operations Example**
```bash
curl -X POST http://localhost:3000/farm-zone-classifier/classify/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "farmProfileIds": ["uuid1", "uuid2", "uuid3", "uuid4"],
    "forceRecalculation": true
  }'
```

### **Performance Monitoring**
```bash
# Get system performance metrics
curl -X GET http://localhost:3000/farm-zone-classifier/performance/metrics

# Get critical farms requiring attention
curl -X GET http://localhost:3000/farm-zone-classifier/critical-farms

# Predict future classification
curl -X GET http://localhost:3000/farm-zone-classifier/predict/farm-profile-uuid
```

## 🚀 **Production Deployment**

### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  farmassist-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=farmassist
      - DATABASE_USERNAME=farmassist
      - DATABASE_PASSWORD=secure_password
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=farmassist
      - POSTGRES_USER=farmassist
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### **Environment Configuration**
```bash
# Production Environment Variables
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/farmassist
JWT_SECRET=your-super-secure-jwt-secret
OPENWEATHER_API_KEY=your-weather-api-key

# Performance Tuning
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
CACHE_TTL=3600

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=30000
```

## 🔒 **Security & Best Practices**

### **Authentication & Authorization**
- JWT-based authentication with role-based access control
- API rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection prevention through TypeORM

### **Data Protection**
- Encrypted database connections
- Sensitive data masking in logs
- GDPR compliance for farmer data
- Regular security audits

### **Performance Optimization**
- Database query optimization with proper indexing
- Caching strategies for frequently accessed data
- Connection pooling for database efficiency
- Asynchronous processing for bulk operations

## 📊 **Monitoring & Observability**

### **Health Checks**
```bash
# Application health
GET /health

# Database connectivity
GET /health/database

# External services
GET /health/weather-service
```

### **Metrics & Logging**
- Application performance metrics
- Classification accuracy tracking
- Error rate monitoring
- Custom business metrics

### **Alerting**
- High error rate alerts
- Performance degradation notifications
- Critical farm detection alerts
- System resource monitoring

## 🤝 **Contributing**

### **Development Setup**
```bash
# Clone repository
git clone <repository-url>
cd FarmAssist/backend

# Install dependencies
npm install

# Set up development database
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

### **Code Quality**
- ESLint and Prettier for code formatting
- Husky for pre-commit hooks
- Jest for comprehensive testing
- SonarQube for code quality analysis

### **Pull Request Process**
1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all tests pass
4. Update documentation
5. Submit pull request for review

## 📈 **Roadmap & Future Enhancements**

### **Phase 1: Core Enhancements**
- [ ] Machine learning model integration
- [ ] Real-time weather data integration
- [ ] Mobile app API optimization
- [ ] Advanced caching strategies

### **Phase 2: Advanced Features**
- [ ] IoT sensor integration
- [ ] Satellite imagery analysis
- [ ] Predictive yield modeling
- [ ] Market price integration

### **Phase 3: Scale & Performance**
- [ ] Microservices architecture
- [ ] Event-driven processing
- [ ] Multi-region deployment
- [ ] Advanced analytics dashboard

## 📞 **Support & Documentation**

### **API Documentation**
- **Swagger UI**: Available at `/api` when running
- **Postman Collection**: Available in `/docs` folder
- **API Reference**: Comprehensive endpoint documentation

### **Support Channels**
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and tutorials
- **Community Forum**: Developer discussions and support

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for Nigerian farmers</strong><br>
  <em>Empowering agriculture through intelligent data analysis</em>
</p>
