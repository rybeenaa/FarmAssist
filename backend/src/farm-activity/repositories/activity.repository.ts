import { Activity } from '../entities/activity.entity';

export interface ActivityRepository {
  create(a: Partial<Activity>): Promise<Activity>;
  findById(id: string): Promise<Activity | null>;
  list(filter?: any, pagination?: { skip?: number; take?: number }): Promise<{ items: Activity[]; total: number }>;
  update(id: string, patch: Partial<Activity>): Promise<Activity>;
  softDelete(id: string): Promise<void>;
}