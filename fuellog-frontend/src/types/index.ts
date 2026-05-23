export interface Car {
  id: string;
  name: string;
  purchased?: string;
  sold?: string;
  note?: string;
  country: 'IN' | 'US';
  active?: boolean;
  reg?: string;
}

export interface FuelEntry {
  id: string;
  date: string;
  km: number;
  fuel: number;
  price: number;
  total_km: number | null;
  mileage: number | null;
  amount: number | null;
  place: string;
}

export interface ServiceEntry {
  id: string;
  date: string;
  km: number | null;
  amount: number | null;
  remarks: string;
}

export interface FuelLogData {
  cars: Car[];
  entries: Record<string, FuelEntry[]>;
  service: Record<string, ServiceEntry[]>;
}

export type Theme = 'dark' | 'light' | 'ocean' | 'forest' | 'sunset';
export type Page = 'dashboard' | 'entries' | 'addEntry' | 'service' | 'reports' | 'cars';

export interface Units {
  currency: string;
  currencySymbol: string;
  distance: string;
  fuel: string;
  efficiency: string;
  effLabel: string;
  distLabel: string;
  fuelLabel: string;
  distFull: string;
  fuelFull: string;
  effFull: string;
  costPerDist: string;
  placeholder_km: string;
  placeholder_fuel: string;
  placeholder_price: string;
  placeholder_svc_km: string;
  effGood: number;
  effAvg: number;
  fmt: (n: number | null | undefined, d?: number) => string;
  fmtCur: (n: number | null | undefined) => string;
}

export interface ToastState {
  msg: string;
  isError: boolean;
  show: boolean;
}
