// ============================================================
//  FuelLog Backend — routes/service.js
//  All routes protected by auth middleware
//  All data filtered by req.user.userId
// ============================================================

const express = require('express');
const router  = express.Router();


// ============================================================
//  GET /api/service/:carId
//  Get all service entries for a specific car
//  Only returns entries belonging to the logged in user
// ============================================================
router.get('/:carId', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.carId;

  try {
    // ── Verify car belongs to this user ───────────────────────
    const carCheck = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // ── Get all service entries for this car ──────────────────
    const result = await db.query(
      `SELECT
        id,
        car_id,
        service_date AS date,
        odometer_km  AS km,
        amount,
        remarks,
        created_at
       FROM service_entries
       WHERE car_id = $1 AND user_id = $2
       ORDER BY service_date ASC, created_at ASC`,
      [carId, userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Get service entries error:', err.message);
    res.status(500).json({ error: 'Failed to fetch service entries' });
  }
});


// ============================================================
//  POST /api/service
//  Add a new service entry
// ============================================================
router.post('/', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;

  const { id, car_id, date, km, amount, remarks } = req.body;

  if (!car_id || !date || !amount) {
    return res.status(400).json({
      error: 'car_id, date and amount are required',
    });
  }

  try {
    // ── Verify car belongs to this user ───────────────────────
    const carCheck = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [car_id, userId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // ── Insert service entry ──────────────────────────────────
    const result = await db.query(
      `INSERT INTO service_entries
        (id, car_id, service_date, odometer_km,
         amount, remarks, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING
        id,
        car_id,
        service_date AS date,
        odometer_km  AS km,
        amount,
        remarks`,
      [
        id || ('sv' + Date.now()),
        car_id,
        date,
        km      || null,
        amount,
        remarks || '',
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Add service entry error:', err.message);
    res.status(500).json({ error: 'Failed to add service entry' });
  }
});


// ============================================================
//  PATCH /api/service/:id
//  Update a service entry
//  Only if it belongs to the logged in user
// ============================================================
router.patch('/:id', async (req, res) => {
  const db      = req.app.locals.db;
  const userId  = req.user.userId;
  const entryId = req.params.id;

  const { date, km, amount, remarks } = req.body;

  try {
    // ── Verify entry belongs to this user ─────────────────────
    const check = await db.query(
      'SELECT id FROM service_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Service entry not found' });
    }

    const result = await db.query(
      `UPDATE service_entries SET
        service_date = COALESCE($1, service_date),
        odometer_km  = COALESCE($2, odometer_km),
        amount       = COALESCE($3, amount),
        remarks      = COALESCE($4, remarks)
       WHERE id = $5 AND user_id = $6
       RETURNING
        id,
        car_id,
        service_date AS date,
        odometer_km  AS km,
        amount,
        remarks`,
      [
        date    || null,
        km      || null,
        amount  || null,
        remarks || null,
        entryId,
        userId,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update service entry error:', err.message);
    res.status(500).json({ error: 'Failed to update service entry' });
  }
});


// ============================================================
//  DELETE /api/service/:id
//  Delete a service entry
//  Only if it belongs to the logged in user
// ============================================================
router.delete('/:id', async (req, res) => {
  const db      = req.app.locals.db;
  const userId  = req.user.userId;
  const entryId = req.params.id;

  try {
    // ── Verify entry belongs to this user ─────────────────────
    const check = await db.query(
      'SELECT id FROM service_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Service entry not found' });
    }

    await db.query(
      'DELETE FROM service_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    res.json({ message: 'Service entry deleted successfully' });

  } catch (err) {
    console.error('Delete service entry error:', err.message);
    res.status(500).json({ error: 'Failed to delete service entry' });
  }
});


// ── Test route ───────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    message: 'Service route working ✅',
    user:    req.user,
  });
});


module.exports = router;
