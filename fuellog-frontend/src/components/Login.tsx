// ============================================================
//  FuelLog Frontend — src/components/Login.tsx
//  Updated to call API instead of hardcoded credentials
// ============================================================

import { useState, useRef, useEffect } from 'react';

interface Props {
  onLogin: (token: string, email: string) => void;
  onSignUp: () => void;
}

export default function Login({ onLogin, onSignUp }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
  }, [shake]);

  async function doLogin() {
    // ── Validate inputs ──────────────────────────────────────
    if (!email || !password) {
      setError('Please enter your email and password');
      setShake(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ── Call the API ─────────────────────────────────────────
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ── Handle errors from API ──────────────────────────────
        setError(data.error || 'Login failed. Please try again.');
        setPassword('');
        setShake(true);
        return;
      }

      // ── Success — save token and proceed ─────────────────────
      localStorage.setItem('fl_token', data.token);
      localStorage.setItem('fl_email', data.user.email);
      onLogin(data.token, data.user.email);

    } catch (err) {
      setError('Cannot connect to server. Please try again.');
      setShake(true);
    } finally {
      setLoading(false);
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
        {/* Logo */}
        <div className="login-logo-wrap">
          <span className="login-logo-icon">⛽</span>
          <div className="login-logo">Fuel<span>Log</span></div>
        </div>
        <p className="login-tagline">Car Fuel &amp; Service Tracker</p>

        {/* Error message */}
        {error && (
          <div className="login-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Email field */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label htmlFor="fl-email">Email Address</label>
          <input
            id="fl-email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            disabled={loading}
          />
        </div>

        {/* Password field */}
        <div className="form-group" style={{ marginBottom: 4 }}>
          <label htmlFor="fl-pass">Password</label>
          <input
            id="fl-pass"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            disabled={loading}
          />
        </div>

        {/* Login button */}
        <button
          className="btn-login"
          onClick={doLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>

        {/* Sign up link */}
        <div style={{
          textAlign:  'center',
          marginTop:  18,
          fontSize:   '.84rem',
          color:      'var(--text2)',
        }}>
          Don't have an account?{' '}
          <span
            onClick={onSignUp}
            style={{
              color:    'var(--accent)',
              cursor:   'pointer',
              fontWeight: 600,
            }}
          >
            Sign Up
          </span>
        </div>

        <div className="login-footer">FuelLog © 2025</div>
      </div>
    </div>
  );
}
