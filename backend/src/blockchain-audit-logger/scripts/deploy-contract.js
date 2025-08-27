#!/usr/bin/env node

/**
 * AuditLogger Smart Contract Deployment Script
 * 
 * This script deploys the AuditLogger smart contract to Flare Network
 * and sets up the initial configuration for production use.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract ABI and Bytecode (in production, load from compiled artifacts)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
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
    "inputs": [{"name": "_dataHash", "type": "string"}],
    "name": "verifyAuditEvent",
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
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Simplified bytecode (in production, use actual compiled bytecode)
const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556001600160a01b0316600090815260056020526040902080546001600160a01b0319166001179055610000";

async function main() {
  try {
    console.log('🚀 Starting AuditLogger contract deployment...');
    
    // Get deployment configuration
    const networkType = process.argv[2] || 'testnet';
    const config = getNetworkConfig(networkType);
    
    console.log(`📍 Network: ${config.name}`);
    console.log(`🔗 RPC URL: ${config.rpcUrl}`);
    
    // Validate configuration
    if (!config.privateKey) {
      throw new Error('BLOCKCHAIN_PRIVATE_KEY environment variable is required');
    }
    
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log(`👤 Deployer address: ${wallet.address}`);
    
    // Check network connection
    const network = await provider.getNetwork();
    console.log(`🌐 Connected to: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`💰 Wallet balance: ${balanceEth} FLR`);
    
    if (balance === 0n) {
      throw new Error('Insufficient balance for contract deployment. Please fund your wallet.');
    }
    
    // Estimate deployment cost
    const contractFactory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet);
    const deploymentData = contractFactory.interface.encodeDeploy([]);
    const gasEstimate = await provider.estimateGas({ data: deploymentData });
    const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('25', 'gwei');
    const estimatedCost = gasEstimate * gasPrice;
    
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    console.log(`💸 Estimated cost: ${ethers.formatEther(estimatedCost)} FLR`);
    
    // Confirm deployment
    if (process.env.AUTO_DEPLOY !== 'true') {
      console.log('\n⚠️  Please confirm deployment details above.');
      console.log('Set AUTO_DEPLOY=true to skip this confirmation.');
      return;
    }
    
    // Deploy contract
    console.log('📝 Deploying contract...');
    const contract = await contractFactory.deploy({
      gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
      gasPrice: gasPrice,
    });
    
    console.log(`📋 Deployment transaction: ${contract.deploymentTransaction()?.hash}`);
    console.log('⏳ Waiting for deployment confirmation...');
    
    // Wait for deployment
    await contract.waitForDeployment();
    const deploymentReceipt = await contract.deploymentTransaction()?.wait();
    
    if (!deploymentReceipt) {
      throw new Error('Deployment receipt not found');
    }
    
    const contractAddress = await contract.getAddress();
    const actualCost = deploymentReceipt.gasUsed * deploymentReceipt.gasPrice;
    
    console.log('\n✅ Contract deployed successfully!');
    console.log(`📍 Contract address: ${contractAddress}`);
    console.log(`🧾 Block number: ${deploymentReceipt.blockNumber}`);
    console.log(`💸 Actual cost: ${ethers.formatEther(actualCost)} FLR`);
    console.log(`🔗 Explorer: ${getExplorerUrl(networkType, contractAddress)}`);
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      transactionHash: deploymentReceipt.hash,
      blockNumber: deploymentReceipt.blockNumber,
      gasUsed: deploymentReceipt.gasUsed.toString(),
      deploymentCost: actualCost.toString(),
      network: config.name,
      chainId: config.chainId,
      deployedAt: new Date().toISOString(),
      deployerAddress: wallet.address,
    };
    
    const deploymentFile = path.join(__dirname, `../deployments/${networkType}-deployment.json`);
    fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📄 Deployment info saved to: ${deploymentFile}`);
    
    // Setup initial configuration
    console.log('\n⚙️ Setting up initial configuration...');
    await setupInitialConfiguration(contract, wallet.address);
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Next steps:');
    console.log(`1. Add this to your .env file: AUDIT_CONTRACT_ADDRESS=${contractAddress}`);
    console.log('2. Add authorized submitter addresses using addAuthorizedSubmitter()');
    console.log('3. Test the contract with the verify script');
    console.log('4. Monitor the contract using the monitoring endpoints');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

function getNetworkConfig(networkType) {
  const configs = {
    mainnet: {
      name: 'Flare Mainnet',
      rpcUrl: process.env.FLARE_MAINNET_RPC || 'https://flare-api.flare.network/ext/C/rpc',
      chainId: 14,
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    },
    testnet: {
      name: 'Flare Testnet Coston2',
      rpcUrl: process.env.FLARE_TESTNET_RPC || 'https://coston2-api.flare.network/ext/C/rpc',
      chainId: 114,
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    },
  };
  
  const config = configs[networkType];
  if (!config) {
    throw new Error(`Unknown network type: ${networkType}. Use 'mainnet' or 'testnet'.`);
  }
  
  return config;
}

function getExplorerUrl(networkType, address) {
  const explorers = {
    mainnet: 'https://flare-explorer.flare.network',
    testnet: 'https://coston2-explorer.flare.network',
  };
  
  return `${explorers[networkType]}/address/${address}`;
}

async function setupInitialConfiguration(contract, deployerAddress) {
  try {
    // The deployer is automatically added as an authorized submitter in the constructor
    console.log(`✅ Deployer ${deployerAddress} is automatically authorized`);
    
    // Add any additional authorized submitters from environment
    const additionalSubmitters = process.env.ADDITIONAL_SUBMITTERS?.split(',') || [];
    
    for (const submitter of additionalSubmitters) {
      if (submitter.trim() && ethers.isAddress(submitter.trim())) {
        console.log(`🔐 Adding authorized submitter: ${submitter.trim()}`);
        const tx = await contract.addAuthorizedSubmitter(submitter.trim());
        await tx.wait();
        console.log(`✅ Authorized submitter added: ${submitter.trim()}`);
      }
    }
    
    console.log('✅ Initial configuration completed');
  } catch (error) {
    console.error('⚠️ Initial configuration failed:', error.message);
    console.log('You can manually configure the contract later using the admin functions');
  }
}

// Run deployment
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, getNetworkConfig };
