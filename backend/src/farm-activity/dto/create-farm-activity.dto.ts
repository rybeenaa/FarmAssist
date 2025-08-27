export class CreateActivityDto {
  type: string;
  targetType?: string;
  targetId?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
  scheduledAt?: string; // ISO
  occurredAt?: string; // ISO
  notes?: string;
}