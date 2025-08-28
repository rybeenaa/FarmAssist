import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CalendarReminderService } from './calendar-reminder.service';
import { CreateCalendarReminderDto } from './dto/create-calendar-reminder.dto';
import { UpdateCalendarReminderDto } from './dto/update-calendar-reminder.dto';

@Controller('calendar-reminder')
export class CalendarReminderController {
  constructor(private readonly calendarReminderService: CalendarReminderService) {}

  @Post()
  create(@Body() createCalendarReminderDto: CreateCalendarReminderDto) {
    return this.calendarReminderService.create(createCalendarReminderDto);
  }

  @Get()
  findAll() {
    return this.calendarReminderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarReminderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCalendarReminderDto: UpdateCalendarReminderDto) {
    return this.calendarReminderService.update(+id, updateCalendarReminderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarReminderService.remove(+id);
  }
}
