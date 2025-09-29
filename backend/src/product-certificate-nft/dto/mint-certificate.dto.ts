import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class MintCertificateDto {
  @ApiProperty({ description: 'Recipient wallet address' })
  @IsEthereumAddress()
  to: string;

  @ApiProperty({ description: 'Hash of certification and quality report', minLength: 32 })
  @IsString()
  @Length(32, 256)
  certificateHash: string;

  @ApiProperty({ description: 'Supplier product batch identifier' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ description: 'Optional token metadata URI', required: false })
  @IsString()
  @IsOptional()
  metadataURI?: string;
}


