-- =====================================================
-- PUBLIC HINTLIST ACCESS - SUPABASE SQL
-- Allows anonymous users to view public hintlists via access code
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Function to get a public hintlist by access code (for web viewer)
CREATE OR REPLACE FUNCTION get_public_hintlist(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_list RECORD;
  v_products JSON;
BEGIN
  -- Normalize the code to uppercase
  p_code := UPPER(TRIM(p_code));

  -- Find the list by access_code or share_code
  SELECT * INTO v_list
  FROM lists
  WHERE (access_code = p_code OR share_code = p_code)
    AND is_public = true
  LIMIT 1;

  -- Return error if not found
  IF v_list IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Hintlist not found or not public'
    );
  END IF;

  -- Get products for this list
  SELECT json_agg(row_to_json(p))
  INTO v_products
  FROM (
    SELECT
      id,
      list_id,
      name,
      url,
      image_url,
      current_price,
      target_price,
      notes,
      claimed_by,
      guest_claimer_name,
      guest_claimer_email,
      claimed_at,
      created_at
    FROM products
    WHERE list_id = v_list.id
    ORDER BY created_at DESC
  ) p;

  -- Return the list and products
  RETURN json_build_object(
    'success', true,
    'list', json_build_object(
      'id', v_list.id,
      'name', v_list.name,
      'user_id', v_list.user_id,
      'is_public', v_list.is_public,
      'access_code', v_list.access_code,
      'share_code', v_list.share_code,
      'key_date', v_list.key_date,
      'notification_level', v_list.notification_level,
      'created_at', v_list.created_at
    ),
    'products', COALESCE(v_products, '[]'::json)
  );
END;
$$;

-- Grant execute to anonymous users
GRANT EXECUTE ON FUNCTION get_public_hintlist TO anon, authenticated;

-- =====================================================
-- GUEST CLAIM FUNCTION (for web viewer claiming)
-- =====================================================

-- Function to claim a product as a guest
CREATE OR REPLACE FUNCTION guest_claim_product(
  p_product_id UUID,
  p_claimer_name TEXT,
  p_claimer_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_unclaim_token TEXT;
BEGIN
  -- Validate inputs
  IF p_product_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Product ID required');
  END IF;

  IF TRIM(p_claimer_name) = '' OR p_claimer_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Name required');
  END IF;

  IF TRIM(p_claimer_email) = '' OR p_claimer_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Email required');
  END IF;

  -- Check if product exists and is not already claimed
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;

  IF v_product IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_product.claimed_by IS NOT NULL OR v_product.guest_claimer_email IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Product already claimed');
  END IF;

  -- Check if the list is public
  IF NOT EXISTS (
    SELECT 1 FROM lists
    WHERE id = v_product.list_id AND is_public = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'List is not public');
  END IF;

  -- Generate unclaim token
  v_unclaim_token := encode(gen_random_bytes(24), 'base64');
  v_unclaim_token := replace(replace(v_unclaim_token, '+', ''), '/', '');

  -- Update the product
  UPDATE products
  SET
    guest_claimer_name = TRIM(p_claimer_name),
    guest_claimer_email = LOWER(TRIM(p_claimer_email)),
    claimed_at = NOW(),
    unclaim_token = v_unclaim_token
  WHERE id = p_product_id;

  RETURN json_build_object(
    'success', true,
    'unclaim_token', v_unclaim_token
  );
END;
$$;

-- Grant execute to anonymous users
GRANT EXECUTE ON FUNCTION guest_claim_product TO anon, authenticated;
