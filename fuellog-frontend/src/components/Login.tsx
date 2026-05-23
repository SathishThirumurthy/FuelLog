import { useState, useRef, useEffect } from 'react';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(false);
  const [shake, setShake]       = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
  }, [shake]);

  function doLogin() {
    if (username === 'Admin' && password === '727272') {
      localStorage.setItem('fl_auth', '1');
      onLogin();
    } else {
      setError(true);
      setPassword('');
      setShake(false);
      // force reflow then re-apply
      requestAnimationFrame(() => setShake(true));
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doLogin();
  }

  return (
    <div className="login-page" data-theme="dark">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div ref={cardRef} className={`login-card${shake ? ' shake' : ''}`}>
        <div className="login-logo-wrap">
          <span className="login-logo-icon">⛽</span>
          <div className="login-logo">Fuel<span>Log</span></div>
        </div>
        <p className="login-tagline">Car Fuel &amp; Service Tracker</p>

        {error && (
          <div className="login-error">
            <span>⚠</span> Invalid username or password.
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label htmlFor="fl-user">Username</label>
          <input
            id="fl-user"
            type="text"
            placeholder="Enter username"
            autoComplete="username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(false); }}
            onKeyDown={handleKey}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 4 }}>
          <label htmlFor="fl-pass">Password</label>
          <input
            id="fl-pass"
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            onKeyDown={handleKey}
          />
        </div>

        <button className="btn-login" onClick={doLogin}>Sign In →</button>

        <div className="login-footer">FuelLog © 2025</div>
      </div>
    </div>
  );
}
