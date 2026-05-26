// ============================================================
//  FuelLog Frontend — src/components/SignUp.tsx
//  New signup form - email + password + confirm password
// ============================================================

import { useState, useRef, useEffect } from 'react';

interface Props {
  onSignUpSuccess: (email: string) => void;
  onBackToLogin:   () => void;
}

export default function SignUp({ onSignUpSuccess, onBackToLogin }: Props) {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [shake,           setShake]           = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
  }, [shake]);

  // ── Password strength indicator ──────────────────────────
  function getPasswordStrength(pwd: string): {
    label: string;
    color: string;
    width: string;
  } {
    if (pwd.length === 0) return { label: '',        color: 'transparent',    width: '0%'   };
    if (pwd.length < 6)   return { label: 'Too short', color: 'var(--red)',   width: '25%'  };
    if (pwd.length < 8)   return { label: 'Weak',      color: 'var(--accent)', width: '50%' };
    if (pwd.length < 12)  return { label: 'Good',      color: '#3b82f6',      width: '75%'  };
    return                       { label: 'Strong',    color: 'var(--green)', width: '100%' };
  }

  const strength = getPasswordStrength(password);

  async function doSignUp() {
    // ── Validate inputs ──────────────────────────────────────
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      setShake(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setShake(true);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setShake(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setShake(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ── Call the API ─────────────────────────────────────────
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        setShake(true);
        return;
      }

      // ── Success — go to verify email screen ──────────────────
      onSignUpSuccess(email.trim().toLowerCase());

    } catch (err) {
      setError('Cannot connect to server. Please try again.');
      setShake(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSignUp();
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
        <p className="login-tagline">Create your account</p>

        {/* Error message */}
        {error && (
          <div className="login-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Email field */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label htmlFor="su-email">Email Address</label>
          <input
            id="su-email"
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
        <div className="form-group" style={{ marginBottom: 6 }}>
          <label htmlFor="su-pass">Password</label>
          <input
            id="su-pass"
            type="password"
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            disabled={loading}
          />
          {/* Password strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{
                height:       4,
                background:   'var(--border)',
                borderRadius: 4,
                overflow:     'hidden',
              }}>
                <div style={{
                  height:           '100%',
                  width:            strength.width,
                  background:       strength.color,
                  borderRadius:     4,
                  transition:       'width 0.3s, background 0.3s',
                }} />
              </div>
              <div style={{
                fontSize:   '.7rem',
                color:      strength.color,
                marginTop:  3,
                fontWeight: 500,
              }}>
                {strength.label}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="form-group" style={{ marginBottom: 4 }}>
          <label htmlFor="su-confirm">Confirm Password</label>
          <input
            id="su-confirm"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            disabled={loading}
          />
          {/* Password match indicator */}
          {confirmPassword.length > 0 && (
            <div style={{
              fontSize:  '.7rem',
              marginTop: 3,
              color:     password === confirmPassword ? 'var(--green)' : 'var(--red)',
              fontWeight: 500,
            }}>
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}
        </div>

        {/* Sign Up button */}
        <button
          className="btn-login"
          onClick={doSignUp}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, marginTop: 16 }}
        >
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>

        {/* Back to login link */}
        <div style={{
          textAlign:  'center',
          marginTop:  18,
          fontSize:   '.84rem',
          color:      'var(--text2)',
        }}>
          Already have an account?{' '}
          <span
            onClick={onBackToLogin}
            style={{
              color:      'var(--accent)',
              cursor:     'pointer',
              fontWeight: 600,
            }}
          >
            Sign In
          </span>
        </div>

        <div className="login-footer">FuelLog © 2025</div>
      </div>
    </div>
  );
}
