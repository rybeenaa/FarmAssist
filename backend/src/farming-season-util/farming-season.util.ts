import { Region, FarmingSeason } from './types';

/**
 * Determines the current farming season based on region latitude and date.
 * @param region Region object with latitude
 * @param date Optional JS Date (defaults to now)
 * @returns FarmingSeason enum value
 */
export function getCurrentFarmingSeason(region: Region, date: Date = new Date()): FarmingSeason {
  const month = date.getUTCMonth() + 1; // JS months are 0-based
  const isNorthernHemisphere = region.latitude >= 0;

  if (isNorthernHemisphere) {
    if (month >= 3 && month <= 5) return FarmingSeason.SPRING;
    if (month >= 6 && month <= 8) return FarmingSeason.SUMMER;
    if (month >= 9 && month <= 11) return FarmingSeason.FALL;
    return FarmingSeason.WINTER;
  } else {
    // Southern Hemisphere: seasons are reversed
    if (month >= 3 && month <= 5) return FarmingSeason.FALL;
    if (month >= 6 && month <= 8) return FarmingSeason.WINTER;
    if (month >= 9 && month <= 11) return FarmingSeason.SPRING;
    return FarmingSeason.SUMMER;
  }
}
