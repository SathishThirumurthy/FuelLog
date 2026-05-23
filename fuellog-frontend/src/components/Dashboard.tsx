import { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { FuelLogData, Car, Theme } from '../types';
import { getUnits, getEffClass } from '../utils/units';

interface Props {
  data: FuelLogData;
  viewCar: Car | null;
  theme: Theme;
}

function getGridColor(theme: Theme): string {
  const map: Record<Theme, string> = {
    dark:   'rgba(255,255,255,0.04)',
    light:  'rgba(0,0,0,0.06)',
    ocean:  'rgba(56,189,248,0.06)',
    forest: 'rgba(74,222,128,0.06)',
    sunset: 'rgba(251,146,60,0.06)',
  };
  return map[theme];
}

export default function Dashboard({ data, viewCar, theme }: Props) {
  const u = getUnits(viewCar ?? undefined);
  const carId = viewCar?.id ?? '';

  const entries = useMemo(() => {
    const raw = (data.entries[carId] || []).filter(e => e.km && e.km > 0);
    return [...raw].sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [data, carId]);

  const svc = useMemo(() => {
    const raw = data.service[carId] || [];
    return [...raw].sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [data, carId]);

  if (!entries.length) {
    return (
      <div className="empty-state" style={{ paddingTop: 60 }}>
        <div className="emoji">⛽</div>
        No fuel entries yet. Add your first fill-up!
      </div>
    );
  }

  const sorted      = [...entries].sort((a, b) => a.km - b.km);
  const totalDist   = sorted[sorted.length - 1].km - sorted[0].km;
  const totalFuel   = entries.reduce((s, e) => s + (e.fuel || 0), 0);
  const totalSpend  = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSvc    = svc.reduce((s, e) => s + (e.amount || 0), 0);
  const effs        = entries.filter(e => e.mileage && e.mileage > 0).map(e => e.mileage as number);
  const avgEff      = effs.length ? effs.reduce((a, b) => a + b, 0) / effs.length : 0;
  const latestPrice = [...entries].reverse().find(e => e.price > 0)?.price;
  const costPerUnit = totalDist > 0 ? (totalSpend + totalSvc) / totalDist : null;

  const gridColor = getGridColor(theme);
  const baseOpts = (type: 'cur' | 'eff' | 'price'): ChartOptions<'bar'> | ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw as number;
            if (type === 'cur')   return ' ' + u.currencySymbol + v;
            if (type === 'eff')   return ' ' + v + ' ' + u.efficiency;
            if (type === 'price') return ' ' + u.currencySymbol + v + '/' + u.fuel;
            return ' ' + v;
          }
        }
      }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: 'var(--text3)' as string, font: { size: 10 }, maxTicksLimit: 8 } as any },
      y: { grid: { color: gridColor }, ticks: { color: 'var(--text3)' as string, font: { size: 10 } } as any },
    },
  } as any);

  // Monthly spend chart
  const monthly: Record<string, number> = {};
  entries.forEach(e => {
    if (!e.date || !e.amount) return;
    const k = e.date.slice(0, 7);
    monthly[k] = (monthly[k] || 0) + e.amount;
  });
  const months = Object.keys(monthly).sort().slice(-24);
  const monthLabels = months.map(m => {
    const [y, mo] = m.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1] + "'" + y.slice(2);
  });

  // Efficiency trend
  const mE = entries.filter(e => e.mileage && e.mileage > 0 && e.mileage < 200);
  const step = Math.max(1, Math.floor(mE.length / 60));
  const mS = mE.filter((_, i) => i % step === 0);

  // Price history
  const pE = entries.filter(e => e.price > 0);
  const pStep = Math.max(1, Math.floor(pE.length / 60));
  const pS = pE.filter((_, i) => i % pStep === 0);

  // Service by year
  const svcY: Record<string, number> = {};
  svc.forEach(e => {
    if (!e.date || !e.amount) return;
    const y = e.date.slice(0, 4);
    svcY[y] = (svcY[y] || 0) + e.amount;
  });
  const sy = Object.keys(svcY).sort();

  const recent = [...svc].reverse().slice(0, 5);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Distance</div>
          <div className="stat-value">{u.fmt(totalDist)}</div>
          <div className="stat-sub">{u.distFull}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Fuel</div>
          <div className="stat-value">{u.fmt(totalFuel, 0)} {u.fuel}</div>
          <div className="stat-sub">{entries.length} fill-ups</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fuel Spend</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>{u.fmtCur(totalSpend)}</div>
          <div className="stat-sub">total on fuel</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">{u.effLabel}</div>
          <div className={`stat-value ${getEffClass(avgEff, viewCar ?? undefined)}`}>{u.fmt(avgEff, 1)}</div>
          <div className="stat-sub">{u.effFull}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Service Spend</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--purple)' }}>{u.fmtCur(totalSvc)}</div>
          <div className="stat-sub">{svc.length} services</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spend</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{u.fmtCur(totalSpend + totalSvc)}</div>
          <div className="stat-sub">fuel + service</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{u.costPerDist}</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {costPerUnit ? u.currencySymbol + costPerUnit.toFixed(2) : '—'}
          </div>
          <div className="stat-sub">running cost</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Latest {u.currencySymbol}/{u.fuel}</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {latestPrice ? u.currencySymbol + latestPrice.toFixed(2) : '—'}
          </div>
          <div className="stat-sub">per {u.fuel}</div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="chart-grid">
        <div className="chart-card full">
          <div className="chart-title">
            Monthly Fuel Spend <span>{u.currencySymbol} per month</span>
          </div>
          <div className="chart-wrap">
            <Bar
              data={{
                labels: monthLabels,
                datasets: [{
                  data: months.map(m => Math.round(monthly[m])),
                  backgroundColor: 'rgba(240,165,0,.45)',
                  borderColor: 'var(--accent)',
                  borderWidth: 1,
                  borderRadius: 3,
                }]
              }}
              options={baseOpts('cur') as ChartOptions<'bar'>}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            {u.effLabel} Trend <span>{u.effFull} over time</span>
          </div>
          <div className="chart-wrap">
            <Line
              data={{
                labels: mS.map(e => e.date?.slice(0, 7)),
                datasets: [{
                  data: mS.map(e => +(e.mileage as number).toFixed(1)),
                  borderColor: '#22c55e',
                  backgroundColor: 'rgba(34,197,94,.1)',
                  tension: .3,
                  pointRadius: 0,
                  fill: true,
                  borderWidth: 1.5,
                }]
              }}
              options={baseOpts('eff') as ChartOptions<'line'>}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            Fuel Price History <span>{u.currencySymbol}/{u.fuel} over time</span>
          </div>
          <div className="chart-wrap">
            <Line
              data={{
                labels: pS.map(e => e.date?.slice(0, 7)),
                datasets: [{
                  data: pS.map(e => e.price),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59,130,246,.1)',
                  tension: .3,
                  pointRadius: 0,
                  fill: true,
                  borderWidth: 1.5,
                }]
              }}
              options={baseOpts('price') as ChartOptions<'line'>}
            />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Service Spend by Year</div>
          <div className="chart-wrap">
            <Bar
              data={{
                labels: sy,
                datasets: [{
                  data: sy.map(y => Math.round(svcY[y])),
                  backgroundColor: 'rgba(168,85,247,.45)',
                  borderColor: '#a855f7',
                  borderWidth: 1,
                  borderRadius: 3,
                }]
              }}
              options={baseOpts('cur') as ChartOptions<'bar'>}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Recent Services <span>last 5</span></div>
          {recent.length === 0
            ? <div className="empty-state" style={{ padding: 16 }}>No service records yet</div>
            : recent.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', background: 'var(--surface2)', borderRadius: 7,
                  marginBottom: 5, border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontSize: '.82rem', fontWeight: 500 }}>{s.date}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 1 }}>
                      {s.remarks || 'Service'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '.83rem', color: 'var(--purple)' }}>
                    {u.fmtCur(s.amount)}
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
