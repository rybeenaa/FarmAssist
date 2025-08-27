import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { AuditLog } from './audit-log.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REVERTED = 'reverted',
}

export enum NetworkType {
  FLARE_MAINNET = 'flare_mainnet',
  FLARE_TESTNET = 'flare_testnet',
}

@Entity('blockchain_transactions')
@Index(['transactionHash'])
@Index(['status'])
@Index(['networkType'])
@Index(['createdAt'])
export class BlockchainTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AuditLog, auditLog => auditLog.blockchainTransactions)
  auditLog: AuditLog;

  @Column('text')
  @Index()
  transactionHash: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: NetworkType,
  })
  networkType: NetworkType;

  @Column('text')
  fromAddress: string;

  @Column('text')
  toAddress: string; // Smart contract address

  @Column('text')
  gasLimit: string;

  @Column('text')
  gasPrice: string;

  @Column('text', { nullable: true })
  gasUsed?: string;

  @Column('text', { nullable: true })
  effectiveGasPrice?: string;

  @Column('bigint', { nullable: true })
  blockNumber?: number;

  @Column('text', { nullable: true })
  blockHash?: string;

  @Column('int', { nullable: true })
  transactionIndex?: number;

  @Column('int', { default: 0 })
  confirmations: number;

  @Column('text', { nullable: true })
  contractMethod?: string;

  @Column('jsonb', { nullable: true })
  contractInputs?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  logs?: Array<{
    address: string;
    topics: string[];
    data: string;
  }>;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column('text', { nullable: true })
  revertReason?: string;

  @Column('timestamp', { nullable: true })
  submittedAt?: Date;

  @Column('timestamp', { nullable: true })
  confirmedAt?: Date;

  @Column('timestamp', { nullable: true })
  failedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isConfirmed(): boolean {
    return this.status === TransactionStatus.CONFIRMED;
  }

  get isFailed(): boolean {
    return this.status === TransactionStatus.FAILED || this.status === TransactionStatus.REVERTED;
  }

  get processingTimeMs(): number | null {
    if (!this.confirmedAt || !this.submittedAt) return null;
    return this.confirmedAt.getTime() - this.submittedAt.getTime();
  }

  get totalGasCost(): string | null {
    if (!this.gasUsed || !this.effectiveGasPrice) return null;
    return (BigInt(this.gasUsed) * BigInt(this.effectiveGasPrice)).toString();
  }

  get explorerUrl(): string {
    const baseUrl = this.networkType === NetworkType.FLARE_MAINNET
      ? 'https://flare-explorer.flare.network'
      : 'https://coston2-explorer.flare.network';
    return `${baseUrl}/tx/${this.transactionHash}`;
  }
}
