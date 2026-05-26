// ============================================================
//  FuelLog Backend — routes/cars.js
//  All routes protected by auth middleware
//  All data filtered by req.user.userId
// ============================================================

const express = require('express');
const router  = express.Router();


// ============================================================
//  GET /api/cars
//  Get all cars belonging to the logged in user
// ============================================================
router.get('/', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT 
        id, name, country, purchased, sold,
        note, reg, active, created_at
       FROM cars
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Get cars error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});


// ============================================================
//  POST /api/cars
//  Add a new car for the logged in user
// ============================================================
router.post('/', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;

  const { id, name, country, purchased, sold, note, reg, active } = req.body;

  if (!id || !name || !country) {
    return res.status(400).json({ error: 'id, name and country are required' });
  }

  try {
    // ── If setting this car as active, deactivate others ─────
    if (active) {
      await db.query(
        'UPDATE cars SET active = FALSE WHERE user_id = $1',
        [userId]
      );
    }

    const result = await db.query(
      `INSERT INTO cars 
        (id, name, country, purchased, sold, note, reg, active, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [id, name, country, purchased || null, sold || null,
       note || '', reg || '', active || false, userId]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Add car error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A car with this ID already exists' });
    }
    res.status(500).json({ error: 'Failed to add car' });
  }
});


// ============================================================
//  PATCH /api/cars/:id
//  Update a car (only if it belongs to the logged in user)
// ============================================================
router.patch('/:id', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.id;

  const { name, country, purchased, sold, note, reg, active } = req.body;

  try {
    // ── Verify car belongs to this user ───────────────────────
    const check = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // ── If setting active, deactivate all other cars first ────
    if (active) {
      await db.query(
        'UPDATE cars SET active = FALSE WHERE user_id = $1',
        [userId]
      );
    }

    const result = await db.query(
      `UPDATE cars SET
        name      = COALESCE($1, name),
        country   = COALESCE($2, country),
        purchased = COALESCE($3, purchased),
        sold      = COALESCE($4, sold),
        note      = COALESCE($5, note),
        reg       = COALESCE($6, reg),
        active    = COALESCE($7, active)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [name, country, purchased || null, sold || null,
       note, reg, active, carId, userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update car error:', err.message);
    res.status(500).json({ error: 'Failed to update car' });
  }
});


// ============================================================
//  DELETE /api/cars/:id
//  Delete a car (only if it belongs to the logged in user)
//  Cascades to fuel_entries and service_entries
// ============================================================
router.delete('/:id', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.id;

  try {
    // ── Verify car belongs to this user ───────────────────────
    const check = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    await db.query(
      'DELETE FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    res.json({ message: 'Car deleted successfully' });

  } catch (err) {
    console.error('Delete car error:', err.message);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});


// ============================================================
//  PATCH /api/cars/:id/setactive
//  Set a car as the active car for the logged in user
// ============================================================
router.patch('/:id/setactive', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.id;

  try {
    // ── Verify car belongs to this user ───────────────────────
    const check = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // ── Deactivate all cars for this user ─────────────────────
    await db.query(
      'UPDATE cars SET active = FALSE WHERE user_id = $1',
      [userId]
    );

    // ── Set selected car as active ────────────────────────────
    const result = await db.query(
      `UPDATE cars SET active = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [carId, userId]
    );

    res.json({
      message: `${result.rows[0].name} set as active car`,
      car:     result.rows[0],
    });

  } catch (err) {
    console.error('Set active car error:', err.message);
    res.status(500).json({ error: 'Failed to set active car' });
  }
});


// ── Test route ───────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    message: 'Cars route working ✅',
    user:    req.user,
  });
});


module.exports = router;
