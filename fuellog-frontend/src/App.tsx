import { useState, useEffect, useCallback } from 'react';
import { FuelLogData, Page, Theme } from './types';
import { loadData, saveData, THEME_KEY, AUTH_KEY } from './utils/storage';
import { SEED_DATA } from './utils/seedData';
import Login from './components/Login';
import Header from './components/Header';
import Nav from './components/Nav';
import Toast from './components/Toast';
import NewCarModal from './components/NewCarModal';
import DeleteModal from './components/DeleteModal';
import Dashboard from './components/Dashboard';
import Entries from './components/Entries';
import AddEntry from './components/AddEntry';
import Service from './components/Service';
import Reports from './components/Reports';
import Cars from './components/Cars';

export default function App() {
  const [authed, setAuthed]         = useState(() => !!localStorage.getItem(AUTH_KEY));
  const [theme, setThemeState]      = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark');
  const [data, setData]             = useState<FuelLogData>(() => loadData());
  const [activeCar, setActiveCar]   = useState<string | null>(null);
  const [viewCar, setViewCar]       = useState<string | null>(null);
  const [page, setPage]             = useState<Page>('dashboard');
  const [toast, setToast]           = useState({ msg: '', isError: false, show: false });
  const [showCarModal, setShowCarModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'fuel' | 'service' } | null>(null);
  const [editingFuelId, setEditingFuelId]   = useState<string | null>(null);

  // ── INIT ────────────────────────────────────────────────
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!authed) return;
    let d = loadData();
    if (!d.cars.length) {
      d = { cars: SEED_DATA.cars, entries: SEED_DATA.entries, service: SEED_DATA.service || {} };
      saveData(d);
      showToast('✅ Baleno data loaded!');
    }
    if (!d.cars.some(c => c.active) && d.cars.length) {
      (d.cars.find(c => !c.sold) || d.cars[0]).active = true;
      saveData(d);
    }
    const active = d.cars.find(c => c.active)?.id || d.cars[0]?.id || null;
    setData(d);
    setActiveCar(active);
    setViewCar(active);
  }, [authed]);

  // ── HELPERS ─────────────────────────────────────────────
  function showToast(msg: string, isError = false) {
    setToast({ msg, isError, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function persist(d: FuelLogData) {
    saveData(d);
    setData({ ...d });
  }

  function changeTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.body.setAttribute('data-theme', t);
  }

  const handleLogin = useCallback(() => setAuthed(true), []);

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  function handleSetActiveCar(id: string) {
    const d = { ...data };
    d.cars.forEach(c => delete c.active);
    const car = d.cars.find(c => c.id === id);
    if (car) car.active = true;
    setActiveCar(id);
    setViewCar(id);
    persist(d);
    showToast(`✅ Active car: ${car?.name}`);
  }

  function handleSwitchViewCar(id: string) {
    setViewCar(id);
  }

  function handleDeleteEntry(id: string) {
    setDeleteTarget({ id, type: 'fuel' });
  }

  function handleDeleteService(id: string) {
    setDeleteTarget({ id, type: 'service' });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const d = { ...data };
    if (deleteTarget.type === 'fuel') {
      Object.keys(d.entries).forEach(cid => {
        d.entries[cid] = d.entries[cid].filter(e => e.id !== deleteTarget.id);
      });
      showToast('🗑 Entry deleted');
    } else {
      Object.keys(d.service).forEach(cid => {
        d.service[cid] = d.service[cid].filter(e => e.id !== deleteTarget.id);
      });
      showToast('🗑 Service entry deleted');
    }
    persist(d);
    setDeleteTarget(null);
  }

  function handleEditFuel(id: string) {
    setEditingFuelId(id);
    setPage('addEntry');
  }

  function handleAddCar(name: string, country: 'IN' | 'US', purchased: string, reg: string) {
    const d = { ...data };
    const id = 'car_' + Date.now();
    d.cars.forEach(c => delete c.active);
    d.cars.push({ id, name, purchased, reg, country, active: true, note: reg ? 'Reg: ' + reg : '' });
    if (!d.entries) d.entries = {};
    if (!d.service) d.service = {};
    d.entries[id] = [];
    d.service[id] = [];
    setActiveCar(id);
    setViewCar(id);
    persist(d);
    setShowCarModal(false);
    const flag = country === 'US' ? '🇺🇸' : '🇮🇳';
    showToast(`✅ ${flag} ${name} added and set as active car!`);
  }

  if (!authed) return <Login onLogin={handleLogin} />;

  const activeCar_ = data.cars.find(c => c.id === activeCar) || null;
  const viewCar_   = data.cars.find(c => c.id === viewCar) || null;

  return (
    <div>
      <Header
        activeCarName={activeCar_?.name || 'None'}
        cars={data.cars}
        viewCarId={viewCar || ''}
        theme={theme}
        onThemeChange={changeTheme}
        onSwitchViewCar={handleSwitchViewCar}
        onNewCar={() => setShowCarModal(true)}
        onLogout={handleLogout}
      />

      <Nav page={page} onNavigate={setPage} />

      <main>
        {page === 'dashboard' && (
          <Dashboard data={data} viewCar={viewCar_} theme={theme} />
        )}
        {page === 'entries' && (
          <Entries
            data={data}
            viewCar={viewCar_}
            onEdit={handleEditFuel}
            onDelete={handleDeleteEntry}
          />
        )}
        {page === 'addEntry' && (
          <AddEntry
            data={data}
            activeCar={activeCar_}
            editingId={editingFuelId}
            onSaved={(d) => { persist(d); setEditingFuelId(null); showToast('✅ Fuel entry saved!'); setPage('entries'); }}
            onClearEdit={() => setEditingFuelId(null)}
            onToast={showToast}
          />
        )}
        {page === 'service' && (
          <Service
            data={data}
            activeCar={activeCar_}
            viewCar={viewCar_}
            onSaved={(d) => { persist(d); showToast('✅ Service entry saved!'); }}
            onDelete={handleDeleteService}
            onToast={showToast}
          />
        )}
        {page === 'reports' && (
          <Reports data={data} viewCar={viewCar_} theme={theme} />
        )}
        {page === 'cars' && (
          <Cars
            data={data}
            activeCar={activeCar_}
            onSetActive={handleSetActiveCar}
            onNewCar={() => setShowCarModal(true)}
          />
        )}
      </main>

      <Toast msg={toast.msg} isError={toast.isError} show={toast.show} />

      {showCarModal && (
        <NewCarModal onAdd={handleAddCar} onClose={() => setShowCarModal(false)} />
      )}

      {deleteTarget && (
        <DeleteModal
          type={deleteTarget.type}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
