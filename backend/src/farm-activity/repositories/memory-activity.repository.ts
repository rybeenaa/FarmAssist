import { v4 as uuidv4 } from 'uuid';
import { Activity } from '../entities/activity.entity';
import { ActivityRepository } from './activity.repository';

export class MemoryActivityRepository implements ActivityRepository {
  private store = new Map<string, Activity>();

  async create(a: Partial<Activity>): Promise<Activity> {
    const id = uuidv4();
    const now = new Date();
    const entity: Activity = { id, createdAt: now, updatedAt: now, deletedAt: null, ...a } as Activity;
    this.store.set(id, entity);
    return entity;
  }

  async findById(id: string) {
    return this.store.get(id) ?? null;
  }

  async list(filter = {}, pagination = { skip: 0, take: 50 }) {
    const items = Array.from(this.store.values()).filter(i => !i.deletedAt);
    const total = items.length;
    const paged = items.slice(pagination.skip, pagination.skip + pagination.take);
    return { items: paged, total };
  }

  async update(id: string, patch: Partial<Activity>) {
    const existing = this.store.get(id);
    if (!existing) throw new Error('NotFound');
    const updated = { ...existing, ...patch, updatedAt: new Date() } as Activity;
    this.store.set(id, updated);
    return updated;
  }

  async softDelete(id: string) {
    const existing = this.store.get(id);
    if (!existing) throw new Error('NotFound');
    existing.deletedAt = new Date();
    existing.updatedAt = new Date();
    this.store.set(id, existing);
  }
}