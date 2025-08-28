import { Injectable } from '@nestjs/common';
import { CreateCalendarReminderDto } from './dto/create-calendar-reminder.dto';
import { UpdateCalendarReminderDto } from './dto/update-calendar-reminder.dto';
import { CalendarReminder } from './entities/calendar-reminder.entity';

@Injectable()
export class CalendarReminderService {
  private reminders: CalendarReminder[] = [];
  private idCounter = 1;

  create(createDto: CreateCalendarReminderDto): CalendarReminder {
    const reminder: CalendarReminder = {
      id: this.idCounter++,
      ...createDto,
    };
    this.reminders.push(reminder);
    return reminder;
  }

  findAll(): CalendarReminder[] {
    return this.reminders;
  }

  findOne(id: number): CalendarReminder {
    return this.reminders.find(r => r.id === id);
  }

  update(id: number, updateDto: UpdateCalendarReminderDto): CalendarReminder {
    const reminder = this.findOne(id);
    if (reminder) {
      Object.assign(reminder, updateDto);
    }
    return reminder;
  }

  remove(id: number): boolean {
    const index = this.reminders.findIndex(r => r.id === id);
    if (index > -1) {
      this.reminders.splice(index, 1);
      return true;
    }
    return false;
  }
}
