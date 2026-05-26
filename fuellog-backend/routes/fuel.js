// ============================================================
//  FuelLog Backend — routes/fuel.js
//  All routes protected by auth middleware
//  All data filtered by req.user.userId
// ============================================================

const express = require('express');
const router  = express.Router();


// ============================================================
//  GET /api/fuel/:carId
//  Get all fuel entries for a specific car
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

    // ── Get all fuel entries for this car ─────────────────────
    const result = await db.query(
      `SELECT
        id,
        car_id,
        entry_date  AS date,
        odometer_km AS km,
        fuel_qty    AS fuel,
        price_per_unit AS price,
        distance_km AS total_km,
        mileage,
        amount,
        place,
        created_at
       FROM fuel_entries
       WHERE car_id = $1 AND user_id = $2
       ORDER BY entry_date ASC, created_at ASC`,
      [carId, userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Get fuel entries error:', err.message);
    res.status(500).json({ error: 'Failed to fetch fuel entries' });
  }
});


// ============================================================
//  POST /api/fuel
//  Add a new fuel entry
// ============================================================
router.post('/', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;

  const {
    id, car_id, date, km, fuel,
    price, total_km, mileage, amount, place,
  } = req.body;

  if (!car_id || !date || !km || !fuel) {
    return res.status(400).json({
      error: 'car_id, date, km and fuel are required',
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

    // ── Insert fuel entry ─────────────────────────────────────
    const result = await db.query(
      `INSERT INTO fuel_entries
        (id, car_id, entry_date, odometer_km, fuel_qty,
         price_per_unit, distance_km, mileage, amount, place,
         user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING
        id,
        car_id,
        entry_date  AS date,
        odometer_km AS km,
        fuel_qty    AS fuel,
        price_per_unit AS price,
        distance_km AS total_km,
        mileage,
        amount,
        place`,
      [
        id || ('e' + Date.now()),
        car_id,
        date,
        km,
        fuel,
        price   || 0,
        total_km || null,
        mileage  || null,
        amount   || null,
        place    || '',
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Add fuel entry error:', err.message);
    res.status(500).json({ error: 'Failed to add fuel entry' });
  }
});


// ============================================================
//  PATCH /api/fuel/:id
//  Update a fuel entry
//  Only if it belongs to the logged in user
// ============================================================
router.patch('/:id', async (req, res) => {
  const db      = req.app.locals.db;
  const userId  = req.user.userId;
  const entryId = req.params.id;

  const {
    date, km, fuel, price,
    total_km, mileage, amount, place,
  } = req.body;

  try {
    // ── Verify entry belongs to this user ─────────────────────
    const check = await db.query(
      'SELECT id FROM fuel_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Fuel entry not found' });
    }

    const result = await db.query(
      `UPDATE fuel_entries SET
        entry_date     = COALESCE($1, entry_date),
        odometer_km    = COALESCE($2, odometer_km),
        fuel_qty       = COALESCE($3, fuel_qty),
        price_per_unit = COALESCE($4, price_per_unit),
        distance_km    = COALESCE($5, distance_km),
        mileage        = COALESCE($6, mileage),
        amount         = COALESCE($7, amount),
        place          = COALESCE($8, place)
       WHERE id = $9 AND user_id = $10
       RETURNING
        id,
        car_id,
        entry_date     AS date,
        odometer_km    AS km,
        fuel_qty       AS fuel,
        price_per_unit AS price,
        distance_km    AS total_km,
        mileage,
        amount,
        place`,
      [
        date    || null,
        km      || null,
        fuel    || null,
        price   || null,
        total_km || null,
        mileage  || null,
        amount   || null,
        place   || null,
        entryId,
        userId,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update fuel entry error:', err.message);
    res.status(500).json({ error: 'Failed to update fuel entry' });
  }
});


// ============================================================
//  DELETE /api/fuel/:id
//  Delete a fuel entry
//  Only if it belongs to the logged in user
// ============================================================
router.delete('/:id', async (req, res) => {
  const db      = req.app.locals.db;
  const userId  = req.user.userId;
  const entryId = req.params.id;

  try {
    // ── Verify entry belongs to this user ─────────────────────
    const check = await db.query(
      'SELECT id FROM fuel_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Fuel entry not found' });
    }

    await db.query(
      'DELETE FROM fuel_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    res.json({ message: 'Fuel entry deleted successfully' });

  } catch (err) {
    console.error('Delete fuel entry error:', err.message);
    res.status(500).json({ error: 'Failed to delete fuel entry' });
  }
});


// ── Test route ───────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    message: 'Fuel route working ✅',
    user:    req.user,
  });
});


module.exports = router;
