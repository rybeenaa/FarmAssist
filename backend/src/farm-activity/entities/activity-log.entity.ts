import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ActivityLogAction = 'created' | 'updated' | 'deleted' | 'performed';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  activityId: string;

  @Column({ type: 'varchar', length: 50 })
  action: ActivityLogAction;

  @Column({ type: 'varchar', length: 100, nullable: true })
  performedBy?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}