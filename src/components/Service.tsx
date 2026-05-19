import { useState, useEffect, useMemo } from 'react';
import { FuelLogData, Car, ServiceEntry } from '../types';
import { getUnits } from '../utils/units';

interface Props {
  data: FuelLogData;
  activeCar: Car | null;
  viewCar: Car | null;
  onSaved: (data: FuelLogData) => void;
  onDelete: (id: string) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export default function Service({ data, activeCar, viewCar, onSaved, onDelete, onToast }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const u = getUnits(viewCar ?? undefined);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date,    setDate]    = useState(today);
  const [km,      setKm]      = useState('');
  const [amount,  setAmount]  = useState('');
  const [remarks, setRemarks] = useState('');

  const carId = viewCar?.id ?? '';

  const entries = useMemo(() => {
    const raw = data.service[carId] || [];
    return [...raw].sort((a, b) => (a.date < b.date ? -1 : 1)).reverse();
  }, [data, carId]);

  function resetForm() {
    setEditingId(null);
    setDate(today); setKm(''); setAmount(''); setRemarks('');
  }

  function handleEdit(id: string) {
    const s = entries.find(x => x.id === id);
    if (!s) return;
    setEditingId(id);
    setDate(s.date || '');
    setKm(s.km != null ? String(s.km) : '');
    setAmount(s.amount != null ? String(s.amount) : '');
    setRemarks(s.remarks || '');
  }

  function handleSave() {
    if (!date || !amount) { onToast('⚠ Date and Amount are required', true); return; }
    if (!activeCar)       { onToast('⚠ No active car. Set one in the Cars tab.', true); return; }

    const activeId = activeCar.id;
    const d = { ...data, service: { ...data.service } };
    if (!d.service[activeId]) d.service[activeId] = [];

    const entry: ServiceEntry = {
      id: editingId || 'sv' + Date.now(),
      date,
      km: km ? parseFloat(km) : null,
      amount: parseFloat(amount),
      remarks,
    };

    if (editingId) {
      const idx = d.service[activeId].findIndex(s => s.id === editingId);
      if (idx >= 0) d.service[activeId][idx] = entry;
    } else {
      d.service[activeId] = [...d.service[activeId], entry];
    }

    onSaved(d);
    resetForm();
  }

  useEffect(() => { resetForm(); }, [carId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
      {/* Form */}
      <div className="form-card">
        <div className="form-title">{editingId ? '✏ Edit Service Entry' : '🔧 Add Service Entry'}</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Odometer ({u.distance})</label>
            <input
              type="number" placeholder={u.placeholder_svc_km}
              value={km} onChange={e => setKm(e.target.value)}
            />
          </div>
          <div className="form-group full">
            <label>Amount ({u.currencySymbol})</label>
            <input
              type="number" placeholder="e.g. 3500" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="form-group full">
            <label>Remarks / Work Done</label>
            <textarea
              placeholder="e.g. Oil change, tyre rotation..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave}>Save Service</button>
          <button className="btn-secondary" onClick={resetForm}>Clear</button>
        </div>
      </div>

      {/* Table */}
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
              {entries.length === 0
                ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state"><div className="emoji">🔧</div>No service entries yet</div>
                    </td>
                  </tr>
                )
                : entries.map(s => (
                  <tr key={s.id}>
                    <td>{s.date || '—'}</td>
                    <td>{s.km ? u.fmt(s.km) + ' ' + u.distance : '—'}</td>
                    <td style={{ color: 'var(--purple)' }}>{s.amount ? u.fmtCur(s.amount) : '—'}</td>
                    <td className="remarks-cell" title={s.remarks || ''}>{s.remarks || ''}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" onClick={() => handleEdit(s.id)} title="Edit">✏</button>
                        <button className="btn-icon del" onClick={() => onDelete(s.id)} title="Delete">✕</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
