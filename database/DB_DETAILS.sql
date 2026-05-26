-- ============================================================
--  FuelLog — Database Details
--  File: database/DB_DETAILS.sql
--  Database: PostgreSQL (local)
--  DB Name: Sathish
-- ============================================================


-- ── VERIFY ALL TABLES EXIST ──────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- ── USERS TABLE STRUCTURE ────────────────────────────────────
SELECT column_name, data_type, character_maximum_length,
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ── CARS TABLE STRUCTURE ─────────────────────────────────────
SELECT column_name, data_type, character_maximum_length,
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'cars'
ORDER BY ordinal_position;

-- ── FUEL_ENTRIES TABLE STRUCTURE ─────────────────────────────
SELECT column_name, data_type, character_maximum_length,
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'fuel_entries'
ORDER BY ordinal_position;

-- ── SERVICE_ENTRIES TABLE STRUCTURE ──────────────────────────
SELECT column_name, data_type, character_maximum_length,
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_entries'
ORDER BY ordinal_position;


-- ── RECORD COUNTS ────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM users)           AS total_users,
  (SELECT COUNT(*) FROM cars)            AS total_cars,
  (SELECT COUNT(*) FROM fuel_entries)    AS total_fuel_entries,
  (SELECT COUNT(*) FROM service_entries) AS total_service_entries;


-- ── USERS (no passwords shown) ───────────────────────────────
SELECT id, email, status, created_at, last_login
FROM users
ORDER BY id;


-- ── CARS WITH OWNER ──────────────────────────────────────────
SELECT
  c.id, c.name, c.country, c.active,
  c.purchased, c.sold, c.user_id,
  u.email AS owner_email
FROM cars c
LEFT JOIN users u ON u.id = c.user_id
ORDER BY c.created_at;


-- ── FUEL ENTRIES COUNT PER CAR PER USER ──────────────────────
SELECT
  u.email,
  c.name  AS car_name,
  COUNT(f.id) AS fuel_entries
FROM fuel_entries f
JOIN cars  c ON c.id  = f.car_id
JOIN users u ON u.id  = f.user_id
GROUP BY u.email, c.name
ORDER BY u.email, c.name;


-- ── SERVICE ENTRIES COUNT PER CAR PER USER ───────────────────
SELECT
  u.email,
  c.name  AS car_name,
  COUNT(s.id) AS service_entries
FROM service_entries s
JOIN cars  c ON c.id  = s.car_id
JOIN users u ON u.id  = s.user_id
GROUP BY u.email, c.name
ORDER BY u.email, c.name;


-- ── INDEXES ──────────────────────────────────────────────────
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ── FOREIGN KEYS ─────────────────────────────────────────────
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage  AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;


-- ============================================================
--  CURRENT DATABASE STATE (as of project completion):
--
--  users           → 1+ users registered
--  cars            → 1 car (Maruti Baleno, id='baleno')
--  fuel_entries    → 289 entries (2016-2025)
--  service_entries → 35 entries  (2016-2025)
--
--  All data linked to first registered user via user_id
--
--  MIGRATIONS APPLIED:
--  1. fuellog_schema_and_data.sql  ← original schema + data
--  2. alter_users_table.sql        ← added email, status, verify_token
--  3. add_user_id_to_tables.sql    ← added user_id to all tables
-- ============================================================
