-- =====================================================
-- PRICE ALERTS - SUPABASE SQL
-- Run this in your Supabase SQL Editor
-- Last Updated: January 25, 2026
-- Security: auth.users exposure removed, search_path set
-- =====================================================

-- Add target_price column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2) DEFAULT NULL;

-- Add index for quick lookups of products with alerts
CREATE INDEX IF NOT EXISTS idx_products_target_price
ON products(target_price)
WHERE target_price IS NOT NULL;

-- View for products with active alerts
-- NOTE: owner_email removed to avoid exposing auth.users to anon
-- Look up email via service role in edge function instead
DROP VIEW IF EXISTS products_with_alerts;
CREATE VIEW products_with_alerts
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.list_id,
  p.name,
  p.url,
  p.current_price,
  p.last_checked,
  p.claimed_by,
  p.claimed_at,
  p.created_at,
  p.guest_claimer_name,
  p.guest_claimer_email,
  p.image_url,
  p.in_stock,
  p.last_price_check,
  p.unclaim_token,
  p.target_price,
  l.user_id AS owner_id,
  l.name AS list_name
FROM products p
JOIN lists l ON l.id = p.list_id
WHERE p.target_price IS NOT NULL
  AND p.target_price > 0
  AND p.current_price IS NOT NULL;

-- Restrict access (authenticated only, not anon)
GRANT SELECT ON products_with_alerts TO authenticated;
REVOKE ALL ON products_with_alerts FROM anon;

-- Function to check price alerts and return triggered ones
-- NOTE: Returns owner_id instead of owner_email for security
-- Look up email via service role in edge function
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_url TEXT,
  current_price DECIMAL,
  target_price DECIMAL,
  owner_id UUID,
  list_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.url as product_url,
    p.current_price,
    p.target_price,
    l.user_id as owner_id,
    l.name as list_name
  FROM products p
  JOIN lists l ON l.id = p.list_id
  WHERE p.target_price IS NOT NULL
    AND p.target_price > 0
    AND p.current_price IS NOT NULL
    AND p.current_price <= p.target_price;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_price_alerts TO anon, authenticated;

-- =====================================================
-- DONE!
-- Your price alerts are now ready.
-- =====================================================
