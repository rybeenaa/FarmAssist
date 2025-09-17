import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum WaterRequirementLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum SunlightRequirementLevel {
  PARTIAL_SHADE = 'PARTIAL_SHADE',
  FULL_SUN = 'FULL_SUN',
}

@Entity({ name: 'crops' })
export class Crop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  scientificName: string;

  @Column('text', { array: true, default: '{}' })
  plantingSeasons: string[];

  @Column({ type: 'int' })
  growthCycleDays: number;

  @Column('text', { array: true, default: '{}' })
  commonDiseases: string[];

  @Column('text', { array: true, default: '{}' })
  idealSoilTypes: string[];

  @Column({ type: 'enum', enum: WaterRequirementLevel })
  waterRequirement: WaterRequirementLevel;

  @Column({ type: 'enum', enum: SunlightRequirementLevel })
  sunlightRequirement: SunlightRequirementLevel;

  @Column('text', { array: true, default: '{}' })
  regionSuitability: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


