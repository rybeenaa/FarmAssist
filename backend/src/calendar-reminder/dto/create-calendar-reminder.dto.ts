export class CreateCalendarReminderDto {
  title: string;
  description?: string;
  type: 'planting' | 'harvesting' | 'input-application';
  date: string; // ISO date string
}
