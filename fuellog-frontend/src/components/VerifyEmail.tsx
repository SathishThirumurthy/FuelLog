// ============================================================
//  FuelLog Frontend — src/components/VerifyEmail.tsx
//  Shown after successful signup
//  Tells user to check their inbox for verification email
// ============================================================

import { useState } from 'react';

interface Props {
  email:          string;
  onBackToLogin:  () => void;
}

export default function VerifyEmail({ email, onBackToLogin }: Props) {
  const [resending,    setResending]    = useState(false);
  const [resendMsg,    setResendMsg]    = useState('');
  const [resendError,  setResendError]  = useState('');

  // ── Resend verification email ────────────────────────────
  async function handleResend() {
    setResending(true);
    setResendMsg('');
    setResendError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/resend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResendError(data.error || 'Failed to resend. Please try again.');
        return;
      }

      setResendMsg('✅ Verification email resent! Please check your inbox.');

    } catch (err) {
      setResendError('Cannot connect to server. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="login-page" data-theme="dark">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <span className="login-logo-icon">⛽</span>
          <div className="login-logo">Fuel<span>Log</span></div>
        </div>

        {/* Email icon */}
        <div style={{
          textAlign:    'center',
          fontSize:     '3rem',
          marginBottom: 12,
          marginTop:    8,
        }}>
          📧
        </div>

        {/* Title */}
        <div style={{
          textAlign:    'center',
          fontFamily:   'Syne, sans-serif',
          fontWeight:   700,
          fontSize:     '1.1rem',
          marginBottom: 10,
        }}>
          Check Your Email
        </div>

        {/* Description */}
        <p style={{
          textAlign:    'center',
          color:        'var(--text2)',
          fontSize:     '.84rem',
          lineHeight:   1.6,
          marginBottom: 20,
        }}>
          We sent a verification link to:
          <br />
          <span style={{
            color:      'var(--accent)',
            fontWeight: 600,
            fontSize:   '.9rem',
          }}>
            {email}
          </span>
          <br /><br />
          Please click the link in the email to activate
          your account. Check your spam folder if you
          don't see it within a few minutes.
        </p>

        {/* Steps */}
        <div style={{
          background:   'var(--surface2)',
          border:       '1px solid var(--border)',
          borderRadius: 10,
          padding:      '14px 16px',
          marginBottom: 20,
          fontSize:     '.82rem',
          color:        'var(--text2)',
          lineHeight:   1.8,
        }}>
          <div>1️⃣ Open your email inbox</div>
          <div>2️⃣ Find the email from FuelLog</div>
          <div>3️⃣ Click <strong style={{ color: 'var(--text)' }}>"Verify My Email"</strong></div>
          <div>4️⃣ Come back here and sign in</div>
        </div>

        {/* Resend success message */}
        {resendMsg && (
          <div style={{
            background:   'rgba(34,197,94,.1)',
            border:       '1px solid rgba(34,197,94,.3)',
            color:        'var(--green)',
            borderRadius: 8,
            padding:      '8px 12px',
            fontSize:     '.8rem',
            marginBottom: 12,
            textAlign:    'center',
          }}>
            {resendMsg}
          </div>
        )}

        {/* Resend error message */}
        {resendError && (
          <div className="login-error" style={{ marginBottom: 12 }}>
            <span>⚠</span> {resendError}
          </div>
        )}

        {/* Resend button */}
        <button
          className="btn-secondary"
          onClick={handleResend}
          disabled={resending}
          style={{
            width:        '100%',
            padding:      '10px',
            textAlign:    'center',
            marginBottom: 10,
            opacity:      resending ? 0.7 : 1,
          }}
        >
          {resending ? 'Resending...' : '🔄 Resend Verification Email'}
        </button>

        {/* Back to login button */}
        <button
          className="btn-login"
          onClick={onBackToLogin}
          style={{ marginTop: 4 }}
        >
          ← Back to Sign In
        </button>

        <div className="login-footer">FuelLog © 2025</div>
      </div>
    </div>
  );
}
