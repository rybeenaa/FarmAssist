import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MockPurchasePlannerModule } from './mock-purchase-planner/mock-purchase-planner.module';
import { AdvisoryModule } from './advisory/advisory.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WeatherModule } from './weather/weather.module';
import { ProcurementModule } from './procurement/procurement.module';
import { HealthModule } from './health/health.module';
import { UtilsModule } from './utils/utils.module';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HealthInterceptor } from './health/health.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { InventoryTrackingModule } from './inventory-stock/inventory-stock.module';
import { PurchaseRecordingModule } from './purchase-tracking/purchase-tracking.module';
import { AnimalFeedModule } from './animal-feed/animal-feed.module';
import { SoilTypeRegistryModule } from './soil-type-registry/soil-type-registry.module';
import { InputPriceTrackerModule } from './input-price-tracker/input-price-tracker.module';
import { RecommendationLoggingModule } from './recommendation-logging/recommendation-logging.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { FertilizerRecommendationModule } from './fertilizer-recommendation/fertilizer-recommendation.module';
import { SeedCatalogModule } from './seed-catalog/seed-catalog.module';
import { VendorsModule } from './vendors/vendors.module';
import { EquipmentMarketplaceModule } from './equipment-marketplace/equipment-marketplace.module';
import { FarmZoneClassifierModule } from './farm-zone-classifier/farm-zone-classifier.module';
import { SeedDemandPredictorModule } from './seed-demand-predictor/seed-demand-predictor.module';
import { CropsModule } from './crops/crops.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        database: configService.get('DATABASE_NAME'),
        password: configService.get('DATABASE_PASSWORD'),
        username: configService.get('DATABASE_USERNAME'),
        port: +configService.get('DATABASE_PORT'),
        host: configService.get('DATABASE_HOST'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    WeatherModule,
    ProcurementModule,
    HealthModule,
    UtilsModule,
    SuppliersModule,
    UserPreferencesModule,
    InventoryTrackingModule,
    PurchaseRecordingModule,
    AnimalFeedModule,
    SoilTypeRegistryModule,
    InputPriceTrackerModule,
    RecommendationLoggingModule,
    RecommendationsModule,
    FertilizerRecommendationModule,
    AdvisoryModule,
    SoilTypeRegistryModule,
    EquipmentMarketplaceModule,
    FarmZoneClassifierModule,
    SeedDemandPredictorModule,
    CropsModule,
  AdvisoryModule,
  FeedbackModule,
  MockPurchasePlannerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HealthInterceptor,
    },
  ],
})
export class AppModule {}
