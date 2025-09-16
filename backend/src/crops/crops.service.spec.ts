import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropsService } from './crops.service';
import { Crop, SunlightRequirementLevel, WaterRequirementLevel } from './entities/crop.entity';

describe('CropsService', () => {
  let service: CropsService;
  let repo: Repository<Crop>;

  const repoMock = {
    create: jest.fn((dto) => dto),
    save: jest.fn(async (e) => ({ id: 'uuid', ...e })),
    findAndCount: jest.fn(async () => [[{ id: 'uuid', name: 'Maize' } as any], 1]),
    findOne: jest.fn(async ({ where: { id } }) => (id === 'exists' ? ({ id, name: 'Maize' } as any) : null)),
    remove: jest.fn(async () => undefined),
  } as unknown as Repository<Crop>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CropsService,
        {
          provide: getRepositoryToken(Crop),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(CropsService);
    repo = module.get(getRepositoryToken(Crop));
  });

  it('creates a crop', async () => {
    const created = await service.create({
      name: 'Maize',
      scientificName: 'Zea mays',
      plantingSeasons: ['rainy'],
      growthCycleDays: 120,
      commonDiseases: ['leaf blight'],
      idealSoilTypes: ['loam'],
      waterRequirement: WaterRequirementLevel.MEDIUM,
      sunlightRequirement: SunlightRequirementLevel.FULL_SUN,
      regionSuitability: ['tropics'],
      notes: 'Fast growing',
    });
    expect(created.id).toBeDefined();
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('lists crops', async () => {
    const res = await service.findAll({ limit: 10, offset: 0 });
    expect(res.total).toBe(1);
    expect(res.data.length).toBe(1);
  });

  it('findOne throws for missing', async () => {
    await expect(service.findOne('missing')).rejects.toThrow('Crop not found');
  });

  it('removes existing', async () => {
    await service.remove('exists');
  });
});


