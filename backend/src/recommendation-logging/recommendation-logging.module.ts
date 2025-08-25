import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationLoggingService } from './recommendation-logging.service';
import { RecommendationLoggingController } from './recommendation-logging.controller';
import { RecommendationLog } from './entities/recommendation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecommendationLog])],
  controllers: [RecommendationLoggingController],
  providers: [RecommendationLoggingService],
  exports: [RecommendationLoggingService],
})
export class RecommendationLoggingModule {}