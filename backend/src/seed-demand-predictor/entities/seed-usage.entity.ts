import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Entity to track seed usage patterns for demand prediction
 */
@Entity('seed_usage')
@Index(['farmerId', 'season', 'year'])
@Index(['seedVariety', 'region'])
@Index(['season', 'year'])
export class SeedUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  farmerId: number;

  @Column({ length: 100 })
  farmerName: string;

  @Column({ length: 100 })
  seedVariety: string;

  @Column('float')
  quantityUsed: number; // in kg

  @Column('float')
  areaPlanted: number; // in hectares

  @Column({ length: 50 })
  season: string; // 'Spring', 'Summer', 'Fall', 'Winter'

  @Column('int')
  year: number;

  @Column({ length: 100 })
  region: string;

  @Column('float', { nullable: true })
  yield: number; // actual harvest yield in kg/hectare

  @Column('float', { nullable: true })
  seedCostPerKg: number; // cost per kg in local currency

  @Column({ length: 50, nullable: true })
  cropType: string; // 'Cereal', 'Legume', 'Vegetable', etc.

  @Column({ type: 'json', nullable: true })
  weatherConditions: {
    avgTemperature?: number;
    totalRainfall?: number;
    humidity?: number;
  };

  @Column({ type: 'json', nullable: true })
  soilConditions: {
    ph?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
