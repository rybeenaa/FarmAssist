import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SearchSuppliersDto } from './dto/search-suppliers.dto';

export interface SupplierWithDistance extends Supplier {
  distance: number;
}

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    this.logger.log(`Creating new supplier: ${createSupplierDto.name}`);
    const supplier = this.supplierRepository.create(createSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, isActive: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, updateSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    supplier.isActive = false;
    await this.supplierRepository.save(supplier);
  }

  async findNearbySuppliers(
    searchDto: SearchSuppliersDto,
  ): Promise<SupplierWithDistance[]> {
    const {
      product,
      latitude,
      longitude,
      radius = 50,
      limit = 20,
      minRating,
      sortBy = 'distance',
      city,
      state,
    } = searchDto;

    this.logger.log(
      `Searching for suppliers of "${product}" near ${latitude}, ${longitude}`,
    );

    // Build the base query
    let query = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.isActive = :isActive', { isActive: true })
      .andWhere(':product = ANY(supplier.products)', {
        product: product.toLowerCase(),
      });

    // Add rating filter if specified
    if (minRating !== undefined) {
      query = query.andWhere('supplier.rating >= :minRating', { minRating });
    }

    // Add location filters if specified
    if (city) {
      query = query.andWhere('LOWER(supplier.city) = LOWER(:city)', { city });
    }

    if (state) {
      query = query.andWhere('LOWER(supplier.state) = LOWER(:state)', {
        state,
      });
    }

    // Calculate distance using Haversine formula
    query = query
      .addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(supplier.latitude)) * cos(radians(supplier.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(supplier.latitude))))`,
        'distance',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .having('distance <= :radius', { radius })
      .limit(limit);

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query
          .orderBy('supplier.rating', 'DESC')
          .addOrderBy('distance', 'ASC');
        break;
      case 'name':
        query = query.orderBy('supplier.name', 'ASC');
        break;
      default:
        query = query.orderBy('distance', 'ASC');
    }

    const results = await query.getRawAndEntities();

    // Map results to include distance
    return results.entities.map((supplier, index) => ({
      ...supplier,
      distance: parseFloat(results.raw[index].distance.toFixed(2)),
    }));
  }

  async findSuppliersByProduct(product: string): Promise<Supplier[]> {
    this.logger.log(`Finding all suppliers for product: ${product}`);
    return this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.isActive = :isActive', { isActive: true })
      .andWhere(':product = ANY(supplier.products)', {
        product: product.toLowerCase(),
      })
      .orderBy('supplier.rating', 'DESC')
      .getMany();
  }

  async getSuppliersByLocation(
    city: string,
    state?: string,
  ): Promise<Supplier[]> {
    let query = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.isActive = :isActive', { isActive: true })
      .andWhere('LOWER(supplier.city) = LOWER(:city)', { city });

    if (state) {
      query = query.andWhere('LOWER(supplier.state) = LOWER(:state)', {
        state,
      });
    }

    return query.orderBy('supplier.rating', 'DESC').getMany();
  }

  async getTopRatedSuppliers(limit: number = 10): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC', reviewCount: 'DESC' },
      take: limit,
    });
  }

  async updateSupplierRating(
    id: string,
    rating: number,
    reviewCount: number,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    supplier.rating = rating;
    supplier.reviewCount = reviewCount;
    return this.supplierRepository.save(supplier);
  }

  // Utility method to calculate distance between two points
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Seed method to populate initial data (for development/testing)
  async seedSuppliers(): Promise<void> {
    const existingCount = await this.supplierRepository.count();
    if (existingCount > 0) {
      this.logger.log('Suppliers already exist, skipping seed');
      return;
    }

    const seedData: CreateSupplierDto[] = [
      {
        name: 'AgriTech Supplies Nigeria',
        contactPerson: 'John Adebayo',
        email: 'contact@agritech.ng',
        phone: '+2348012345678',
        address: '123 Market Street',
        city: 'Jos',
        state: 'Plateau',
        country: 'Nigeria',
        latitude: 9.8965,
        longitude: 8.8583,
        products: ['fertilizer', 'seeds', 'pesticides'],
        rating: 4.5,
        reviewCount: 45,
        description:
          'Leading supplier of agricultural inputs in North Central Nigeria',
        certifications: ['ISO 9001', 'NAFDAC Approved'],
        yearsInBusiness: 8,
      },
      {
        name: 'Northern Farm Inputs',
        contactPerson: 'Fatima Mohammed',
        email: 'info@northernfarm.ng',
        phone: '+2348087654321',
        address: '456 Agricultural Avenue',
        city: 'Kano',
        state: 'Kano',
        country: 'Nigeria',
        latitude: 12.0022,
        longitude: 8.5919,
        products: ['fertilizer', 'irrigation equipment', 'farm tools'],
        rating: 4.2,
        reviewCount: 32,
        description: 'Comprehensive farm input solutions for Northern Nigeria',
        certifications: ['NAFDAC Approved'],
        yearsInBusiness: 12,
      },
      {
        name: 'Green Valley Seeds Ltd',
        contactPerson: 'Peter Okafor',
        email: 'sales@greenvalley.ng',
        phone: '+2348023456789',
        address: '789 Seeds Boulevard',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
        latitude: 9.0579,
        longitude: 7.4951,
        products: ['seeds', 'seedlings', 'organic fertilizer'],
        rating: 4.8,
        reviewCount: 67,
        description: 'Premium quality seeds and organic farming solutions',
        certifications: ['Organic Certified', 'ISO 14001'],
        yearsInBusiness: 6,
      },
      {
        name: 'Plateau Agro Services',
        contactPerson: 'Mary Danjuma',
        email: 'contact@plateauagro.ng',
        phone: '+2348034567890',
        address: '321 Farm Road',
        city: 'Jos',
        state: 'Plateau',
        country: 'Nigeria',
        latitude: 9.9289,
        longitude: 8.8932,
        products: ['pesticides', 'herbicides', 'fungicides'],
        rating: 4.0,
        reviewCount: 28,
        description: 'Specialized in crop protection products',
        certifications: ['NAFDAC Approved'],
        yearsInBusiness: 15,
      },
    ];

    for (const supplierData of seedData) {
      await this.create(supplierData);
    }

    this.logger.log(`Seeded ${seedData.length} suppliers`);
  }
}
