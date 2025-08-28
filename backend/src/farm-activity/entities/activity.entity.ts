import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ActivityType {
  PLANTING = 'planting',
  WATERING = 'watering',
  FEEDING = 'feeding',
  HARVEST = 'harvest',
  FERTILIZING = 'fertilizing',
  OTHER = 'other',
}

@Entity('farm_activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: ActivityType | string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  targetId?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  performedBy?: string | null;

  // flexible additional data
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  occurredAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // soft-delete timestamp (nullable)
  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}