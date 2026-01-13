-- =====================================================
-- PRICE ALERTS - SUPABASE SQL
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add target_price column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2) DEFAULT NULL;

-- Add index for quick lookups of products with alerts
CREATE INDEX IF NOT EXISTS idx_products_target_price
ON products(target_price)
WHERE target_price IS NOT NULL;

-- Optional: Create a view for products with active alerts
CREATE OR REPLACE VIEW products_with_alerts AS
SELECT
  p.*,
  l.user_id as owner_id,
  l.name as list_name,
  u.email as owner_email
FROM products p
JOIN lists l ON l.id = p.list_id
LEFT JOIN auth.users u ON u.id = l.user_id
WHERE p.target_price IS NOT NULL
  AND p.target_price > 0
  AND p.current_price IS NOT NULL;

-- Function to check price alerts and return triggered ones
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_url TEXT,
  current_price DECIMAL,
  target_price DECIMAL,
  owner_email TEXT,
  list_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.url as product_url,
    p.current_price,
    p.target_price,
    u.email as owner_email,
    l.name as list_name
  FROM products p
  JOIN lists l ON l.id = p.list_id
  LEFT JOIN auth.users u ON u.id = l.user_id
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
