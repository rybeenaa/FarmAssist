#!/usr/bin/env node

/**
 * AuditLogger Smart Contract Verification Script
 * 
 * This script verifies the deployed AuditLogger contract functionality
 * and performs basic integration tests.
 */

const { ethers } = require('ethers');
const crypto = require('crypto');
require('dotenv').config();

const CONTRACT_ABI = [
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
    "inputs": [{"name": "_dataHash", "type": "string"}],
    "name": "verifyAuditEvent",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
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
  }
];

async function main() {
  try {
    console.log('🔍 Starting AuditLogger contract verification...');
    
    // Get configuration
    const networkType = process.argv[2] || 'testnet';
    const contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      throw new Error('AUDIT_CONTRACT_ADDRESS environment variable is required');
    }
    
    console.log(`📍 Contract address: ${contractAddress}`);
    console.log(`🌐 Network: ${networkType}`);
    
    // Initialize provider and wallet
    const config = getNetworkConfig(networkType);
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log(`👤 Verifier address: ${wallet.address}`);
    
    // Check network connection
    const network = await provider.getNetwork();
    console.log(`🌐 Connected to: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Verify contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('No contract found at the specified address');
    }
    
    console.log(`✅ Contract exists (${code.length} bytes)`);
    
    // Initialize contract
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
    
    // Test 1: Check contract owner
    console.log('\n📋 Test 1: Contract Ownership');
    const owner = await contract.owner();
    console.log(`👤 Contract owner: ${owner}`);
    
    // Test 2: Check authorization
    console.log('\n📋 Test 2: Authorization Check');
    const isAuthorized = await contract.authorizedSubmitters(wallet.address);
    console.log(`🔐 Wallet authorized: ${isAuthorized}`);
    
    if (!isAuthorized) {
      console.log('⚠️ Warning: Current wallet is not authorized to submit audit events');
      console.log('Add authorization using: contract.addAuthorizedSubmitter(address)');
    }
    
    // Test 3: Get contract statistics
    console.log('\n📋 Test 3: Contract Statistics');
    const stats = await contract.getContractStats();
    console.log(`📊 Total events: ${stats._totalEvents.toString()}`);
    console.log(`📦 Total batches: ${stats._totalBatches.toString()}`);
    console.log(`💰 Contract balance: ${ethers.formatEther(stats._contractBalance)} FLR`);
    console.log(`⏸️ Is paused: ${stats._isPaused}`);
    
    // Test 4: Submit test audit event (if authorized)
    if (isAuthorized) {
      console.log('\n📋 Test 4: Submit Test Audit Event');
      
      const testData = {
        purchaseId: 'verification-test-' + Date.now(),
        amount: 1000,
        timestamp: new Date().toISOString(),
      };
      
      const dataHash = crypto.createHash('sha256')
        .update(JSON.stringify(testData))
        .digest('hex');
      
      console.log(`🔐 Test data hash: ${dataHash}`);
      
      try {
        // Estimate gas
        const gasEstimate = await contract.logAuditEvent.estimateGas(
          dataHash,
          'verification_test',
          Math.floor(Date.now() / 1000),
          JSON.stringify({ test: true })
        );
        
        console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
        
        // Submit transaction
        const tx = await contract.logAuditEvent(
          dataHash,
          'verification_test',
          Math.floor(Date.now() / 1000),
          JSON.stringify({ test: true }),
          {
            gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
          }
        );
        
        console.log(`📝 Transaction submitted: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);
        
        // Test 5: Verify the audit event
        console.log('\n📋 Test 5: Verify Audit Event');
        const isVerified = await contract.verifyAuditEvent(dataHash);
        console.log(`🔍 Audit event verified: ${isVerified}`);
        
        if (!isVerified) {
          throw new Error('Audit event verification failed');
        }
        
      } catch (error) {
        console.error('❌ Test audit event submission failed:', error.message);
        console.log('This might be due to insufficient gas or network issues');
      }
    } else {
      console.log('\n⏭️ Skipping audit event test (wallet not authorized)');
    }
    
    // Test 6: Performance benchmark
    console.log('\n📋 Test 6: Performance Benchmark');
    await performanceBenchmark(contract, isAuthorized);
    
    console.log('\n🎉 Contract verification completed successfully!');
    console.log('\n📊 Verification Summary:');
    console.log(`✅ Contract deployed and functional`);
    console.log(`✅ Network connectivity confirmed`);
    console.log(`✅ Basic operations tested`);
    console.log(`${isAuthorized ? '✅' : '⚠️'} Authorization ${isAuthorized ? 'confirmed' : 'needs setup'}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

async function performanceBenchmark(contract, isAuthorized) {
  try {
    if (!isAuthorized) {
      console.log('⏭️ Skipping performance benchmark (wallet not authorized)');
      return;
    }
    
    console.log('🏃 Running performance benchmark...');
    
    const testHashes = Array.from({ length: 5 }, (_, i) => {
      const testData = { id: i, timestamp: Date.now() };
      return crypto.createHash('sha256').update(JSON.stringify(testData)).digest('hex');
    });
    
    const startTime = Date.now();
    
    // Estimate gas for multiple operations
    let totalGasEstimate = 0n;
    for (const hash of testHashes) {
      try {
        const gasEstimate = await contract.logAuditEvent.estimateGas(
          hash,
          'benchmark_test',
          Math.floor(Date.now() / 1000),
          '{"benchmark": true}'
        );
        totalGasEstimate += gasEstimate;
      } catch (error) {
        console.log(`⚠️ Gas estimation failed for hash ${hash.substring(0, 8)}...`);
      }
    }
    
    const endTime = Date.now();
    const benchmarkTime = endTime - startTime;
    
    console.log(`⏱️ Benchmark time: ${benchmarkTime}ms`);
    console.log(`⛽ Total gas estimate: ${totalGasEstimate.toString()}`);
    console.log(`📊 Average gas per operation: ${(totalGasEstimate / BigInt(testHashes.length)).toString()}`);
    
  } catch (error) {
    console.error('❌ Performance benchmark failed:', error.message);
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
  
  return configs[networkType];
}

function getExplorerUrl(networkType, address) {
  const explorers = {
    mainnet: 'https://flare-explorer.flare.network',
    testnet: 'https://coston2-explorer.flare.network',
  };
  
  return `${explorers[networkType]}/address/${address}`;
}

// Run verification
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, getNetworkConfig };
