import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum RegistrationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SupplierType {
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  WHOLESALER = 'wholesaler',
  COOPERATIVE = 'cooperative',
}

@Entity('suppliers')
@Index(['verificationStatus', 'isActive'])
@Index(['registrationStatus'])
@Index(['supplierType'])
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  contactPerson: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('text', { array: true })
  products: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column('decimal', { precision: 2, scale: 1, nullable: true })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  certifications: string[];

  @Column({ nullable: true })
  yearsInBusiness: number;

  // New registration and verification fields
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.DRAFT,
  })
  registrationStatus: RegistrationStatus;

  @Column({
    type: 'enum',
    enum: SupplierType,
  })
  supplierType: SupplierType;

  @Column({ nullable: true })
  businessRegistrationNumber: string;

  @Column({ nullable: true })
  taxIdentificationNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column('text', { array: true, nullable: true })
  documents: string[]; // URLs to uploaded documents

  @Column({ nullable: true })
  verifiedBy: string; // Admin user ID who verified

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column('jsonb', { nullable: true })
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    routingNumber?: string;
  };

  @Column('jsonb', { nullable: true })
  businessHours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };

  @Column('text', { array: true, nullable: true })
  serviceAreas: string[]; // Cities/regions they serve

  @Column({ nullable: true })
  minimumOrderValue: number;

  @Column({ nullable: true })
  deliveryRadius: number; // in kilometers

  @Column({ default: false })
  offersDelivery: boolean;

  @Column({ default: false })
  acceptsOnlinePayments: boolean;

  @Column('text', { array: true, nullable: true })
  paymentMethods: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;
}
