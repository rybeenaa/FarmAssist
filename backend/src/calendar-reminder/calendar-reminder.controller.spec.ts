import { Test, TestingModule } from '@nestjs/testing';
import { CalendarReminderController } from './calendar-reminder.controller';
import { CalendarReminderService } from './calendar-reminder.service';
import { CreateCalendarReminderDto } from './dto/create-calendar-reminder.dto';

const mockReminder = {
  id: 1,
  title: 'Plant Maize',
  description: 'Plant maize in field A',
  type: 'planting',
  date: '2025-09-01',
};

const mockService = {
  create: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
  findAll: jest.fn().mockReturnValue([mockReminder]),
  findOne: jest.fn().mockReturnValue(mockReminder),
  update: jest.fn().mockImplementation((id, dto) => ({ ...mockReminder, ...dto })),
  remove: jest.fn().mockReturnValue(true),
};

describe('CalendarReminderController', () => {
  let controller: CalendarReminderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarReminderController],
      providers: [
        { provide: CalendarReminderService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<CalendarReminderController>(CalendarReminderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a reminder', () => {
    const dto: CreateCalendarReminderDto = {
      title: 'Plant Maize',
      description: 'Plant maize in field A',
      type: 'planting',
      date: '2025-09-01',
    };
    expect(controller.create(dto)).toEqual({ id: 1, ...dto });
  });

  it('should return all reminders', () => {
    expect(controller.findAll()).toEqual([mockReminder]);
  });

  it('should return a single reminder', () => {
    expect(controller.findOne('1')).toEqual(mockReminder);
  });

  it('should update a reminder', () => {
    expect(controller.update('1', { title: 'Harvest Maize' })).toEqual({ ...mockReminder, title: 'Harvest Maize' });
  });

  it('should remove a reminder', () => {
    expect(controller.remove('1')).toBe(true);
  });
});
