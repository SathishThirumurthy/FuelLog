import { FuelLogData } from '../types';

export const STORAGE_KEY = 'fuellog_data_v4';
export const THEME_KEY   = 'fuellog_theme';
export const AUTH_KEY    = 'fl_auth';

export function loadData(): FuelLogData {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) return JSON.parse(r);
  } catch (_) {}
  return { cars: [], entries: {}, service: {} };
}

export function saveData(d: FuelLogData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}
