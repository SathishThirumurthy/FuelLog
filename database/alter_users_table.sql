-- ============================================================
--  FuelLog Database Migration
--  File: alter_users_table.sql
--  Description: Update users table for proper authentication
--               - Remove hardcoded username column
--               - Add email as primary identifier
--               - Add status for email verification
--               - Add verify_token for email verification link
--  Run this in TablePlus against the Sathish database
--  Date: 2025
-- ============================================================


-- ── STEP 1: Drop old username column (no longer needed) ────
ALTER TABLE users DROP COLUMN IF EXISTS username;


-- ── STEP 2: Add email as primary login identifier ──────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE;


-- ── STEP 3: Add status column ──────────────────────────────
--  'pending'  = registered but email not yet verified
--  'verified' = email verified, can log in
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';


-- ── STEP 4: Add email verification token column ────────────
--  Stores a UUID token sent in the verification email link
--  Cleared to NULL once the user verifies their email
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token VARCHAR(255);


-- ── STEP 5: Verify the final table structure ───────────────
SELECT
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;


-- ============================================================
--  EXPECTED RESULT AFTER RUNNING:
--
--  column_name    | data_type | max_length | default   | nullable
--  ---------------+-----------+------------+-----------+---------
--  id             | integer   |            | auto      | NO
--  password_hash  | varchar   | 255        |           | YES
--  created_at     | timestamp |            | now()     | YES
--  last_login     | timestamp |            |           | YES
--  email          | varchar   | 100        |           | YES
--  status         | varchar   | 20         | 'pending' | YES
--  verify_token   | varchar   | 255        |           | YES
--
-- ============================================================
