// ============================================================
//  FuelLog Frontend — src/components/Service.tsx
//  Updated to save service entries to API
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { FuelLogData, Car, ServiceEntry } from '../types';
import { getUnits }                        from '../utils/units';
import { serviceAPI }                      from '../utils/api';

interface Props {
  data:      FuelLogData;
  activeCar: Car | null;
  viewCar:   Car | null;
  onSaved:   () => Promise<void>;
  onDelete:  (id: string) => void;
  onToast:   (msg: string, isError?: boolean) => void;
}

export default function Service({
  data, activeCar, viewCar, onSaved, onDelete, onToast,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const u     = getUnits(viewCar ?? undefined);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date,      setDate]      = useState(today);
  const [km,        setKm]        = useState('');
  const [amount,    setAmount]    = useState('');
  const [remarks,   setRemarks]   = useState('');
  const [saving,    setSaving]    = useState(false);

  const carId = viewCar?.id ?? '';

  const entries = useMemo(() => {
    const raw = data.service[carId] || [];
    return [...raw].sort((a, b) => (a.date < b.date ? -1 : 1)).reverse();
  }, [data, carId]);

  function resetForm() {
    setEditingId(null);
    setDate(today);
    setKm('');
    setAmount('');
    setRemarks('');
  }

  function handleEdit(id: string) {
    const s = entries.find(x => x.id === id);
    if (!s) return;
    setEditingId(id);
    setDate(s.date     || '');
    setKm(s.km   != null ? String(s.km)     : '');
    setAmount(s.amount != null ? String(s.amount) : '');
    setRemarks(s.remarks || '');
  }

  async function handleSave() {
    if (!date || !amount) {
      onToast('⚠ Date and Amount are required', true);
      return;
    }
    if (!activeCar) {
      onToast('⚠ No active car. Set one in the Cars tab.', true);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // ── Update existing entry ────────────────────────────
        await serviceAPI.update(editingId, {
          date,
          km:      km ? parseFloat(km) : null,
          amount:  parseFloat(amount),
          remarks,
        });
      } else {
        // ── Add new entry ────────────────────────────────────
        await serviceAPI.add({
          car_id:  activeCar.id,
          date,
          km:      km ? parseFloat(km) : null,
          amount:  parseFloat(amount),
          remarks,
        });
      }

      resetForm();
      await onSaved();

    } catch (err: any) {
      onToast(`❌ ${err.message}`, true);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { resetForm(); }, [carId]);

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr',
      gap:                 18,
      alignItems:          'start',
    }}>
      {/* ── Form ─────────────────────────────────────────── */}
      <div className="form-card">
        <div className="form-title">
          {editingId ? '✏ Edit Service Entry' : '🔧 Add Service Entry'}
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group">
            <label>Odometer ({u.distance})</label>
            <input
              type="number"
              placeholder={u.placeholder_svc_km}
              value={km}
              onChange={e => setKm(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group full">
            <label>Amount ({u.currencySymbol})</label>
            <input
              type="number"
              placeholder="e.g. 3500"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group full">
            <label>Remarks / Work Done</label>
            <textarea
              placeholder="e.g. Oil change, tyre rotation..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Service'}
          </button>
          <button
            className="btn-secondary"
            onClick={resetForm}
            disabled={saving}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div>
        <div className="section-title">Service History</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>{u.distLabel}</th>
                <th>Amount</th>
                <th>Remarks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="emoji">🔧</div>
                      No service entries yet
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map(s => (
                  <tr key={s.id}>
                    <td>{s.date || '—'}</td>
                    <td>
                      {s.km
                        ? u.fmt(s.km) + ' ' + u.distance
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--purple)' }}>
                      {s.amount ? u.fmtCur(s.amount) : '—'}
                    </td>
                    <td
                      className="remarks-cell"
                      title={s.remarks || ''}
                    >
                      {s.remarks || ''}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEdit(s.id)}
                          title="Edit"
                        >
                          ✏
                        </button>
                        <button
                          className="btn-icon del"
                          onClick={() => onDelete(s.id)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
