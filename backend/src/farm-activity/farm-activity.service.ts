import { Injectable, Inject } from '@nestjs/common';
import { ActivityRepository } from './repositories/activity.repository';
import { Activity, ActivityType } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-farm-activity.dto';
import { UpdateActivityDto } from './dto/update-farm-activity.dto';

@Injectable()
export class FarmActivityService {
  constructor(@Inject('ActivityRepository') private repo: ActivityRepository) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    if (!Object.values(ActivityType).includes(dto.type as ActivityType)) {
      throw new Error('InvalidActivityType');
    }

    const toCreate: Partial<Activity> = {
      type: dto.type,
      targetType: dto.targetType,
      targetId: dto.targetId,
      performedBy: dto.performedBy,
      metadata: dto.metadata,
      notes: dto.notes,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    };

    const created = await this.repo.create(toCreate);
    return created;
  }

  async get(id: string): Promise<Activity | null> {
    return this.repo.findById(id);
  }

  async list(filter?: any, pagination: { skip?: number; take?: number } = { skip: 0, take: 50 }) {
    return this.repo.list(filter, pagination);
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const patch: Partial<Activity> = {
      ...dto,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    };
    return this.repo.update(id, patch);
  }

  async remove(id: string): Promise<void> {
    return this.repo.softDelete(id);
  }
}
```// filepath: c:\Users\Abdul\Desktop\onlydust\FarmAssist\backend\src\farm-activity\farm-activity.service.ts
import { ActivityRepository } from './repositories/activity.repository';
import { Activity, ActivityType } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-farm-activity.dto';
import { UpdateActivityDto } from './dto/update-farm-activity.dto';

export class FarmActivityService {
  constructor(private repo: ActivityRepository) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    if (!Object.values(ActivityType).includes(dto.type as ActivityType)) {
      throw new Error('InvalidActivityType');
    }

    const toCreate: Partial<Activity> = {
      type: dto.type,
      targetType: dto.targetType,
      targetId: dto.targetId,
      performedBy: dto.performedBy,
      metadata: dto.metadata,
      notes: dto.notes,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    };

    const created = await this.repo.create(toCreate);
    return created;
  }

  async get(id: string): Promise<Activity | null> {
    return this.repo.findById(id);
  }

  async list(filter?: any, pagination: { skip?: number; take?: number } = { skip: 0, take: 50 }) {
    return this.repo.list(filter, pagination);
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const patch: Partial<Activity> = {
      ...dto,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    };
    return this.repo.update(id, patch);
  }

  async remove(id: