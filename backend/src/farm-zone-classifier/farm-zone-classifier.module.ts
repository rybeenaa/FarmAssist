import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmZoneClassifierService } from './farm-zone-classifier.service';
import { FarmZoneClassifierController } from './farm-zone-classifier.controller';
import { FarmZone } from './entities/farm-zone.entity';
import { FarmProfile } from '../farm-profile/farm-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FarmZone, FarmProfile])],
  controllers: [FarmZoneClassifierController],
  providers: [FarmZoneClassifierService],
  exports: [FarmZoneClassifierService],
})
export class FarmZoneClassifierModule {}