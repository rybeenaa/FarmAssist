import { Module } from '@nestjs/common';
import { FarmActivityService } from './farm-activity.service';
import { FarmActivityController } from './farm-activity.controller';
import { MemoryActivityRepository } from './repositories/memory-activity.repository';

@Module({
  controllers: [FarmActivityController],
  providers: [
    { provide: 'ActivityRepository', useClass: MemoryActivityRepository },
    FarmActivityService,
  ],
  exports: [FarmActivityService],
})
export class FarmActivityModule {}