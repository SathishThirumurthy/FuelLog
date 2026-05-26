-- ============================================================
--  FuelLog Database Migration
--  File: add_user_id_to_tables.sql
--  Description: Link cars, fuel_entries and service_entries
--               to users table for proper data isolation
--  Run this in TablePlus against the Sathish database
-- ============================================================


-- ── STEP 1: Add user_id column to cars table ───────────────
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;


-- ── STEP 2: Add user_id column to fuel_entries table ───────
ALTER TABLE fuel_entries 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;


-- ── STEP 3: Add user_id column to service_entries table ────
ALTER TABLE service_entries 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;


-- ── STEP 4: Check the first user's ID ──────────────────────
SELECT id, email, status FROM users ORDER BY id ASC LIMIT 1;


-- ── STEP 5: Assign Baleno car to first user ─────────────────
-- Replace '1' with actual user id from Step 4 if different
UPDATE cars 
SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE id = 'baleno';


-- ── STEP 6: Assign all fuel_entries to first user ───────────
UPDATE fuel_entries 
SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE car_id = 'baleno';


-- ── STEP 7: Assign all service_entries to first user ────────
UPDATE service_entries 
SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE car_id = 'baleno';


-- ── STEP 8: Add indexes for better query performance ────────
CREATE INDEX IF NOT EXISTS idx_cars_user_id 
ON cars(user_id);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_user_id 
ON fuel_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_service_entries_user_id 
ON service_entries(user_id);


-- ── STEP 9: Verify everything looks correct ─────────────────

-- Check cars table
SELECT 
    c.id, 
    c.name, 
    c.user_id,
    u.email AS owner_email
FROM cars c
LEFT JOIN users u ON u.id = c.user_id;

-- Check fuel_entries count per user
SELECT 
    u.email,
    COUNT(f.id) AS fuel_entries_count
FROM fuel_entries f
LEFT JOIN users u ON u.id = f.user_id
GROUP BY u.email;

-- Check service_entries count per user
SELECT 
    u.email,
    COUNT(s.id) AS service_entries_count
FROM service_entries s
LEFT JOIN users u ON u.id = s.user_id
GROUP BY u.email;


-- ============================================================
--  EXPECTED RESULTS:
--
--  Cars: baleno → assigned to your email
--  Fuel entries: 289 rows → assigned to your email
--  Service entries: 35 rows → assigned to your email
-- ============================================================
