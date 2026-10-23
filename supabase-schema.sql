-- ==============================================================================
-- StockLedger Targeted Schema Migration: Orders, Subscriptions & Policies
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/wlmspxenhqbewihwupzo/sql
--
-- This script ONLY creates the 3 missing tables required for payments and legal compliance.
-- It does NOT touch, alter, or drop: customers, invoices, or payments.
-- ==============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Orders Table (Tracks payment checkout orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  amount_usd NUMERIC(10,2) NOT NULL,
  nowpayments_payment_id TEXT,
  nowpayments_order_id TEXT,
  nowpayments_invoice_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT,
  actually_paid NUMERIC,
  pay_currency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscriptions Table (Tracks active user plan and expiration dates)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Policy Acceptances Table (Stores legal consent timestamps)
CREATE TABLE IF NOT EXISTS policy_acceptances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  policy_type TEXT NOT NULL,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Performance Indexes (For fast lookup by user and payment ID)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_nowpayments_payment_id ON orders(nowpayments_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user ON policy_acceptances(user_id);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acceptances ENABLE ROW LEVEL SECURITY;

-- Orders RLS
-- Users can view their own orders and initiate pending orders.
-- Updates to payment status are restricted to server-side webhook operations (service_role).
DROP POLICY IF EXISTS "Users view own orders" ON orders;
DROP POLICY IF EXISTS "Users insert own orders" ON orders;
CREATE POLICY "Users view own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Subscriptions RLS
-- Users can only view their own subscription status.
-- Creating or modifying active subscriptions is restricted to server-side webhook operations (service_role).
DROP POLICY IF EXISTS "Users view own subscriptions" ON subscriptions;
CREATE POLICY "Users view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy Acceptances RLS
-- Users can view and insert their own policy acceptance records.
DROP POLICY IF EXISTS "Users view own acceptances" ON policy_acceptances;
DROP POLICY IF EXISTS "Users insert own acceptances" ON policy_acceptances;
CREATE POLICY "Users view own acceptances" ON policy_acceptances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own acceptances" ON policy_acceptances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
