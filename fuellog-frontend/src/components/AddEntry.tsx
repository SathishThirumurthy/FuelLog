import { useState, useEffect, useMemo } from 'react';
import { FuelLogData, Car, FuelEntry } from '../types';
import { getUnits } from '../utils/units';

interface Props {
  data: FuelLogData;
  activeCar: Car | null;
  editingId: string | null;
  onSaved: (data: FuelLogData) => void;
  onClearEdit: () => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export default function AddEntry({ data, activeCar, editingId, onSaved, onClearEdit, onToast }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const u = getUnits(activeCar ?? undefined);

  const [date,  setDate]  = useState(today);
  const [km,    setKm]    = useState('');
  const [fuel,  setFuel]  = useState('');
  const [price, setPrice] = useState('');
  const [place, setPlace] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (!editingId) {
      setDate(today); setKm(''); setFuel(''); setPrice(''); setPlace('');
      return;
    }
    // find entry across all cars
    for (const cid of Object.keys(data.entries)) {
      const e = data.entries[cid].find(x => x.id === editingId);
      if (e) {
        setDate(e.date || '');
        setKm(String(e.km || ''));
        setFuel(String(e.fuel || ''));
        setPrice(String(e.price || ''));
        setPlace(e.place || '');
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // All known places for datalist
  const places = useMemo(() => {
    const carId = activeCar?.id ?? '';
    return [...new Set((data.entries[carId] || []).map(e => e.place).filter(Boolean))].sort();
  }, [data, activeCar]);

  function getValidEntries(carId: string) {
    return (data.entries[carId] || []).filter(e => e.km && e.km > 0).sort((a, b) => a.km - b.km);
  }

  function getPrevKm(currentKm: number, forId: string | null, carId: string): number | null {
    const entries = getValidEntries(carId);
    if (!entries.length) return null;
    if (forId) {
      const idx = entries.findIndex(e => e.id === forId);
      return idx > 0 ? entries[idx - 1].km : null;
    }
    if (!currentKm || isNaN(currentKm)) return entries[entries.length - 1].km;
    const prev = [...entries].filter(e => e.km < currentKm).slice(-1)[0];
    return prev ? prev.km : null;
  }

  const kmNum    = parseFloat(km);
  const fuelNum  = parseFloat(fuel);
  const priceNum = parseFloat(price);
  const carId    = activeCar?.id ?? '';
  const prevKm   = isNaN(kmNum) ? null : getPrevKm(kmNum, editingId, carId);
  const dist     = (kmNum && prevKm && kmNum > prevKm) ? kmNum - prevKm : null;
  const eff      = (dist && fuelNum && fuelNum > 0) ? (dist / fuelNum).toFixed(1) : null;
  const amount   = (fuelNum && priceNum && priceNum > 0) ? (fuelNum * priceNum).toFixed(0) : null;

  function handleSave() {
    if (!date || !km || !fuel) {
      onToast('⚠ Date, odometer and fuel are required', true); return;
    }
    if (!activeCar) {
      onToast('⚠ No active car. Set one in the Cars tab.', true); return;
    }
    const d = { ...data, entries: { ...data.entries } };
    if (!d.entries[carId]) d.entries[carId] = [];

    const total_km = (prevKm && kmNum > prevKm) ? kmNum - prevKm : null;
    const mileage  = (total_km && fuelNum && fuelNum > 0) ? +(total_km / fuelNum).toFixed(2) : null;
    const amt      = fuelNum && priceNum ? +(fuelNum * priceNum).toFixed(2) : null;

    const entry: FuelEntry = {
      id: editingId || 'e' + Date.now(),
      date, km: kmNum, fuel: fuelNum, price: priceNum || 0,
      total_km, mileage, amount: amt, place,
    };

    if (editingId) {
      const idx = d.entries[carId].findIndex(e => e.id === editingId);
      if (idx >= 0) d.entries[carId][idx] = entry;
    } else {
      d.entries[carId] = [...d.entries[carId], entry];
    }

    onSaved(d);
    setDate(today); setKm(''); setFuel(''); setPrice(''); setPlace('');
    onClearEdit();
  }

  function handleReset() {
    setDate(today); setKm(''); setFuel(''); setPrice(''); setPlace('');
    onClearEdit();
  }

  const isEditing = !!editingId;

  return (
    <div className="form-card">
      <div className="form-title">{isEditing ? '✏ Edit Entry' : '➕ Add Fuel Entry'}</div>

      <div className="entry-note">
        {activeCar
          ? `⚡ Saving to: ${activeCar.name} ${activeCar.country === 'US' ? '🇺🇸' : '🇮🇳'} — Change active car in the Cars tab`
          : '⚠ No active car. Go to Cars tab to set one.'
        }
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Odometer ({u.distance})</label>
          <input
            type="number" placeholder={u.placeholder_km}
            value={km} onChange={e => setKm(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Fuel ({u.fuel})</label>
          <input
            type="number" placeholder={u.placeholder_fuel} step="0.01"
            value={fuel} onChange={e => setFuel(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Price/{u.fuel} ({u.currencySymbol})</label>
          <input
            type="number" placeholder={u.placeholder_price} step="0.01"
            value={price} onChange={e => setPrice(e.target.value)}
          />
        </div>
        <div className="form-group full">
          <label>Fuel Station / Place</label>
          <input
            type="text" list="placeList"
            value={place} onChange={e => setPlace(e.target.value)}
          />
          <datalist id="placeList">
            {places.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>
      </div>

      <div className="form-preview">
        <div className="preview-item">
          <div className="lbl">Distance ({u.distance})</div>
          <div className="val">{dist ? u.fmt(dist) + ' ' + u.distance : '—'}</div>
        </div>
        <div className="preview-item">
          <div className="lbl">{u.effLabel}</div>
          <div className="val">{eff ? eff + ' ' + u.efficiency : '—'}</div>
        </div>
        <div className="preview-item">
          <div className="lbl">Amount</div>
          <div className="val">{amount ? u.fmtCur(+amount) : '—'}</div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-primary" onClick={handleSave}>Save Entry</button>
        <button className="btn-secondary" onClick={handleReset}>Clear</button>
      </div>
    </div>
  );
}
