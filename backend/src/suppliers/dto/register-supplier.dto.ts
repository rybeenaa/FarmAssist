import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUrl,
  IsObject,
  ValidateNested,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierType } from '../entities/supplier.entity';

class BankDetailsDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  routingNumber?: string;
}

class BusinessHoursDto {
  @IsOptional()
  @IsString()
  monday?: string;

  @IsOptional()
  @IsString()
  tuesday?: string;

  @IsOptional()
  @IsString()
  wednesday?: string;

  @IsOptional()
  @IsString()
  thursday?: string;

  @IsOptional()
  @IsString()
  friday?: string;

  @IsOptional()
  @IsString()
  saturday?: string;

  @IsOptional()
  @IsString()
  sunday?: string;
}

export class RegisterSupplierDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  readonly contactPerson: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly phone: string;

  @IsString()
  @IsNotEmpty()
  readonly address: string;

  @IsString()
  @IsNotEmpty()
  readonly city: string;

  @IsString()
  @IsNotEmpty()
  readonly state: string;

  @IsString()
  @IsNotEmpty()
  readonly country: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly longitude: number;

  @IsArray()
  @IsString({ each: true })
  readonly products: string[];

  @IsEnum(SupplierType)
  readonly supplierType: SupplierType;

  @IsOptional()
  @IsString()
  readonly businessRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  readonly taxIdentificationNumber?: string;

  @IsOptional()
  @IsUrl()
  readonly website?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly certifications?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly yearsInBusiness?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly serviceAreas?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly minimumOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly deliveryRadius?: number;

  @IsOptional()
  @IsBoolean()
  readonly offersDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly acceptsOnlinePayments?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly paymentMethods?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  readonly bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  readonly businessHours?: BusinessHoursDto;
}