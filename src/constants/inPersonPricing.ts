export interface PrivateHourPlan {
  hours: number;
  totalBaht: number;
  ratePerHour: number;
}

/** 1-on-1 onsite hour packages — rate per hour decreases with larger plans. */
export const PRIVATE_HOUR_PLANS: PrivateHourPlan[] = [
  { hours: 10, totalBaht: 2900, ratePerHour: 290 },
  { hours: 20, totalBaht: 5700, ratePerHour: 285 },
  { hours: 30, totalBaht: 8500, ratePerHour: 283 },
  { hours: 50, totalBaht: 13800, ratePerHour: 276 },
  { hours: 60, totalBaht: 16200, ratePerHour: 270 },
  { hours: 100, totalBaht: 25000, ratePerHour: 250 },
];
