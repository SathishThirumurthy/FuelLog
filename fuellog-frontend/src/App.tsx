// ============================================================
//  FuelLog Frontend — src/App.tsx
//  Updated to load all data from API instead of localStorage
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { FuelLogData, Page, Theme }          from './types';
import { THEME_KEY }                         from './utils/storage';
import { carsAPI, fuelAPI, serviceAPI }      from './utils/api';
import Login                                 from './components/Login';
import SignUp                                from './components/SignUp';
import VerifyEmail                           from './components/VerifyEmail';
import Header                                from './components/Header';
import Nav                                   from './components/Nav';
import Toast                                 from './components/Toast';
import NewCarModal                           from './components/NewCarModal';
import DeleteModal                           from './components/DeleteModal';
import Dashboard                             from './components/Dashboard';
import Entries                               from './components/Entries';
import AddEntry                              from './components/AddEntry';
import Service                               from './components/Service';
import Reports                               from './components/Reports';
import Cars                                  from './components/Cars';

type AuthScreen = 'login' | 'signup' | 'verify';
const EMPTY_DATA: FuelLogData = { cars: [], entries: {}, service: {} };

export default function App() {
  const [authScreen,  setAuthScreen]  = useState<AuthScreen>('login');
  const [authed,      setAuthed]      = useState<boolean>(() => {
    return !!localStorage.getItem('fl_token');
  });
  const [verifyEmail, setVerifyEmail] = useState('');
  const [theme,     setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'dark'
  );
  const [data,      setData]       = useState<FuelLogData>(EMPTY_DATA);
  const [loading,   setLoading]    = useState(false);
  const [activeCar, setActiveCar]  = useState<string | null>(null);
  const [viewCar,   setViewCar]    = useState<string | null>(null);
  const [page,      setPage]       = useState<Page>('dashboard');
  const [toast,     setToast]      = useState({ msg: '', isError: false, show: false });
  const [showCarModal,  setShowCarModal]  = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<{
    id: string; type: 'fuel' | 'service'
  } | null>(null);
  const [editingFuelId, setEditingFuelId] = useState<string | null>(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    if (token) {
      fetch(`http://localhost:3001/api/auth/verify?token=${token}`)
        .then(res => res.json())
        .then(data => {
          window.history.replaceState({}, document.title, '/');
          if (data.message) {
            setAuthScreen('login');
            setAuthed(false);
            showToast('✅ Email verified! You can now log in.');
          } else {
            showToast('❌ Verification failed. Please try again.', true);
          }
        })
        .catch(() => showToast('❌ Cannot connect to server.', true));
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const cars = await carsAPI.getAll();
      if (!cars.length) {
        setData(EMPTY_DATA);
        setActiveCar(null);
        setViewCar(null);
        setLoading(false);
        return;
      }

      const active = cars.find((c: any) => c.active) || cars[0];
      setActiveCar(active.id);
      setViewCar(active.id);

      const entries:  Record<string, any[]> = {};
      const service:  Record<string, any[]> = {};

      await Promise.all(
        cars.map(async (car: any) => {
          try {
            const [fuelEntries, svcEntries] = await Promise.all([
              fuelAPI.getAll(car.id),
              serviceAPI.getAll(car.id),
            ]);

            entries[car.id] = fuelEntries.map((e: any) => ({
              id:       e.id,
              date:     e.date ? new Date(e.date).toISOString().slice(0, 10) : '',
              km:       parseFloat(e.km)    || 0,
              fuel:     parseFloat(e.fuel)  || 0,
              price:    parseFloat(e.price) || 0,
              total_km: e.total_km != null  ? parseFloat(e.total_km) : null,
              mileage:  e.mileage  != null  ? parseFloat(e.mileage)  : null,
              amount:   e.amount   != null  ? parseFloat(e.amount)   : null,
              place:    e.place || '',
            }));

            service[car.id] = svcEntries.map((s: any) => ({
              id:      s.id,
              date:    s.date ? new Date(s.date).toISOString().slice(0, 10) : '',
              km:      s.km     != null ? parseFloat(s.km)     : null,
              amount:  s.amount != null ? parseFloat(s.amount) : null,
              remarks: s.remarks || '',
            }));

          } catch (err) {
            entries[car.id] = [];
            service[car.id] = [];
          }
        })
      );

      const mappedCars = cars.map((c: any) => ({
        id:        c.id,
        name:      c.name,
        country:   c.country,
        purchased: c.purchased ? new Date(c.purchased).toISOString().slice(0, 10) : undefined,
        sold:      c.sold      ? new Date(c.sold).toISOString().slice(0, 10)      : undefined,
        note:      c.note  || '',
        reg:       c.reg   || '',
        active:    c.active || false,
      }));

      setData({ cars: mappedCars, entries, service });

    } catch (err) {
      showToast('❌ Failed to load data. Please refresh.', true);
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAllData();
  }, [authed, loadAllData]);

  function showToast(msg: string, isError = false) {
    setToast({ msg, isError, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function changeTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.body.setAttribute('data-theme', t);
  }

  const handleLogin = useCallback((token: string, email: string) => {
    localStorage.setItem('fl_token', token);
    localStorage.setItem('fl_email', email);
    setAuthed(true);
    setAuthScreen('login');
  }, []);

  function handleLogout() {
    localStorage.removeItem('fl_token');
    localStorage.removeItem('fl_email');
    setAuthed(false);
    setData(EMPTY_DATA);
    setActiveCar(null);
    setViewCar(null);
    setAuthScreen('login');
  }

  function handleSignUpSuccess(email: string) {
    setVerifyEmail(email);
    setAuthScreen('verify');
  }

  async function handleSetActiveCar(id: string) {
    try {
      await carsAPI.setActive(id);
      await loadAllData();
      const car = data.cars.find(c => c.id === id);
      showToast(`✅ Active car: ${car?.name}`);
    } catch (err: any) {
      showToast(`❌ ${err.message}`, true);
    }
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'fuel') {
        await fuelAPI.delete(deleteTarget.id);
        showToast('🗑 Entry deleted');
      } else {
        await serviceAPI.delete(deleteTarget.id);
        showToast('🗑 Service entry deleted');
      }
      await loadAllData();
    } catch (err: any) {
      showToast(`❌ ${err.message}`, true);
    }
    setDeleteTarget(null);
  }

  function handleEditFuel(id: string) {
    setEditingFuelId(id);
    setPage('addEntry');
  }

  async function handleAddCar(
    name:      string,
    country:   'IN' | 'US',
    purchased: string,
    reg:       string
  ) {
    try {
      const id = 'car_' + Date.now();
      await carsAPI.add({
        id, name, country,
        purchased: purchased || undefined,
        reg:       reg       || undefined,
        active:    true,
      });
      await loadAllData();
      setShowCarModal(false);
      const flag = country === 'US' ? '🇺🇸' : '🇮🇳';
      showToast(`✅ ${flag} ${name} added successfully!`);
    } catch (err: any) {
      showToast(`❌ ${err.message}`, true);
    }
  }

  if (!authed) {
    if (authScreen === 'signup') {
      return (
        <SignUp
          onSignUpSuccess={handleSignUpSuccess}
          onBackToLogin={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'verify') {
      return (
        <VerifyEmail
          email={verifyEmail}
          onBackToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSignUp={() => setAuthScreen('signup')}
      />
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--bg)',
        color:          'var(--text)',
        gap:            16,
      }}>
        <div style={{ fontSize: '2.5rem' }}>⛽</div>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize:   '1.2rem',
        }}>
          Loading FuelLog...
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '.85rem' }}>
          Fetching your data
        </div>
      </div>
    );
  }

  const activeCar_ = data.cars.find(c => c.id === activeCar) || null;
  const viewCar_   = data.cars.find(c => c.id === viewCar)   || null;

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
            onSaved={async () => {
              await loadAllData();
              setEditingFuelId(null);
              showToast('✅ Fuel entry saved!');
              setPage('entries');
            }}
            onClearEdit={() => setEditingFuelId(null)}
            onToast={showToast}
          />
        )}
        {page === 'service' && (
          <Service
            data={data}
            activeCar={activeCar_}
            viewCar={viewCar_}
            onSaved={async () => {
              await loadAllData();
              showToast('✅ Service entry saved!');
            }}
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
        <NewCarModal
          onAdd={handleAddCar}
          onClose={() => setShowCarModal(false)}
        />
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
