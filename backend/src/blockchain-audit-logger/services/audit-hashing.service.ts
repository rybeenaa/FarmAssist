import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MerkleTree } from 'merkletreejs';

export interface HashResult {
  hash: string;
  algorithm: string;
  timestamp: number;
  dataSize: number;
}

export interface MerkleTreeResult {
  root: string;
  proof: string[];
  leaf: string;
  index: number;
  isValid: boolean;
}

export interface DataIntegrityCheck {
  originalHash: string;
  computedHash: string;
  isValid: boolean;
  algorithm: string;
  timestamp: number;
}

@Injectable()
export class AuditHashingService {
  private readonly logger = new Logger(AuditHashingService.name);
  private readonly hashAlgorithm: string;
  private readonly enableMerkleTree: boolean;

  constructor(private readonly configService: ConfigService) {
    this.hashAlgorithm = this.configService.get<string>('audit.hashAlgorithm', 'sha256');
    this.enableMerkleTree = this.configService.get<boolean>('audit.enableMerkleTree', true);
    
    this.logger.log(`Audit Hashing Service initialized with algorithm: ${this.hashAlgorithm}`);
    this.logger.log(`Merkle Tree support: ${this.enableMerkleTree ? 'enabled' : 'disabled'}`);
  }

  /**
   * Hash critical data for blockchain logging
   */
  hashData(data: Record<string, any>): HashResult {
    const startTime = Date.now();
    
    try {
      // Normalize data for consistent hashing
      const normalizedData = this.normalizeData(data);
      const dataString = JSON.stringify(normalizedData);
      const dataBuffer = Buffer.from(dataString, 'utf8');
      
      // Create hash
      const hash = crypto
        .createHash(this.hashAlgorithm)
        .update(dataBuffer)
        .digest('hex');

      const result: HashResult = {
        hash,
        algorithm: this.hashAlgorithm,
        timestamp: Date.now(),
        dataSize: dataBuffer.length,
      };

      this.logger.debug(`Data hashed successfully: ${hash.substring(0, 16)}... (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to hash data: ${error.message}`);
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Hash multiple data items and create Merkle tree
   */
  hashBatchWithMerkleTree(dataItems: Record<string, any>[]): {
    hashes: HashResult[];
    merkleTree: MerkleTreeResult[];
    merkleRoot: string;
  } {
    if (!this.enableMerkleTree) {
      throw new Error('Merkle tree support is disabled');
    }

    const startTime = Date.now();
    
    try {
      // Hash all data items
      const hashes = dataItems.map(data => this.hashData(data));
      const leaves = hashes.map(h => h.hash);

      // Create Merkle tree
      const merkleTree = new MerkleTree(leaves, crypto.createHash('sha256'), {
        hashLeaves: false, // Leaves are already hashed
        sortPairs: true,
      });

      const merkleRoot = merkleTree.getHexRoot();

      // Generate proofs for each leaf
      const merkleResults: MerkleTreeResult[] = leaves.map((leaf, index) => {
        const proof = merkleTree.getHexProof(leaf);
        const isValid = merkleTree.verify(proof, leaf, merkleRoot);

        return {
          root: merkleRoot,
          proof,
          leaf,
          index,
          isValid,
        };
      });

      this.logger.log(`Merkle tree created for ${dataItems.length} items (${Date.now() - startTime}ms)`);
      this.logger.debug(`Merkle root: ${merkleRoot}`);

      return {
        hashes,
        merkleTree: merkleResults,
        merkleRoot,
      };
    } catch (error) {
      this.logger.error(`Failed to create Merkle tree: ${error.message}`);
      throw new Error(`Merkle tree creation failed: ${error.message}`);
    }
  }

  /**
   * Verify data integrity against stored hash
   */
  verifyDataIntegrity(
    originalData: Record<string, any>,
    storedHash: string,
    algorithm?: string,
  ): DataIntegrityCheck {
    const usedAlgorithm = algorithm || this.hashAlgorithm;
    
    try {
      // Compute hash of current data
      const normalizedData = this.normalizeData(originalData);
      const dataString = JSON.stringify(normalizedData);
      const computedHash = crypto
        .createHash(usedAlgorithm)
        .update(dataString, 'utf8')
        .digest('hex');

      const isValid = computedHash === storedHash;

      if (!isValid) {
        this.logger.warn(`Data integrity check failed. Expected: ${storedHash}, Got: ${computedHash}`);
      }

      return {
        originalHash: storedHash,
        computedHash,
        isValid,
        algorithm: usedAlgorithm,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Data integrity verification failed: ${error.message}`);
      throw new Error(`Integrity verification failed: ${error.message}`);
    }
  }

  /**
   * Verify Merkle proof
   */
  verifyMerkleProof(
    leaf: string,
    proof: string[],
    root: string,
  ): boolean {
    try {
      const merkleTree = new MerkleTree([], crypto.createHash('sha256'), {
        hashLeaves: false,
        sortPairs: true,
      });

      return merkleTree.verify(proof, leaf, root);
    } catch (error) {
      this.logger.error(`Merkle proof verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Create audit trail hash for blockchain submission
   */
  createAuditTrailHash(auditLogs: Array<{ id: string; dataHash: string; timestamp: number }>): string {
    try {
      // Create deterministic audit trail
      const sortedLogs = auditLogs.sort((a, b) => a.timestamp - b.timestamp);
      const auditTrail = sortedLogs.map(log => `${log.id}:${log.dataHash}:${log.timestamp}`).join('|');
      
      return crypto
        .createHash('sha256')
        .update(auditTrail, 'utf8')
        .digest('hex');
    } catch (error) {
      this.logger.error(`Failed to create audit trail hash: ${error.message}`);
      throw new Error(`Audit trail hashing failed: ${error.message}`);
    }
  }

  /**
   * Generate secure salt for enhanced hashing
   */
  generateSalt(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data with salt for enhanced security
   */
  hashWithSalt(data: Record<string, any>, salt: string): HashResult {
    try {
      const normalizedData = this.normalizeData(data);
      const dataString = JSON.stringify(normalizedData);
      const saltedData = `${dataString}:${salt}`;
      
      const hash = crypto
        .createHash(this.hashAlgorithm)
        .update(saltedData, 'utf8')
        .digest('hex');

      return {
        hash,
        algorithm: this.hashAlgorithm,
        timestamp: Date.now(),
        dataSize: Buffer.from(saltedData, 'utf8').length,
      };
    } catch (error) {
      this.logger.error(`Failed to hash data with salt: ${error.message}`);
      throw new Error(`Salted hashing failed: ${error.message}`);
    }
  }

  /**
   * Normalize data for consistent hashing
   */
  private normalizeData(data: Record<string, any>): Record<string, any> {
    // Remove undefined values and sort keys for consistent hashing
    const normalized = {};
    
    const sortedKeys = Object.keys(data).sort();
    for (const key of sortedKeys) {
      const value = data[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          normalized[key] = this.normalizeData(value);
        } else if (Array.isArray(value)) {
          normalized[key] = value.map(item => 
            typeof item === 'object' ? this.normalizeData(item) : item
          );
        } else {
          normalized[key] = value;
        }
      }
    }
    
    return normalized;
  }

  /**
   * Get supported hash algorithms
   */
  getSupportedAlgorithms(): string[] {
    return ['sha256', 'sha512', 'sha3-256', 'sha3-512', 'blake2b512'];
  }

  /**
   * Validate hash format
   */
  isValidHash(hash: string, algorithm?: string): boolean {
    const usedAlgorithm = algorithm || this.hashAlgorithm;
    const expectedLength = this.getHashLength(usedAlgorithm);
    
    if (hash.length !== expectedLength) return false;
    
    // Check if hash contains only hexadecimal characters
    return /^[a-fA-F0-9]+$/.test(hash);
  }

  /**
   * Get expected hash length for algorithm
   */
  private getHashLength(algorithm: string): number {
    const lengths = {
      'sha256': 64,
      'sha512': 128,
      'sha3-256': 64,
      'sha3-512': 128,
      'blake2b512': 128,
    };
    
    return lengths[algorithm] || 64;
  }

  /**
   * Create tamper-evident data package
   */
  createTamperEvidentPackage(data: Record<string, any>): {
    data: Record<string, any>;
    hash: string;
    salt: string;
    timestamp: number;
    signature: string;
  } {
    const salt = this.generateSalt();
    const timestamp = Date.now();
    const hashResult = this.hashWithSalt(data, salt);
    
    // Create signature for tamper detection
    const signatureData = `${hashResult.hash}:${timestamp}:${salt}`;
    const signature = crypto
      .createHash('sha256')
      .update(signatureData, 'utf8')
      .digest('hex');

    return {
      data,
      hash: hashResult.hash,
      salt,
      timestamp,
      signature,
    };
  }

  /**
   * Verify tamper-evident package
   */
  verifyTamperEvidentPackage(package: {
    data: Record<string, any>;
    hash: string;
    salt: string;
    timestamp: number;
    signature: string;
  }): boolean {
    try {
      // Verify signature
      const signatureData = `${package.hash}:${package.timestamp}:${package.salt}`;
      const expectedSignature = crypto
        .createHash('sha256')
        .update(signatureData, 'utf8')
        .digest('hex');

      if (expectedSignature !== package.signature) {
        this.logger.warn('Tamper-evident package signature verification failed');
        return false;
      }

      // Verify data hash
      const hashResult = this.hashWithSalt(package.data, package.salt);
      const isHashValid = hashResult.hash === package.hash;

      if (!isHashValid) {
        this.logger.warn('Tamper-evident package data hash verification failed');
      }

      return isHashValid;
    } catch (error) {
      this.logger.error(`Tamper-evident package verification failed: ${error.message}`);
      return false;
    }
  }
}
