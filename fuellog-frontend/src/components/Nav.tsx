import { Page } from '../types';

const PAGES: { key: Page; label: string }[] = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'entries',   label: '📋 Entries'   },
  { key: 'addEntry',  label: '➕ Add Entry'  },
  { key: 'service',   label: '🔧 Service'   },
  { key: 'reports',   label: '📈 Reports'   },
  { key: 'cars',      label: '🚗 Cars'      },
];

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
}

export default function Nav({ page, onNavigate }: Props) {
  return (
    <nav>
      {PAGES.map(p => (
        <button
          key={p.key}
          className={page === p.key ? 'active' : ''}
          onClick={() => onNavigate(p.key)}
        >
          {p.label}
        </button>
      ))}
    </nav>
  );
}
