import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductCertificateNftService } from './product-certificate-nft.service';
import { MintCertificateDto } from './dto/mint-certificate.dto';

@ApiTags('product-certificate-nft')
@Controller('nft/certificates')
export class ProductCertificateNftController {
  constructor(private readonly nftService: ProductCertificateNftService) {}

  @Post('mint')
  async mintCertificate(@Body() dto: MintCertificateDto) {
    return await this.nftService.mintCertificate(dto);
  }

  @Get(':tokenId')
  async getTokenMetadata(@Param('tokenId') tokenId: string) {
    return await this.nftService.getTokenMetadata(tokenId);
  }
}


