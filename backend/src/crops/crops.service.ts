import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Crop } from './entities/crop.entity';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { QueryCropsDto } from './dto/query-crops.dto';

@Injectable()
export class CropsService {
  constructor(
    @InjectRepository(Crop)
    private readonly cropRepository: Repository<Crop>,
  ) {}

  async create(dto: CreateCropDto): Promise<Crop> {
    const entity = this.cropRepository.create(dto);
    return this.cropRepository.save(entity);
  }

  async findAll(query: QueryCropsDto): Promise<{ data: Crop[]; total: number }> {
    const where: any = {};

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }
    if (query.waterRequirement) {
      where.waterRequirement = query.waterRequirement;
    }
    if (query.sunlightRequirement) {
      where.sunlightRequirement = query.sunlightRequirement;
    }

    const [data, total] = await this.cropRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Crop> {
    const found = await this.cropRepository.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Crop not found');
    return found;
  }

  async update(id: string, dto: UpdateCropDto): Promise<Crop> {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    return this.cropRepository.save(existing);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.cropRepository.remove(existing);
  }
}


