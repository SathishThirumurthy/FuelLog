// ============================================================
//  FuelLog Backend — server.js
//  Main Express application entry point
// ============================================================

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const { Pool }   = require('pg');

// ── Load environment variables ───────────────────────────────
dotenv.config();

// ── Create Express app ───────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ── PostgreSQL connection pool ───────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test DB connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// ── Make pool available to all routes ───────────────────────
app.locals.db = pool;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const carsRoutes    = require('./routes/cars');
const fuelRoutes    = require('./routes/fuel');
const serviceRoutes = require('./routes/service');
const reportsRoutes = require('./routes/reports');

app.use('/api/auth',    authRoutes);
app.use('/api/cars',    carsRoutes);
app.use('/api/fuel',    fuelRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/reports', reportsRoutes);

// ── Health check endpoint ────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      status:   'ok',
      message:  '✅ FuelLog API is running',
      database: 'connected',
      time:     new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status:   'error',
      message:  '❌ Database not connected',
      error:    err.message,
    });
  }
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FuelLog API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});