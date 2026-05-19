import { useState } from 'react';

interface Props {
  onAdd: (name: string, country: 'IN' | 'US', purchased: string, reg: string) => void;
  onClose: () => void;
}

export default function NewCarModal({ onAdd, onClose }: Props) {
  const [name, setName]           = useState('');
  const [purchased, setPurchased] = useState('');
  const [reg, setReg]             = useState('');
  const [country, setCountry]     = useState<'IN' | 'US'>('IN');

  function handleAdd() {
    if (!name.trim()) return;
    onAdd(name.trim(), country, purchased, reg.trim());
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">🚗 Add New Car</div>
        <div className="form-grid" style={{ gap: 12 }}>
          <div className="form-group full">
            <label>Country / Units</label>
            <div className="country-toggle">
              <button
                className={`country-btn${country === 'IN' ? ' active' : ''}`}
                onClick={() => setCountry('IN')}
              >
                🇮🇳 India (₹ · km · L · km/L)
              </button>
              <button
                className={`country-btn${country === 'US' ? ' active' : ''}`}
                onClick={() => setCountry('US')}
              >
                🇺🇸 USA ($ · mi · gal · MPG)
              </button>
            </div>
          </div>
          <div className="form-group full">
            <label>Car Name</label>
            <input
              type="text"
              placeholder="e.g. Honda Civic"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Purchase Date</label>
            <input
              type="date"
              value={purchased}
              onChange={e => setPurchased(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Registration No. (optional)</label>
            <input
              type="text"
              placeholder="e.g. KA 01 AB 1234"
              value={reg}
              onChange={e => setReg(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd}>Add Car</button>
        </div>
      </div>
    </div>
  );
}
