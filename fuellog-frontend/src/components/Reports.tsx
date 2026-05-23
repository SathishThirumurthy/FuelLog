import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { FuelLogData, Car, Theme } from '../types';
import { getUnits, getEffClass } from '../utils/units';

interface Props {
  data: FuelLogData;
  viewCar: Car | null;
  theme: Theme;
}

function getGridColor(theme: Theme) {
  const map: Record<Theme, string> = {
    dark: 'rgba(255,255,255,0.04)', light: 'rgba(0,0,0,0.06)',
    ocean: 'rgba(56,189,248,0.06)', forest: 'rgba(74,222,128,0.06)',
    sunset: 'rgba(251,146,60,0.06)',
  };
  return map[theme];
}

export default function Reports({ data, viewCar, theme }: Props) {
  const u     = getUnits(viewCar ?? undefined);
  const carId = viewCar?.id ?? '';

  const entries = useMemo(() => {
    const raw = (data.entries[carId] || []).filter(e => e.km && e.km > 0);
    return [...raw].sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [data, carId]);

  const svc = useMemo(() => {
    return (data.service[carId] || []).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [data, carId]);

  const { byYear, years, yearDist, yearSpend, svcByYear } = useMemo(() => {
    const byYear: Record<string, typeof entries> = {};
    entries.forEach(e => {
      const y = e.date?.slice(0, 4);
      if (!y) return;
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(e);
    });
    const years = Object.keys(byYear).sort();

    const yearDist: Record<string, number> = {};
    years.forEach(y => {
      const ye = byYear[y];
      const kms = ye.map(e => e.km).filter(k => k > 0).sort((a, b) => a - b);
      yearDist[y] = kms.length > 1
        ? kms[kms.length - 1] - kms[0]
        : ye.reduce((s, e) => s + (e.total_km || 0), 0);
    });

    const yearSpend: Record<string, number> = {};
    years.forEach(y => { yearSpend[y] = byYear[y].reduce((s, e) => s + (e.amount || 0), 0); });

    const svcByYear: Record<string, number> = {};
    svc.forEach(e => {
      const y = e.date?.slice(0, 4);
      if (!y) return;
      svcByYear[y] = (svcByYear[y] || 0) + (e.amount || 0);
    });

    return { byYear, years, yearDist, yearSpend, svcByYear };
  }, [entries, svc]);

  if (!entries.length) {
    return (
      <div className="empty-state" style={{ paddingTop: 60 }}>
        <div className="emoji">📈</div>No data yet for reports.
      </div>
    );
  }

  const maxDist  = Math.max(...Object.values(yearDist));
  const maxSpend = Math.max(...Object.values(yearSpend));

  const placeCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (!e.place?.trim()) return;
    const p = e.place.trim();
    placeCounts[p] = (placeCounts[p] || 0) + 1;
  });
  const topPlaces = Object.entries(placeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const avgEffByYear = years.map(y => {
    const ms = byYear[y].filter(e => e.mileage && e.mileage > 0).map(e => e.mileage as number);
    return ms.length ? +(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(1) : null;
  });

  const gridColor = getGridColor(theme);
  const barOpts: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: 'var(--text3)' as any, font: { size: 10 } } as any },
      y: { grid: { color: gridColor }, ticks: { color: 'var(--text3)' as any, font: { size: 10 } } as any },
    },
  } as any;

  return (
    <div className="report-grid">
      {/* Distance by year */}
      <div className="report-card">
        <div className="report-title">{u.distLabel} Travelled by Year</div>
        <div className="year-list">
          {years.map(y => (
            <div key={y} className="year-item">
              <div className="year-badge">{y}</div>
              <div className="year-bar-wrap">
                <div className="year-bar" style={{ width: `${Math.round(yearDist[y] / maxDist * 100)}%` }} />
              </div>
              <div className="year-km">{u.fmt(yearDist[y])} {u.distance}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Spend by year */}
      <div className="report-card">
        <div className="report-title">Fuel Spend by Year</div>
        <div className="year-list">
          {years.map(y => (
            <div key={y} className="year-item">
              <div className="year-badge">{y}</div>
              <div className="year-bar-wrap">
                <div className="year-bar" style={{
                  width: `${Math.round(yearSpend[y] / maxSpend * 100)}%`,
                  background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
                }} />
              </div>
              <div className="year-km">{u.fmtCur(yearSpend[y])}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly summary table */}
      <div className="report-card full">
        <div className="report-title">Yearly Summary</div>
        <div className="table-wrap" style={{ marginBottom: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th><th>Entries</th><th>{u.distLabel}</th>
                <th>Fuel ({u.fuel})</th><th>Fuel Spend</th><th>Svc Spend</th>
                <th>Total</th><th>{u.effLabel}</th><th>{u.currencySymbol}/{u.fuel}</th>
              </tr>
            </thead>
            <tbody>
              {[...years].reverse().map(y => {
                const ye    = byYear[y];
                const tF    = ye.reduce((s, e) => s + (e.fuel || 0), 0);
                const tS    = ye.reduce((s, e) => s + (e.amount || 0), 0);
                const tSvc  = svcByYear[y] || 0;
                const effs  = ye.filter(e => e.mileage && e.mileage > 0).map(e => e.mileage as number);
                const avgE  = effs.length ? effs.reduce((a, b) => a + b, 0) / effs.length : null;
                const prices = ye.filter(e => e.price > 0).map(e => e.price);
                const avgP  = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
                return (
                  <tr key={y}>
                    <td style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>{y}</td>
                    <td>{ye.length}</td>
                    <td>{u.fmt(yearDist[y])} {u.distance}</td>
                    <td>{u.fmt(tF, 1)} {u.fuel}</td>
                    <td>{u.fmtCur(tS)}</td>
                    <td style={{ color: 'var(--purple)' }}>{tSvc ? u.fmtCur(tSvc) : '—'}</td>
                    <td>{u.fmtCur(tS + tSvc)}</td>
                    <td className={getEffClass(avgE, viewCar ?? undefined)}>
                      {avgE ? u.fmt(avgE, 1) + ' ' + u.efficiency : '—'}
                    </td>
                    <td>{avgP ? u.currencySymbol + u.fmt(avgP, 2) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top stations */}
      <div className="report-card">
        <div className="report-title">Top Fuel Stations</div>
        <div className="top-places">
          {topPlaces.length === 0
            ? <div className="empty-state">No place data yet</div>
            : topPlaces.map(([name, count]) => (
              <div key={name} className="place-row">
                <span>⛽ {name}</span>
                <span style={{ fontFamily: 'DM Mono,monospace', color: 'var(--text2)', fontSize: '.76rem' }}>
                  {count} fill-ups
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Avg efficiency by year chart */}
      <div className="report-card">
        <div className="chart-title" style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>
          Avg {u.effLabel} by Year <span style={{ color: 'var(--text2)', fontSize: '.76rem', fontWeight: 400 }}>{u.efficiency}</span>
        </div>
        <div className="chart-wrap">
          <Bar
            data={{
              labels: years,
              datasets: [{
                data: avgEffByYear,
                backgroundColor: avgEffByYear.map(v =>
                  v != null && v >= u.effGood ? 'rgba(34,197,94,.55)' : 'rgba(240,165,0,.55)'
                ),
                borderColor: avgEffByYear.map(v =>
                  v != null && v >= u.effGood ? '#22c55e' : '#f0a500'
                ),
                borderWidth: 1,
                borderRadius: 3,
              }]
            }}
            options={barOpts}
          />
        </div>
      </div>
    </div>
  );
}
