import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationStatus } from '../entities/supplier.entity';

export class UpdateRegistrationStatusDto {
  @IsEnum(RegistrationStatus)
  registrationStatus: RegistrationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}