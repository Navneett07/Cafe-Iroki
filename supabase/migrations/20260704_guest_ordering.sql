-- Migration: Guest Order & Reservation Support
-- Run this in the Supabase SQL Editor (Production & Local)
-- Compatible with the existing schema - no breaking changes

-- ============================================================
-- 1. Add guest fields to orders table
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS guest_name    TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone   TEXT,
  ADD COLUMN IF NOT EXISTS table_number  TEXT,
  ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================
-- 2. Add table_number to reservations (already has guest_name, phone)
-- ============================================================
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS table_number  TEXT,
  ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================
-- 3. RLS Policies for guest orders
-- Allow anyone (including anon) to INSERT orders
-- Guests cannot SELECT / UPDATE / DELETE orders
-- Authenticated users can still SELECT their own orders
-- ============================================================

-- Drop old INSERT policy if it exists
DROP POLICY IF EXISTS "customers_insert_orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- New: Allow any (including anon) to insert
CREATE POLICY "anyone_insert_orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Keep: Authenticated users read their own orders
DROP POLICY IF EXISTS "customers_read_own_orders" ON orders;
CREATE POLICY "customers_read_own_orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Keep: Admin reads all
DROP POLICY IF EXISTS "admin_read_all_orders" ON orders;
CREATE POLICY "admin_read_all_orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Keep: Admin update all
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. RLS Policies for guest reservations
-- ============================================================

DROP POLICY IF EXISTS "customers_insert_reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;

-- Allow anyone (anon and authenticated) to insert reservations
CREATE POLICY "anyone_insert_reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own reservations
DROP POLICY IF EXISTS "customers_read_own_reservations" ON reservations;
CREATE POLICY "customers_read_own_reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can read all reservations
DROP POLICY IF EXISTS "admin_read_all_reservations" ON reservations;
CREATE POLICY "admin_read_all_reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Admin can update all reservations
DROP POLICY IF EXISTS "admin_update_reservations" ON reservations;
CREATE POLICY "admin_update_reservations"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. order_items: allow insert alongside order (service role)
-- ============================================================
DROP POLICY IF EXISTS "service_role_insert_order_items" ON order_items;
-- order_items is inserted via service role in Edge Function - no change needed
