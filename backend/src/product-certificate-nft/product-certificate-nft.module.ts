import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductCertificateNftService } from './product-certificate-nft.service';
import { ProductCertificateNftController } from './product-certificate-nft.controller';

@Module({
  imports: [
    ConfigModule.forFeature(() => ({
      nft: {
        rpcUrl: process.env.NFT_RPC_URL || process.env.FLARE_TESTNET_RPC || 'http://localhost:8545',
        privateKey: process.env.NFT_PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS,
        gasPrice: process.env.NFT_GAS_PRICE || process.env.GAS_PRICE || '25000000000',
        gasLimit: parseInt(process.env.NFT_GAS_LIMIT || process.env.GAS_LIMIT || '500000'),
        name: process.env.NFT_NAME || 'ProductCertificate',
        symbol: process.env.NFT_SYMBOL || 'PCERT',
      },
    })),
  ],
  controllers: [ProductCertificateNftController],
  providers: [ProductCertificateNftService],
  exports: [ProductCertificateNftService],
})
export class ProductCertificateNftModule {}


