import { PartialType } from '@nestjs/mapped-types';
import { CreateCalendarReminderDto } from './create-calendar-reminder.dto';

export class UpdateCalendarReminderDto extends PartialType(CreateCalendarReminderDto) {}
