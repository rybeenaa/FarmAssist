import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RecommendationType {
  FERTILIZER = 'fertilizer',
  SEED = 'seed',
  FARM_INPUT = 'farm_input',
  ADVISORY = 'advisory',
  CROP_SUGGESTION = 'crop_suggestion',
  PEST_CONTROL = 'pest_control',
  WEATHER_ADVISORY = 'weather_advisory',
}

export enum RecommendationOutcome {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
  PARTIALLY_IMPLEMENTED = 'partially_implemented',
  EXPIRED = 'expired',
}

@Entity('recommendation_logs')
@Index(['userId', 'createdAt'])
@Index(['recommendationType', 'createdAt'])
export class RecommendationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  farmId: string;

  @Column({
    type: 'enum',
    enum: RecommendationType,
  })
  recommendationType: RecommendationType;

  @Column({ type: 'text' })
  recommendationContent: string;

  @Column({ type: 'jsonb', nullable: true })
  recommendationData: any; // Structured data of the recommendation

  @Column({ type: 'jsonb', nullable: true })
  inputParameters: any; // Parameters used to generate the recommendation

  @Column({
    type: 'enum',
    enum: RecommendationOutcome,
    default: RecommendationOutcome.PENDING,
  })
  outcome: RecommendationOutcome;

  @Column({ type: 'text', nullable: true })
  outcomeNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  outcomeUpdatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceService: string; // Which service generated the recommendation

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceEndpoint: string; // Which endpoint was called

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional context data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}