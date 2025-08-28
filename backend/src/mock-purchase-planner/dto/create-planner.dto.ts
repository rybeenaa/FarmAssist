import { PurchaseItemDto } from './purchase-item.dto';
import { IsString, IsArray, ValidateNested, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlannerDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  horizonDays?: number;
}
