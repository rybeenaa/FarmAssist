export interface Region {
  name: string;
  latitude: number;
  longitude: number;
}

export enum FarmingSeason {
  SPRING = 'Spring',
  SUMMER = 'Summer',
  FALL = 'Fall',
  WINTER = 'Winter',
  UNKNOWN = 'Unknown',
}
