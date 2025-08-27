import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BlockchainTransaction } from './blockchain-transaction.entity';

export enum AuditEventType {
  PURCHASE_DECISION = 'purchase_decision',
  PAYMENT_TRANSACTION = 'payment_transaction',
  INVENTORY_UPDATE = 'inventory_update',
  PRICE_CHANGE = 'price_change',
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  FARM_CLASSIFICATION = 'farm_classification',
  RECOMMENDATION_GENERATED = 'recommendation_generated',
}

export enum AuditStatus {
  PENDING = 'pending',
  HASHED = 'hashed',
  BLOCKCHAIN_SUBMITTED = 'blockchain_submitted',
  BLOCKCHAIN_CONFIRMED = 'blockchain_confirmed',
  FAILED = 'failed',
  VERIFIED = 'verified',
}

@Entity('audit_logs')
@Index(['eventType', 'status'])
@Index(['createdAt'])
@Index(['dataHash'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditEventType,
  })
  @Index()
  eventType: AuditEventType;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.PENDING,
  })
  @Index()
  status: AuditStatus;

  @Column('text')
  description: string;

  @Column('jsonb')
  originalData: Record<string, any>;

  @Column('text')
  @Index()
  dataHash: string;

  @Column('text', { nullable: true })
  merkleRoot?: string;

  @Column('jsonb', { nullable: true })
  merkleProof?: string[];

  @Column('text', { nullable: true })
  userId?: string;

  @Column('text', { nullable: true })
  entityId?: string; // ID of the entity being audited (e.g., purchase ID, farm ID)

  @Column('text', { nullable: true })
  entityType?: string; // Type of entity (e.g., 'purchase', 'farm', 'user')

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('int', { default: 0 })
  retryCount: number;

  @Column('text', { nullable: true })
  lastError?: string;

  @Column('timestamp', { nullable: true })
  lastRetryAt?: Date;

  @Column('timestamp', { nullable: true })
  blockchainSubmittedAt?: Date;

  @Column('timestamp', { nullable: true })
  blockchainConfirmedAt?: Date;

  @OneToMany(() => BlockchainTransaction, transaction => transaction.auditLog)
  blockchainTransactions: BlockchainTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isBlockchainConfirmed(): boolean {
    return this.status === AuditStatus.BLOCKCHAIN_CONFIRMED || this.status === AuditStatus.VERIFIED;
  }

  get processingTimeMs(): number | null {
    if (!this.blockchainConfirmedAt) return null;
    return this.blockchainConfirmedAt.getTime() - this.createdAt.getTime();
  }

  get hasFailedRetries(): boolean {
    return this.retryCount > 0 && this.status === AuditStatus.FAILED;
  }
}
