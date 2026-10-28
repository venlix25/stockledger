-- ============================================================
-- StockLedger Fix Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. REMOVE DUPLICATE CUSTOMERS
-- Keeps the OLDEST record for each (user_id, name) pair and deletes the rest
DELETE FROM customers
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, LOWER(name)) id
  FROM customers
  ORDER BY user_id, LOWER(name), created_at ASC
);

-- 2. FIX orders table plan constraint (allow 'quarterly')
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_check;
ALTER TABLE orders ADD CONSTRAINT orders_plan_check
  CHECK (plan IN ('quarterly', 'yearly'));

-- 3. FIX subscriptions table plan constraint (allow 'quarterly')
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('quarterly', 'yearly'));

-- 4. ADD UNIQUE constraint on customers to prevent future duplicates
-- (per user, case-insensitive name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_name_per_user
  ON customers (user_id, LOWER(name));

-- 5. PERFORMANCE: ensure key indexes exist
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- Done!
SELECT 'Migration complete' AS status;
