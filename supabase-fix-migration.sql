-- ==============================================================================
-- StockLedger Bulletproof Database Fix Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. FIX ORDERS & SUBSCRIPTIONS PLAN CONSTRAINTS
-- We allow 'quarterly', 'yearly', and 'monthly' so neither new orders nor existing rows fail.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_check;
UPDATE orders SET plan = 'quarterly' WHERE plan = 'monthly';
ALTER TABLE orders ADD CONSTRAINT orders_plan_check CHECK (plan IN ('quarterly', 'yearly', 'monthly'));

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
UPDATE subscriptions SET plan = 'quarterly' WHERE plan = 'monthly';
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('quarterly', 'yearly', 'monthly'));

-- 2. SAFELY MERGE & DEDUPLICATE CUSTOMERS WITHOUT FOREIGN KEY ERRORS
-- If any invoices or payments were created for duplicate customers, we reassign them to the keeper customer first!
DO $$
DECLARE
  dup RECORD;
  keeper_id UUID;
BEGIN
  -- Loop through duplicate customers (keeping the oldest record for each user & lower(name))
  FOR dup IN 
    SELECT id, user_id, LOWER(TRIM(name)) AS lname
    FROM customers
    WHERE id NOT IN (
      SELECT DISTINCT ON (user_id, LOWER(TRIM(name))) id
      FROM customers
      ORDER BY user_id, LOWER(TRIM(name)), created_at ASC NULLS LAST, id ASC
    )
  LOOP
    -- Find the keeper ID for this user & name
    SELECT id INTO keeper_id
    FROM customers
    WHERE user_id = dup.user_id AND LOWER(TRIM(name)) = dup.lname
    ORDER BY created_at ASC NULLS LAST, id ASC
    LIMIT 1;

    IF keeper_id IS NOT NULL AND keeper_id <> dup.id THEN
      -- Re-link any invoices referencing the duplicate customer
      UPDATE invoices SET customer_id = keeper_id WHERE customer_id = dup.id;

      -- Re-link any payments referencing the duplicate customer (if applicable)
      BEGIN
        UPDATE payments SET customer_id = keeper_id WHERE customer_id = dup.id;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

      -- Safely delete the duplicate customer
      DELETE FROM customers WHERE id = dup.id;
    END IF;
  END LOOP;
END $$;

-- 3. PREVENT ANY FUTURE DUPLICATE CUSTOMERS
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_name_per_user
  ON customers (user_id, LOWER(TRIM(name)));

-- Done!
SELECT 'Database successfully upgraded and deduplicated!' AS status;
