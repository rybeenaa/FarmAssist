import { IsNotEmpty, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class ClassifyFarmDto {
  @IsUUID()
  @IsNotEmpty()
  farmProfileId: string;

  @IsOptional()
  @IsBoolean()
  forceRecalculation?: boolean = false;
}

export class BulkClassifyFarmsDto {
  @IsNotEmpty()
  @IsUUID(undefined, { each: true })
  farmProfileIds: string[];

  @IsOptional()
  @IsBoolean()
  forceRecalculation?: boolean = false;
}
