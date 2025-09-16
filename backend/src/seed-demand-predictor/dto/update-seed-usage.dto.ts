import { PartialType } from '@nestjs/mapped-types';
import { CreateSeedUsageDto } from './create-seed-usage.dto';

export class UpdateSeedUsageDto extends PartialType(CreateSeedUsageDto) {}
