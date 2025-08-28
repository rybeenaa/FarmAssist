import { Module } from '@nestjs/common';
import { CalendarReminderService } from './calendar-reminder.service';
import { CalendarReminderController } from './calendar-reminder.controller';

@Module({
  controllers: [CalendarReminderController],
  providers: [CalendarReminderService],
})
export class CalendarReminderModule {}
