import { v4 as uuidv4 } from 'uuid';
import { Planner } from '../entities/planner.entity';
import { PlannerRepository } from './planner.repository';

export class MemoryPlannerRepository implements PlannerRepository {
  private store = new Map<string, Planner>();

  async create(p: Partial<Planner>): Promise<Planner> {
    const id = uuidv4();
    const now = new Date();
    const entity: Planner = { id, name: p.name ?? 'planner', items: p.items ?? [], createdAt: now, updatedAt: now } as Planner;
    this.store.set(id, entity);
    return entity;
  }

  async findById(id: string): Promise<Planner | null> {
    return this.store.get(id) ?? null;
  }

  async list(): Promise<Planner[]> {
    return Array.from(this.store.values());
  }

  async update(id: string, patch: Partial<Planner>): Promise<Planner> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('NotFound');
    const updated = { ...existing, ...patch, updatedAt: new Date() } as Planner;
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
