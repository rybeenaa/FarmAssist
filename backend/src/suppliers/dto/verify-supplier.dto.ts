import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { VerificationStatus } from '../entities/supplier.entity';

export class VerifySupplierDto {
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsUUID()
  verifiedBy: string;
}