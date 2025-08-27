import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

export interface DeploymentConfig {
  rpcUrl: string;
  privateKey: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  deploymentCost: string;
  abi: any[];
  bytecode: string;
}

export class ContractDeploymentUtil {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(config: DeploymentConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  /**
   * Deploy AuditLogger smart contract to Flare Network
   */
  async deployAuditLoggerContract(): Promise<DeploymentResult> {
    try {
      console.log('🚀 Deploying AuditLogger contract to Flare Network...');
      console.log(`📍 Deployer address: ${this.wallet.address}`);

      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} FLR`);

      if (balance === 0n) {
        throw new Error('Insufficient balance for contract deployment');
      }

      // Get contract artifacts
      const contractArtifacts = this.getContractArtifacts();

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        contractArtifacts.abi,
        contractArtifacts.bytecode,
        this.wallet
      );

      // Estimate deployment gas
      const deploymentData = contractFactory.interface.encodeDeploy([]);
      const gasEstimate = await this.provider.estimateGas({
        data: deploymentData,
      });

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Deploy contract
      const contract = await contractFactory.deploy({
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
      });

      console.log(`📝 Contract deployment transaction: ${contract.deploymentTransaction()?.hash}`);
      console.log('⏳ Waiting for deployment confirmation...');

      // Wait for deployment
      await contract.waitForDeployment();
      const deploymentReceipt = await contract.deploymentTransaction()?.wait();

      if (!deploymentReceipt) {
        throw new Error('Deployment receipt not found');
      }

      const contractAddress = await contract.getAddress();
      const deploymentCost = (deploymentReceipt.gasUsed * deploymentReceipt.gasPrice).toString();

      console.log(`✅ Contract deployed successfully!`);
      console.log(`📍 Contract address: ${contractAddress}`);
      console.log(`🧾 Block number: ${deploymentReceipt.blockNumber}`);
      console.log(`💸 Deployment cost: ${ethers.formatEther(deploymentCost)} FLR`);

      return {
        contractAddress,
        transactionHash: deploymentReceipt.hash,
        blockNumber: deploymentReceipt.blockNumber,
        gasUsed: deploymentReceipt.gasUsed.toString(),
        deploymentCost,
        abi: contractArtifacts.abi,
        bytecode: contractArtifacts.bytecode,
      };
    } catch (error) {
      console.error('❌ Contract deployment failed:', error.message);
      throw new Error(`Contract deployment failed: ${error.message}`);
    }
  }

  /**
   * Verify deployed contract
   */
  async verifyDeployedContract(contractAddress: string): Promise<{
    isDeployed: boolean;
    codeSize: number;
    owner: string;
    isAuthorized: boolean;
    contractStats: {
      totalEvents: number;
      totalBatches: number;
      contractBalance: string;
      isPaused: boolean;
    };
  }> {
    try {
      console.log(`🔍 Verifying contract at: ${contractAddress}`);

      // Check if contract exists
      const code = await this.provider.getCode(contractAddress);
      const isDeployed = code !== '0x';

      if (!isDeployed) {
        return {
          isDeployed: false,
          codeSize: 0,
          owner: '',
          isAuthorized: false,
          contractStats: {
            totalEvents: 0,
            totalBatches: 0,
            contractBalance: '0',
            isPaused: false,
          },
        };
      }

      // Create contract instance
      const contractArtifacts = this.getContractArtifacts();
      const contract = new ethers.Contract(contractAddress, contractArtifacts.abi, this.wallet);

      // Get contract details
      const owner = await contract.owner();
      const isAuthorized = await contract.authorizedSubmitters(this.wallet.address);
      const contractStats = await contract.getContractStats();
      const contractBalance = await this.provider.getBalance(contractAddress);

      console.log(`✅ Contract verification completed`);
      console.log(`👤 Owner: ${owner}`);
      console.log(`🔐 Authorized: ${isAuthorized}`);
      console.log(`📊 Total events: ${contractStats._totalEvents.toString()}`);

      return {
        isDeployed: true,
        codeSize: code.length,
        owner,
        isAuthorized,
        contractStats: {
          totalEvents: Number(contractStats._totalEvents),
          totalBatches: Number(contractStats._totalBatches),
          contractBalance: contractBalance.toString(),
          isPaused: contractStats._isPaused,
        },
      };
    } catch (error) {
      console.error('❌ Contract verification failed:', error.message);
      throw new Error(`Contract verification failed: ${error.message}`);
    }
  }

  /**
   * Setup contract for production use
   */
  async setupContract(contractAddress: string, authorizedAddresses: string[]): Promise<void> {
    try {
      console.log('⚙️ Setting up contract for production use...');

      const contractArtifacts = this.getContractArtifacts();
      const contract = new ethers.Contract(contractAddress, contractArtifacts.abi, this.wallet);

      // Add authorized submitters
      for (const address of authorizedAddresses) {
        console.log(`🔐 Adding authorized submitter: ${address}`);
        
        const tx = await contract.addAuthorizedSubmitter(address);
        await tx.wait();
        
        console.log(`✅ Authorized submitter added: ${address}`);
      }

      console.log('✅ Contract setup completed');
    } catch (error) {
      console.error('❌ Contract setup failed:', error.message);
      throw new Error(`Contract setup failed: ${error.message}`);
    }
  }

  /**
   * Get contract artifacts (ABI and bytecode)
   */
  private getContractArtifacts(): { abi: any[]; bytecode: string } {
    // In a real implementation, you would compile the Solidity contract
    // and load the artifacts from the build output
    
    // For this example, we'll use the ABI from the service and generate minimal bytecode
    const abi = [
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
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "", "type": "address"}],
        "name": "authorizedSubmitters",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "_submitter", "type": "address"}],
        "name": "addAuthorizedSubmitter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getContractStats",
        "outputs": [
          {"name": "_totalEvents", "type": "uint256"},
          {"name": "_totalBatches", "type": "uint256"},
          {"name": "_contractBalance", "type": "uint256"},
          {"name": "_isPaused", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    // This is a placeholder bytecode - in reality, you would compile the Solidity contract
    // and use the actual bytecode from the compilation output
    const bytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556001600160a01b0316600090815260056020526040902080546001600160a01b0319166001179055610000565b"; // Placeholder

    return { abi, bytecode };
  }

  /**
   * Generate deployment script
   */
  generateDeploymentScript(networkType: 'mainnet' | 'testnet'): string {
    const script = `
#!/usr/bin/env node

/**
 * AuditLogger Contract Deployment Script
 * Network: ${networkType}
 * Generated: ${new Date().toISOString()}
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function deployContract() {
  try {
    console.log('🚀 Starting AuditLogger contract deployment...');
    
    // Configuration
    const config = {
      rpcUrl: process.env.${networkType.toUpperCase() === 'MAINNET' ? 'FLARE_MAINNET_RPC' : 'FLARE_TESTNET_RPC'},
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
      gasLimit: process.env.GAS_LIMIT || '500000',
      gasPrice: process.env.GAS_PRICE || '25000000000',
    };

    if (!config.rpcUrl || !config.privateKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log(\`📍 Deployer: \${wallet.address}\`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(\`💰 Balance: \${ethers.formatEther(balance)} FLR\`);
    
    if (balance === 0n) {
      throw new Error('Insufficient balance for deployment');
    }

    // Deploy contract (you would load actual artifacts here)
    console.log('📝 Deploying contract...');
    
    // Contract deployment would happen here
    console.log('✅ Deployment completed!');
    console.log('📋 Save the contract address to your environment variables:');
    console.log('AUDIT_CONTRACT_ADDRESS=<contract_address>');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployContract();
`;

    return script;
  }

  /**
   * Generate environment configuration template
   */
  generateEnvironmentTemplate(): string {
    return `
# Blockchain Audit Logger Configuration
# Copy this to your .env file and fill in the values

# Flare Network Configuration
FLARE_MAINNET_RPC=https://flare-api.flare.network/ext/C/rpc
FLARE_TESTNET_RPC=https://coston2-api.flare.network/ext/C/rpc

# Smart Contract Configuration
AUDIT_CONTRACT_ADDRESS=<your_deployed_contract_address>
BLOCKCHAIN_PRIVATE_KEY=<your_private_key_with_0x_prefix>

# Gas Configuration
GAS_LIMIT=500000
GAS_PRICE=25000000000
MAX_GAS_PRICE=100000000000

# Audit Configuration
ENABLE_BLOCKCHAIN_LOGGING=true
AUDIT_BATCH_SIZE=10
AUDIT_RETRY_ATTEMPTS=3
AUDIT_RETRY_DELAY=5000
HASH_ALGORITHM=sha256
ENABLE_MERKLE_TREE=true

# Monitoring Configuration
ENABLE_BLOCKCHAIN_ALERTS=true
MIN_CONFIRMATIONS=3
ALERT_WEBHOOK_URL=<your_webhook_url>

# Performance Configuration
DB_POOL_SIZE=20
CACHE_TTL=3600
LOG_LEVEL=info
`;
  }
}
