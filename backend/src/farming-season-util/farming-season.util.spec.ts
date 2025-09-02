import { getCurrentFarmingSeason } from './farming-season.util';
import { Region, FarmingSeason } from './types';

describe('getCurrentFarmingSeason', () => {
  const northernRegion: Region = { name: 'Germany', latitude: 51, longitude: 10 };
  const southernRegion: Region = { name: 'Australia', latitude: -25, longitude: 133 };

  it('should return SPRING for northern hemisphere in April', () => {
    const date = new Date('2025-04-15');
    expect(getCurrentFarmingSeason(northernRegion, date)).toBe(FarmingSeason.SPRING);
  });

  it('should return SUMMER for northern hemisphere in July', () => {
    const date = new Date('2025-07-10');
    expect(getCurrentFarmingSeason(northernRegion, date)).toBe(FarmingSeason.SUMMER);
  });

  it('should return FALL for northern hemisphere in October', () => {
    const date = new Date('2025-10-01');
    expect(getCurrentFarmingSeason(northernRegion, date)).toBe(FarmingSeason.FALL);
  });

  it('should return WINTER for northern hemisphere in January', () => {
    const date = new Date('2025-01-20');
    expect(getCurrentFarmingSeason(northernRegion, date)).toBe(FarmingSeason.WINTER);
  });

  it('should return FALL for southern hemisphere in April', () => {
    const date = new Date('2025-04-15');
    expect(getCurrentFarmingSeason(southernRegion, date)).toBe(FarmingSeason.FALL);
  });

  it('should return WINTER for southern hemisphere in July', () => {
    const date = new Date('2025-07-10');
    expect(getCurrentFarmingSeason(southernRegion, date)).toBe(FarmingSeason.WINTER);
  });

  it('should return SPRING for southern hemisphere in October', () => {
    const date = new Date('2025-10-01');
    expect(getCurrentFarmingSeason(southernRegion, date)).toBe(FarmingSeason.SPRING);
  });

  it('should return SUMMER for southern hemisphere in January', () => {
    const date = new Date('2025-01-20');
    expect(getCurrentFarmingSeason(southernRegion, date)).toBe(FarmingSeason.SUMMER);
  });
});
