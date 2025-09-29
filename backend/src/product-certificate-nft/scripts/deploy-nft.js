/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers } = require('ethers');

// Minimal ABI for deployment and interaction
const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name_', type: 'string' },
      { internalType: 'string', name: 'symbol_', type: 'string' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
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
];

// NOTE: Replace with compiled bytecode of ProductCertificateNFT.sol
const CONTRACT_BYTECODE = process.env.NFT_CONTRACT_BYTECODE || '0x';

function getConfig() {
  const rpcUrl = process.env.NFT_RPC_URL || process.env.FLARE_TESTNET_RPC || 'http://localhost:8545';
  const privateKey = process.env.NFT_PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY;
  const name = process.env.NFT_NAME || 'ProductCertificate';
  const symbol = process.env.NFT_SYMBOL || 'PCERT';
  if (!privateKey) throw new Error('NFT_PRIVATE_KEY or BLOCKCHAIN_PRIVATE_KEY is required');
  if (!CONTRACT_BYTECODE || CONTRACT_BYTECODE === '0x') throw new Error('NFT_CONTRACT_BYTECODE is required');
  return { rpcUrl, privateKey, name, symbol };
}

async function main() {
  const { rpcUrl, privateKey, name, symbol } = getConfig();
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  if (balance === 0n) throw new Error('Insufficient balance');

  const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet);
  const deployTx = await factory.deploy(name, symbol);
  console.log('Deploying, tx:', deployTx.deploymentTransaction().hash);
  const contract = await deployTx.waitForDeployment();
  const address = await contract.getAddress();
  console.log('NFT deployed at:', address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


