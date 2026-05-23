import { useState, useMemo } from 'react';
import { FuelLogData, Car } from '../types';
import { getUnits, getEffClass } from '../utils/units';

const PAGE_SIZE = 20;

interface Props {
  data: FuelLogData;
  viewCar: Car | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getPgRange(cur: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4)   return [1, 2, 3, 4, 5, '...', total];
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', cur - 1, cur, cur + 1, '...', total];
}

export default function Entries({ data, viewCar, onEdit, onDelete }: Props) {
  const [search, setSearch]     = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const u     = getUnits(viewCar ?? undefined);
  const carId = viewCar?.id ?? '';

  const allEntries = useMemo(() => {
    const raw = data.entries[carId] || [];
    return [...raw].sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [data, carId]);

  const years = useMemo(() =>
    [...new Set(allEntries.map(e => e.date?.slice(0, 4)).filter(Boolean))].sort(),
    [allEntries]
  );

  const filtered = useMemo(() => {
    let list = [...allEntries].reverse();
    if (search) list = list.filter(e =>
      (e.place || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.date || '').includes(search)
    );
    if (yearFilter) list = list.filter(e => e.date?.startsWith(yearFilter));
    return list;
  }, [allEntries, search, yearFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const safePage   = Math.min(currentPage, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const paged      = filtered.slice(start, start + PAGE_SIZE);

  function handleSearchChange(v: string) { setSearch(v); setCurrentPage(1); }
  function handleYearChange(v: string)   { setYearFilter(v); setCurrentPage(1); }

  function exportCSV() {
    const header = `Date,${u.distLabel},Fuel(${u.fuel}),Price/${u.fuel},Distance(${u.distance}),${u.effLabel},Amount,Place`;
    const rows = allEntries.map(e =>
      [e.date, e.km, e.fuel, e.price, e.total_km, e.mileage, e.amount, `"${e.place || ''}"`].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fuellog_${carId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="section-title">
        All Fuel Entries
        <div className="table-controls">
          <input
            className="search-box"
            placeholder="Search place..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
          <select className="filter-select" value={yearFilter} onChange={e => handleYearChange(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-secondary" onClick={exportCSV} style={{ padding: '6px 12px', fontSize: '.79rem' }}>
            ⬇ CSV
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>{u.distLabel}</th>
              <th>Fuel ({u.fuel})</th>
              <th>{u.currencySymbol}/{u.fuel}</th>
              <th>Distance</th>
              <th>{u.effLabel}</th>
              <th>Amount</th>
              <th>Place</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0
              ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state"><div className="emoji">🔍</div>No entries found</div>
                  </td>
                </tr>
              )
              : paged.map(e => (
                <tr key={e.id}>
                  <td>{e.date || '—'}</td>
                  <td>{u.fmt(e.km)}</td>
                  <td>{e.fuel != null ? u.fmt(e.fuel, 2) : '—'}</td>
                  <td>{e.price > 0 ? u.currencySymbol + u.fmt(e.price, 2) : 'Free'}</td>
                  <td>{e.total_km != null ? u.fmt(e.total_km) + ' ' + u.distance : '—'}</td>
                  <td className={getEffClass(e.mileage, viewCar ?? undefined)}>
                    {e.mileage != null ? u.fmt(e.mileage, 1) + ' ' + u.efficiency : '—'}
                  </td>
                  <td>{e.amount != null ? u.fmtCur(e.amount) : '—'}</td>
                  <td className="place-cell">{e.place || ''}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" onClick={() => onEdit(e.id)} title="Edit">✏</button>
                      <button className="btn-icon del" onClick={() => onDelete(e.id)} title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div className="pagination">
          <span>{filtered.length} entries · {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)}</span>
          <div className="pg-buttons">
            <button className="pg-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={safePage <= 1}>‹</button>
            {getPgRange(safePage, totalPages).map((p, i) =>
              p === '...'
                ? <span key={`dot-${i}`} style={{ padding: '0 3px', color: 'var(--text3)' }}>…</span>
                : <button
                    key={p}
                    className={`pg-btn${p === safePage ? ' active' : ''}`}
                    onClick={() => setCurrentPage(p as number)}
                  >{p}</button>
            )}
            <button className="pg-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={safePage >= totalPages}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
