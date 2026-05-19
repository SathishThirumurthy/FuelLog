import { Car, Theme } from '../types';

const THEMES: { key: Theme; label: string }[] = [
  { key: 'dark',   label: 'Dark'   },
  { key: 'light',  label: 'Light'  },
  { key: 'ocean',  label: 'Ocean'  },
  { key: 'forest', label: 'Forest' },
  { key: 'sunset', label: 'Sunset' },
];

interface Props {
  activeCarName: string;
  cars: Car[];
  viewCarId: string;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onSwitchViewCar: (id: string) => void;
  onNewCar: () => void;
  onLogout: () => void;
}

export default function Header({
  activeCarName, cars, viewCarId, theme,
  onThemeChange, onSwitchViewCar, onNewCar, onLogout
}: Props) {
  return (
    <header>
      <div className="logo">Fuel<span>Log</span></div>
      <div className="header-right">
        <div className="active-badge">🚗 {activeCarName}</div>

        <select value={viewCarId} onChange={e => onSwitchViewCar(e.target.value)}>
          {cars.length === 0
            ? <option>No cars</option>
            : cars.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.sold ? ' (Sold)' : ''} {c.country === 'US' ? '🇺🇸' : '🇮🇳'}
                </option>
              ))
          }
        </select>

        <div className="theme-picker" title="Choose theme">
          {THEMES.map(t => (
            <div
              key={t.key}
              className={`theme-swatch${theme === t.key ? ' active' : ''}`}
              data-t={t.key}
              title={t.label}
              onClick={() => onThemeChange(t.key)}
            />
          ))}
        </div>

        <button onClick={onNewCar}>＋ New Car</button>
        <button className="btn-logout" onClick={onLogout}>⏻ Logout</button>
      </div>
    </header>
  );
}
