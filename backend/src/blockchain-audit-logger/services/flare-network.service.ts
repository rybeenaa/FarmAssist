import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { NetworkType } from '../entities/blockchain-transaction.entity';

export interface FlareNetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  gasLimit: string;
  gasPrice: string;
  nonce: number;
  data: string;
  value: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  gasUsed: string;
  effectiveGasPrice: string;
  status: number;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;
}

@Injectable()
export class FlareNetworkService implements OnModuleInit {
  private readonly logger = new Logger(FlareNetworkService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private readonly networkConfig: FlareNetworkConfig;
  private readonly contractAddress: string;
  private readonly isTestnet: boolean;

  // Audit Logger Smart Contract ABI
  private readonly contractABI = [
    {
      "inputs": [
        {"name": "_dataHash", "type": "string"},
        {"name": "_eventType", "type": "string"},
        {"name": "_timestamp", "type": "uint256"},
        {"name": "_metadata", "type": "string"}
      ],
      "name": "logAuditEvent",
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"name": "_hashes", "type": "string[]"},
        {"name": "_merkleRoot", "type": "string"},
        {"name": "_eventType", "type": "string"},
        {"name": "_timestamp", "type": "uint256"}
      ],
      "name": "logBatchAuditEvent",
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"name": "_eventId", "type": "uint256"}],
      "name": "getAuditEvent",
      "outputs": [
        {"name": "dataHash", "type": "string"},
        {"name": "eventType", "type": "string"},
        {"name": "timestamp", "type": "uint256"},
        {"name": "blockNumber", "type": "uint256"},
        {"name": "submitter", "type": "address"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"name": "_dataHash", "type": "string"}],
      "name": "verifyAuditEvent",
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "name": "eventId", "type": "uint256"},
        {"indexed": true, "name": "submitter", "type": "address"},
        {"indexed": false, "name": "dataHash", "type": "string"},
        {"indexed": false, "name": "eventType", "type": "string"},
        {"indexed": false, "name": "timestamp", "type": "uint256"}
      ],
      "name": "AuditEventLogged",
      "type": "event"
    }
  ];

  constructor(private readonly configService: ConfigService) {
    this.isTestnet = process.env.NODE_ENV !== 'production';
    
    // Get network configuration
    this.networkConfig = this.isTestnet
      ? this.configService.get<FlareNetworkConfig>('flare.testnet')
      : this.configService.get<FlareNetworkConfig>('flare.mainnet');
    
    this.contractAddress = this.configService.get<string>('flare.contractAddress');
    
    if (!this.contractAddress) {
      this.logger.warn('No contract address configured. Smart contract interactions will be disabled.');
    }
  }

  async onModuleInit() {
    await this.initializeFlareConnection();
  }

  /**
   * Initialize connection to Flare Network
   */
  private async initializeFlareConnection(): Promise<void> {
    try {
      this.logger.log(`Connecting to Flare Network: ${this.networkConfig.name}`);
      this.logger.log(`RPC URL: ${this.networkConfig.rpcUrl}`);
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
      
      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Initialize wallet if private key is provided
      const privateKey = this.configService.get<string>('flare.privateKey');
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.logger.log(`Wallet initialized: ${this.wallet.address}`);
        
        // Check wallet balance
        const balance = await this.provider.getBalance(this.wallet.address);
        this.logger.log(`Wallet balance: ${ethers.formatEther(balance)} FLR`);
        
        if (balance === 0n) {
          this.logger.warn('Wallet has zero balance. Blockchain transactions will fail.');
        }
      } else {
        this.logger.warn('No private key configured. Blockchain transactions will be disabled.');
      }
      
      // Initialize contract if address is provided
      if (this.contractAddress && this.wallet) {
        this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);
        this.logger.log(`Smart contract initialized: ${this.contractAddress}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to initialize Flare Network connection: ${error.message}`);
      throw new Error(`Flare Network initialization failed: ${error.message}`);
    }
  }

  /**
   * Submit single audit event to blockchain
   */
  async submitAuditEvent(
    dataHash: string,
    eventType: string,
    metadata: Record<string, any> = {},
  ): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Smart contract not initialized. Check configuration.');
    }

    try {
      this.logger.log(`Submitting audit event to blockchain: ${eventType}`);
      
      const timestamp = Math.floor(Date.now() / 1000);
      const metadataString = JSON.stringify(metadata);
      
      // Estimate gas
      const gasEstimate = await this.contract.logAuditEvent.estimateGas(
        dataHash,
        eventType,
        timestamp,
        metadataString,
      );
      
      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;
      
      // Submit transaction
      const tx = await this.contract.logAuditEvent(
        dataHash,
        eventType,
        timestamp,
        metadataString,
        {
          gasLimit: gasLimit.toString(),
        }
      );

      this.logger.log(`Transaction submitted: ${tx.hash}`);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
        nonce: tx.nonce,
        data: tx.data,
        value: tx.value.toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to submit audit event: ${error.message}`);
      throw new Error(`Blockchain submission failed: ${error.message}`);
    }
  }

  /**
   * Submit batch audit events to blockchain
   */
  async submitBatchAuditEvents(
    hashes: string[],
    merkleRoot: string,
    eventType: string,
  ): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Smart contract not initialized. Check configuration.');
    }

    try {
      this.logger.log(`Submitting batch audit events to blockchain: ${hashes.length} items`);
      
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Estimate gas
      const gasEstimate = await this.contract.logBatchAuditEvent.estimateGas(
        hashes,
        merkleRoot,
        eventType,
        timestamp,
      );
      
      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;
      
      // Submit transaction
      const tx = await this.contract.logBatchAuditEvent(
        hashes,
        merkleRoot,
        eventType,
        timestamp,
        {
          gasLimit: gasLimit.toString(),
        }
      );

      this.logger.log(`Batch transaction submitted: ${tx.hash}`);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
        nonce: tx.nonce,
        data: tx.data,
        value: tx.value.toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to submit batch audit events: ${error.message}`);
      throw new Error(`Batch blockchain submission failed: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt | null> {
    try {
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) return null;

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.index,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice.toString(),
        status: receipt.status,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction receipt: ${error.message}`);
      return null;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    transactionHash: string,
    confirmations: number = 3,
    timeout: number = 300000, // 5 minutes
  ): Promise<TransactionReceipt> {
    try {
      this.logger.log(`Waiting for ${confirmations} confirmations for tx: ${transactionHash}`);
      
      const receipt = await this.provider.waitForTransaction(transactionHash, confirmations, timeout);
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      this.logger.log(`Transaction confirmed: ${transactionHash} (Block: ${receipt.blockNumber})`);
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.index,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice.toString(),
        status: receipt.status,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
        })),
      };
    } catch (error) {
      this.logger.error(`Transaction confirmation failed: ${error.message}`);
      throw new Error(`Confirmation timeout or failure: ${error.message}`);
    }
  }

  /**
   * Verify audit event on blockchain
   */
  async verifyAuditEvent(dataHash: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Smart contract not initialized. Check configuration.');
    }

    try {
      const isVerified = await this.contract.verifyAuditEvent(dataHash);
      this.logger.debug(`Audit event verification for ${dataHash}: ${isVerified}`);
      return isVerified;
    } catch (error) {
      this.logger.error(`Failed to verify audit event: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getCurrentGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice?.toString() || '25000000000'; // 25 gwei default
    } catch (error) {
      this.logger.error(`Failed to get gas price: ${error.message}`);
      return '25000000000'; // Default fallback
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<{
    isConnected: boolean;
    chainId: number;
    blockNumber: number;
    gasPrice: string;
    walletBalance?: string;
    networkName: string;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.getCurrentGasPrice();
      
      let walletBalance: string | undefined;
      if (this.wallet) {
        const balance = await this.provider.getBalance(this.wallet.address);
        walletBalance = ethers.formatEther(balance);
      }

      return {
        isConnected: true,
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice,
        walletBalance,
        networkName: network.name,
      };
    } catch (error) {
      this.logger.error(`Failed to get network status: ${error.message}`);
      return {
        isConnected: false,
        chainId: 0,
        blockNumber: 0,
        gasPrice: '0',
        networkName: 'unknown',
      };
    }
  }

  /**
   * Get transaction count (nonce) for wallet
   */
  async getTransactionCount(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      return await this.provider.getTransactionCount(this.wallet.address, 'pending');
    } catch (error) {
      this.logger.error(`Failed to get transaction count: ${error.message}`);
      throw new Error(`Nonce retrieval failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for audit event submission
   */
  async estimateGasForAuditEvent(
    dataHash: string,
    eventType: string,
    metadata: Record<string, any> = {},
  ): Promise<{
    gasEstimate: string;
    gasPrice: string;
    estimatedCost: string;
  }> {
    if (!this.contract) {
      throw new Error('Smart contract not initialized. Check configuration.');
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const metadataString = JSON.stringify(metadata);
      
      const gasEstimate = await this.contract.logAuditEvent.estimateGas(
        dataHash,
        eventType,
        timestamp,
        metadataString,
      );
      
      const gasPrice = await this.getCurrentGasPrice();
      const estimatedCost = (gasEstimate * BigInt(gasPrice)).toString();

      return {
        gasEstimate: gasEstimate.toString(),
        gasPrice,
        estimatedCost,
      };
    } catch (error) {
      this.logger.error(`Failed to estimate gas: ${error.message}`);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  /**
   * Get network type based on configuration
   */
  getNetworkType(): NetworkType {
    return this.isTestnet ? NetworkType.FLARE_TESTNET : NetworkType.FLARE_MAINNET;
  }

  /**
   * Check if service is ready for blockchain operations
   */
  isReady(): boolean {
    return !!(this.provider && this.wallet && this.contract);
  }

  /**
   * Get service configuration status
   */
  getConfigurationStatus(): {
    hasProvider: boolean;
    hasWallet: boolean;
    hasContract: boolean;
    networkType: NetworkType;
    contractAddress?: string;
    walletAddress?: string;
  } {
    return {
      hasProvider: !!this.provider,
      hasWallet: !!this.wallet,
      hasContract: !!this.contract,
      networkType: this.getNetworkType(),
      contractAddress: this.contractAddress,
      walletAddress: this.wallet?.address,
    };
  }
}
