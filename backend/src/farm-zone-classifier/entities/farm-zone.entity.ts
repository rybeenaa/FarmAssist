import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FarmProfile } from '../../farm-profile/farm-profile.entity';

export enum ProductivityZone {
  HIGH_YIELD = 'high-yield',
  MODERATE_YIELD = 'moderate-yield',
  LOW_YIELD = 'low-yield'
}

@Entity('farm_zones')
export class FarmZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FarmProfile, { eager: true })
  farmProfile: FarmProfile;

  @Column({
    type: 'enum',
    enum: ProductivityZone,
    default: ProductivityZone.MODERATE_YIELD
  })
  zoneType: ProductivityZone;

  @Column('jsonb')
  historicalData: {
    yields: number[];
    seasons: string[];
    soilQualityScores: number[];
    moistureLevels: number[];
  };

  @Column('float')
  averageYield: number;

  @Column('float')
  productivityScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}