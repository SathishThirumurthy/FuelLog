import { FuelLogData, Car } from '../types';
import { getUnits } from '../utils/units';

interface Props {
  data: FuelLogData;
  activeCar: Car | null;
  onSetActive: (id: string) => void;
  onNewCar: () => void;
}

export default function Cars({ data, activeCar, onSetActive, onNewCar }: Props) {
  if (!data.cars.length) {
    return (
      <div>
        <div className="empty-state">
          <div className="emoji">🚗</div>No cars yet
        </div>
        <div className="add-car-area" onClick={onNewCar}>
          <div style={{ fontSize: '1.8rem', marginBottom: 7 }}>🚗</div>
          <div style={{ fontWeight: 500, marginBottom: 3 }}>Add a New Car</div>
          <div style={{ fontSize: '.78rem' }}>India (₹, km, L) or USA ($, mi, gal)</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {data.cars.map(car => {
        const u         = getUnits(car);
        const fuelEnts  = (data.entries[car.id] || []).filter(e => e.km > 0).sort((a, b) => a.km - b.km);
        const totalDist = fuelEnts.length > 1 ? fuelEnts[fuelEnts.length - 1].km - fuelEnts[0].km : 0;
        const tFuel     = (data.entries[car.id] || []).reduce((s, e) => s + (e.amount || 0), 0);
        const tSvc      = (data.service?.[car.id] || []).reduce((s, e) => s + (e.amount || 0), 0);
        const isCur     = car.id === activeCar?.id;
        const flag      = car.country === 'US' ? '🇺🇸' : '🇮🇳';
        const countryLabel = car.country === 'US' ? 'USA ($, mi, gal)' : 'India (₹, km, L)';

        return (
          <div key={car.id} className={`car-card${isCur ? ' is-current' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 7 }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '.95rem', fontWeight: 700 }}>
                {flag} {car.name}
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                {isCur && <span className="badge badge-current">✦ ACTIVE</span>}
                <span className={`badge ${car.country === 'US' ? 'badge-us' : 'badge-in'}`}>{countryLabel}</span>
                <span className={`badge ${car.sold ? 'badge-sold' : 'badge-active'}`}>{car.sold ? 'SOLD' : 'OWNED'}</span>
                {!isCur && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 11px', fontSize: '.76rem' }}
                    onClick={() => onSetActive(car.id)}
                  >
                    Set Active
                  </button>
                )}
              </div>
            </div>

            <div className="svc-summary">
              <div className="svc-summary-item">
                <div className="lbl">Purchased</div>
                <div className="val">{car.purchased || '—'}</div>
              </div>
              <div className="svc-summary-item">
                <div className="lbl">Distance</div>
                <div className="val">{u.fmt(totalDist)} {u.distance}</div>
              </div>
              <div className="svc-summary-item">
                <div className="lbl">Fuel Spend</div>
                <div className="val">{u.fmtCur(tFuel)}</div>
              </div>
              <div className="svc-summary-item">
                <div className="lbl">Svc Spend</div>
                <div className="val">{u.fmtCur(tSvc)}</div>
              </div>
              <div className="svc-summary-item">
                <div className="lbl">Total Spend</div>
                <div className="val">{u.fmtCur(tFuel + tSvc)}</div>
              </div>
              <div className="svc-summary-item">
                <div className="lbl">Services</div>
                <div className="val">{(data.service?.[car.id] || []).length}</div>
              </div>
            </div>

            {car.note && <div className="car-note">{car.note}</div>}
          </div>
        );
      })}

      <div className="add-car-area" onClick={onNewCar}>
        <div style={{ fontSize: '1.8rem', marginBottom: 7 }}>🚗</div>
        <div style={{ fontWeight: 500, marginBottom: 3 }}>Add a New Car</div>
        <div style={{ fontSize: '.78rem' }}>India (₹, km, L) or USA ($, mi, gal)</div>
      </div>
    </div>
  );
}
