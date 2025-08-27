import { Planner } from '../entities/planner.entity';

export interface PlannerRepository {
  create(p: Partial<Planner>): Promise<Planner>;
  findById(id: string): Promise<Planner | null>;
  list(): Promise<Planner[]>;
  update(id: string, patch: Partial<Planner>): Promise<Planner>;
  delete(id: string): Promise<void>;
}
