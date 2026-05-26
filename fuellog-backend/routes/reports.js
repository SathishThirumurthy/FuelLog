// ============================================================
//  FuelLog Backend — routes/reports.js
//  All routes protected by auth middleware
//  All data filtered by req.user.userId
// ============================================================

const express = require('express');
const router  = express.Router();


// ============================================================
//  GET /api/reports/summary/:carId
//  Overall summary stats for a car
//  Used by Dashboard stats cards
// ============================================================
router.get('/summary/:carId', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.carId;

  try {
    // Verify car belongs to this user
    const carCheck = await db.query(
      'SELECT id, name FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Fuel summary
    const fuelSummary = await db.query(
      `SELECT
        COUNT(*)                          AS total_fillups,
        ROUND(SUM(fuel_qty)::NUMERIC, 1)  AS total_fuel,
        ROUND(SUM(amount)::NUMERIC, 0)    AS total_fuel_spend,
        ROUND(AVG(mileage)::NUMERIC, 2)   AS avg_mileage,
        MAX(odometer_km)                  AS max_odometer,
        MIN(odometer_km)                  AS min_odometer,
        AVG(CASE WHEN price_per_unit > 0
            THEN price_per_unit END)      AS avg_price
       FROM fuel_entries
       WHERE car_id = $1 AND user_id = $2`,
      [carId, userId]
    );

    // Service summary
    const svcSummary = await db.query(
      `SELECT
        COUNT(*)                         AS total_services,
        ROUND(SUM(amount)::NUMERIC, 0)   AS total_svc_spend
       FROM service_entries
       WHERE car_id = $1 AND user_id = $2`,
      [carId, userId]
    );

    // Latest fuel entry
    const latestFuel = await db.query(
      `SELECT
        price_per_unit AS latest_price,
        odometer_km    AS latest_odometer,
        entry_date     AS latest_date
       FROM fuel_entries
       WHERE car_id = $1 AND user_id = $2
         AND price_per_unit > 0
       ORDER BY entry_date DESC
       LIMIT 1`,
      [carId, userId]
    );

    const fuel = fuelSummary.rows[0];
    const svc  = svcSummary.rows[0];
    const last = latestFuel.rows[0] || {};

    const totalDist      = (fuel.max_odometer - fuel.min_odometer) || 0;
    const totalFuelSpend = parseFloat(fuel.total_fuel_spend) || 0;
    const totalSvcSpend  = parseFloat(svc.total_svc_spend)   || 0;
    const totalSpend     = totalFuelSpend + totalSvcSpend;
    const costPerKm      = totalDist > 0
      ? (totalSpend / totalDist).toFixed(2)
      : null;

    res.json({
      car_id:           carId,
      car_name:         carCheck.rows[0].name,
      total_fillups:    parseInt(fuel.total_fillups)     || 0,
      total_fuel:       parseFloat(fuel.total_fuel)      || 0,
      total_distance:   totalDist,
      total_fuel_spend: totalFuelSpend,
      total_svc_spend:  totalSvcSpend,
      total_spend:      totalSpend,
      avg_mileage:      parseFloat(fuel.avg_mileage)     || 0,
      avg_price:        parseFloat(fuel.avg_price)       || 0,
      latest_price:     parseFloat(last.latest_price)    || 0,
      latest_odometer:  parseFloat(last.latest_odometer) || 0,
      latest_date:      last.latest_date                 || null,
      total_services:   parseInt(svc.total_services)     || 0,
      cost_per_km:      costPerKm ? parseFloat(costPerKm) : null,
    });

  } catch (err) {
    console.error('Summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});


// ============================================================
//  GET /api/reports/yearly/:carId
//  Yearly breakdown of fuel and service data
// ============================================================
router.get('/yearly/:carId', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.carId;

  try {
    const carCheck = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Yearly fuel data
    const yearlyFuel = await db.query(
      `SELECT
        EXTRACT(YEAR FROM entry_date)::INT     AS year,
        COUNT(*)                               AS fillups,
        ROUND(SUM(fuel_qty)::NUMERIC, 1)       AS total_fuel,
        ROUND(SUM(amount)::NUMERIC, 0)         AS total_spend,
        ROUND(AVG(mileage)::NUMERIC, 2)        AS avg_mileage,
        ROUND(AVG(price_per_unit)::NUMERIC, 2) AS avg_price,
        MAX(odometer_km)                       AS max_odometer,
        MIN(odometer_km)                       AS min_odometer
       FROM fuel_entries
       WHERE car_id = $1 AND user_id = $2
       GROUP BY EXTRACT(YEAR FROM entry_date)
       ORDER BY year ASC`,
      [carId, userId]
    );

    // Yearly service data
    const yearlyService = await db.query(
      `SELECT
        EXTRACT(YEAR FROM service_date)::INT  AS year,
        COUNT(*)                              AS services,
        ROUND(SUM(amount)::NUMERIC, 0)        AS total_svc_spend
       FROM service_entries
       WHERE car_id = $1 AND user_id = $2
       GROUP BY EXTRACT(YEAR FROM service_date)
       ORDER BY year ASC`,
      [carId, userId]
    );

    // Merge fuel and service by year
    const svcByYear = {};
    yearlyService.rows.forEach(row => {
      svcByYear[row.year] = row;
    });

    const combined = yearlyFuel.rows.map(row => {
      const svc       = svcByYear[row.year] || {};
      const dist      = (row.max_odometer - row.min_odometer) || 0;
      const fuelSpend = parseFloat(row.total_spend)      || 0;
      const svcSpend  = parseFloat(svc.total_svc_spend)  || 0;

      return {
        year:           row.year,
        fillups:        parseInt(row.fillups)       || 0,
        total_fuel:     parseFloat(row.total_fuel)  || 0,
        total_distance: dist,
        fuel_spend:     fuelSpend,
        svc_spend:      svcSpend,
        total_spend:    fuelSpend + svcSpend,
        avg_mileage:    parseFloat(row.avg_mileage) || 0,
        avg_price:      parseFloat(row.avg_price)   || 0,
        services:       parseInt(svc.services)      || 0,
      };
    });

    res.json(combined);

  } catch (err) {
    console.error('Yearly report error:', err.message);
    res.status(500).json({ error: 'Failed to fetch yearly report' });
  }
});


// ============================================================
//  GET /api/reports/monthly/:carId
//  Monthly fuel spend data for Dashboard chart
// ============================================================
router.get('/monthly/:carId', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.carId;

  try {
    const carCheck = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const result = await db.query(
      `SELECT
        TO_CHAR(entry_date, 'YYYY-MM')    AS month,
        ROUND(SUM(amount)::NUMERIC, 0)    AS total_spend,
        ROUND(SUM(fuel_qty)::NUMERIC, 1)  AS total_fuel,
        COUNT(*)                          AS fillups,
        ROUND(AVG(mileage)::NUMERIC, 2)   AS avg_mileage
       FROM fuel_entries
       WHERE car_id = $1 AND user_id = $2
         AND amount IS NOT NULL
       GROUP BY TO_CHAR(entry_date, 'YYYY-MM')
       ORDER BY month ASC`,
      [carId, userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Monthly report error:', err.message);
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
});


// ============================================================
//  GET /api/reports/stations/:carId
//  Top fuel stations by visit count
// ============================================================
router.get('/stations/:carId', async (req, res) => {
  const db     = req.app.locals.db;
  const userId = req.user.userId;
  const carId  = req.params.carId;

  try {
    const carCheck = await db.query(
      'SELECT id FROM cars WHERE id = $1 AND user_id = $2',
      [carId, userId]
    );

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const result = await db.query(
      `SELECT
        place,
        COUNT(*)                               AS visit_count,
        ROUND(SUM(amount)::NUMERIC, 0)         AS total_spend,
        ROUND(AVG(mileage)::NUMERIC, 2)        AS avg_mileage,
        ROUND(AVG(price_per_unit)::NUMERIC, 2) AS avg_price
       FROM fuel_entries
       WHERE car_id = $1 AND user_id = $2
         AND place IS NOT NULL AND place <> ''
       GROUP BY place
       ORDER BY visit_count DESC
       LIMIT 10`,
      [carId, userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Stations report error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stations report' });
  }
});


// Test route
router.get('/test', (req, res) => {
  res.json({
    message: 'Reports route working ✅',
    user:    req.user,
  });
});


module.exports = router;
