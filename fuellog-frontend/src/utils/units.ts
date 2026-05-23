import { Car, Units } from '../types';

export function getUnits(car: Car | undefined): Units {
  if (car?.country === 'US') {
    return {
      currency: '$', currencySymbol: '$', distance: 'mi', fuel: 'gal',
      efficiency: 'MPG', effLabel: 'MPG', distLabel: 'Miles', fuelLabel: 'Gallons',
      distFull: 'miles driven', fuelFull: 'gallons', effFull: 'miles per gallon',
      costPerDist: 'Cost/mi', placeholder_km: 'e.g. 28450', placeholder_fuel: 'e.g. 12.5',
      placeholder_price: 'e.g. 3.89', placeholder_svc_km: 'e.g. 28450',
      effGood: 35, effAvg: 25,
      fmt: (n, d = 0) =>
        n == null || isNaN(n as number) ? '—'
          : (n as number).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }),
      fmtCur: (n) =>
        n == null || isNaN(n as number) ? '—'
          : '$' + Math.round(n as number).toLocaleString('en-US'),
    };
  }
  return {
    currency: '₹', currencySymbol: '₹', distance: 'km', fuel: 'L',
    efficiency: 'km/L', effLabel: 'Mileage', distLabel: 'KM', fuelLabel: 'Litres',
    distFull: 'kilometres driven', fuelFull: 'litres', effFull: 'km per litre',
    costPerDist: 'Cost/km', placeholder_km: 'e.g. 45320', placeholder_fuel: 'e.g. 28.50',
    placeholder_price: 'e.g. 91.50', placeholder_svc_km: 'e.g. 45320',
    effGood: 22, effAvg: 16,
    fmt: (n, d = 0) =>
      n == null || isNaN(n as number) ? '—'
        : (n as number).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }),
    fmtCur: (n) =>
      n == null || isNaN(n as number) ? '—'
        : '₹' + Math.round(n as number).toLocaleString('en-IN'),
  };
}

export function getEffClass(eff: number | null | undefined, car: Car | undefined): string {
  if (!eff) return '';
  const u = getUnits(car);
  return eff >= u.effGood ? 'eff-good' : eff >= u.effAvg ? 'eff-avg' : 'eff-bad';
}
