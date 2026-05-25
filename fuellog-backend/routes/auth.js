// ============================================================
//  FuelLog Backend — routes/auth.js
//  Handles: Signup, Email Verification, Login
// ============================================================

const express      = require('express');
const router       = express.Router();
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
const nodemailer   = require('nodemailer');
const { v4: uuidv4 } = require('uuid');


// ── Gmail Transporter Setup ──────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


// ── Helper: Send Verification Email ─────────────────────────
async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

  const mailOptions = {
    from:    `"FuelLog" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject: 'FuelLog — Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #f0a500; margin-bottom: 8px;">⛽ FuelLog</h2>
        <h3 style="color: #1a1d2e;">Verify Your Email Address</h3>
        <p style="color: #5a6080; line-height: 1.6;">
          Thank you for signing up! Please click the button below to verify 
          your email address and activate your FuelLog account.
        </p>
        <a href="${verifyUrl}" 
           style="display: inline-block; margin: 24px 0; padding: 12px 28px; 
                  background: #f0a500; color: #000; font-weight: bold; 
                  text-decoration: none; border-radius: 8px; font-size: 16px;">
          ✅ Verify My Email
        </a>
        <p style="color: #9ca3c0; font-size: 13px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #f0a500;">${verifyUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #dde0eb; margin: 24px 0;" />
        <p style="color: #9ca3c0; font-size: 12px;">
          If you did not create a FuelLog account, please ignore this email.<br/>
          This link will remain active until your account is verified.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}


// ============================================================
//  POST /api/auth/signup
//  Creates a new user and sends verification email
// ============================================================
router.post('/signup', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;

  // ── Validate input ────────────────────────────────────────
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    // ── Check if email already exists ─────────────────────────
    const existing = await db.query(
      'SELECT id, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.status === 'pending') {
        return res.status(400).json({
          error: 'This email is already registered but not verified. Please check your inbox or request a new verification email.',
        });
      }
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // ── Hash password ─────────────────────────────────────────
    const saltRounds   = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ── Generate verification token ───────────────────────────
    const verifyToken = uuidv4();

    // ── Save user to database ─────────────────────────────────
    await db.query(
      `INSERT INTO users (email, password_hash, status, verify_token, created_at)
       VALUES ($1, $2, 'pending', $3, NOW())`,
      [email.toLowerCase(), passwordHash, verifyToken]
    );

    // ── Send verification email ───────────────────────────────
    await sendVerificationEmail(email.toLowerCase(), verifyToken);

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
    });

  } catch (err) {
     console.error('Signup error FULL:', err);
    res.status(500).json({ 
      error: 'Signup failed. Please try again.',
      detail: err.message 
    });
  }
});


// ============================================================
//  GET /api/auth/verify?token=xxxxxx
//  Verifies the user's email using the token from the email link
// ============================================================
router.get('/verify', async (req, res) => {
  const db    = req.app.locals.db;
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is missing' });
  }

  try {
    // ── Find user with this token ─────────────────────────────
    const result = await db.query(
      'SELECT id, email, status FROM users WHERE verify_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    const user = result.rows[0];

    if (user.status === 'verified') {
      return res.status(200).json({ message: 'Email already verified. Please log in.' });
    }

    // ── Mark user as verified ─────────────────────────────────
    await db.query(
      `UPDATE users 
       SET status = 'verified', verify_token = NULL 
       WHERE id = $1`,
      [user.id]
    );

    res.status(200).json({
      message: 'Email verified successfully! You can now log in.',
    });

  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});


// ============================================================
//  POST /api/auth/login
//  Validates email + password, returns JWT token
// ============================================================
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;

  // ── Validate input ────────────────────────────────────────
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // ── Find user by email ────────────────────────────────────
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // ── Check if email is verified ────────────────────────────
    if (user.status === 'pending') {
      return res.status(401).json({
        error: 'Please verify your email before logging in. Check your inbox.',
      });
    }

    // ── Compare password ──────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ── Update last login timestamp ───────────────────────────
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // ── Generate JWT token ────────────────────────────────────
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:    user.id,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});


// ============================================================
//  POST /api/auth/resend
//  Resends the verification email
// ============================================================
router.post('/resend', async (req, res) => {
  const db = req.app.locals.db;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await db.query(
      'SELECT id, status, verify_token FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = result.rows[0];

    if (user.status === 'verified') {
      return res.status(400).json({ error: 'This account is already verified. Please log in.' });
    }

    // ── Generate new token ────────────────────────────────────
    const newToken = uuidv4();

    await db.query(
      'UPDATE users SET verify_token = $1 WHERE id = $2',
      [newToken, user.id]
    );

    await sendVerificationEmail(email.toLowerCase(), newToken);

    res.status(200).json({ message: 'Verification email resent. Please check your inbox.' });

  } catch (err) {
    console.error('Resend error:', err.message);
    res.status(500).json({ error: 'Failed to resend email. Please try again.' });
  }
});


// ── Test route ───────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working ✅' });
});


module.exports = router;
