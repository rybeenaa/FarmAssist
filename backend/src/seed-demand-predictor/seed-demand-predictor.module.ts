import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedDemandPredictorController } from './seed-demand-predictor.controller';
import { SeedDemandPredictorService } from './seed-demand-predictor.service';
import { SeedUsage } from './entities/seed-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeedUsage])],
  controllers: [SeedDemandPredictorController],
  providers: [SeedDemandPredictorService],
  exports: [SeedDemandPredictorService], // Export service for use in other modules if needed
})
export class SeedDemandPredictorModule {}
