import { Test, TestingModule } from '@nestjs/testing';
import { FarmsService } from './farms.service';

describe('FarmsService', () => {
  let service: FarmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FarmsService],
    }).compile();

    service = module.get<FarmsService>(FarmsService);
  });

  it('should create a farm', async () => {
    const result = await service.create({ name: 'My Farm', location: 'Lagos' });
    expect(result.name).toBe('My Farm');
  });

  it('should list farms', async () => {
    await service.create({ name: 'Farm 1', location: 'Abuja' });
    const farms = await service.findAll();
    expect(farms.length).toBeGreaterThan(0);
  });
});
