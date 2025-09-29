import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { MintCertificateDto } from './dto/mint-certificate.dto';

@Injectable()
export class ProductCertificateNftService {
  private readonly logger = new Logger(ProductCertificateNftService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | undefined;
  private contract: ethers.Contract | undefined;

  // Minimal ABI required for minting and reading
  private readonly abi = [
    {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'certificateHash', type: 'string' },
        { name: 'batchId', type: 'string' },
        { name: 'metadataURI', type: 'string' },
      ],
      name: 'mintCertificate',
      outputs: [{ name: 'tokenId', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'getCertificate',
      outputs: [
        { name: 'certificateHash', type: 'string' },
        { name: 'batchId', type: 'string' },
        { name: 'issuer', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('nft.rpcUrl');
    const privateKey = this.configService.get<string>('nft.privateKey');
    const contractAddress = this.configService.get<string>('nft.contractAddress');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
    if (contractAddress && this.wallet) {
      this.contract = new ethers.Contract(contractAddress, this.abi, this.wallet);
    }
  }

  async mintCertificate(dto: MintCertificateDto) {
    if (!this.contract || !this.wallet) {
      throw new Error('NFT contract not configured');
    }
    const tx = await this.contract.mintCertificate(
      dto.to,
      dto.certificateHash,
      dto.batchId,
      dto.metadataURI || ''
    );
    const receipt = await tx.wait();
    const event = receipt.logs?.[0];
    return {
      transactionHash: receipt.hash,
      tokenId: event ? ethers.getBigInt(event.topics[event.topics.length - 1]).toString() : undefined,
      status: receipt.status,
    };
  }

  async getTokenMetadata(tokenId: string) {
    if (!this.contract) {
      throw new Error('NFT contract not configured');
    }
    const uri = await this.contract.tokenURI(tokenId);
    const cert = await this.contract.getCertificate(tokenId);
    return { tokenId, tokenURI: uri, certificate: cert };
  }
}


