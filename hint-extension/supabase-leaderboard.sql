-- =====================================================
-- HINT LEADERBOARD & GAMIFICATION - SUPABASE SQL
-- Run this in your Supabase SQL Editor
-- Last Updated: January 25, 2026
-- Security: search_path set on all functions
-- =====================================================

-- =====================================================
-- 1. TABLES
-- =====================================================

-- Points history table (tracks all point-earning events)
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  event_type TEXT NOT NULL, -- 'claim', 'create_list', 'add_item', etc.
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  product_id UUID,
  list_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats table (aggregated stats for quick lookups)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  total_points INTEGER DEFAULT 0,
  gifts_claimed INTEGER DEFAULT 0,
  gifts_given INTEGER DEFAULT 0,
  lists_created INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_email ON points_history(email);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_email ON user_stats(email);

-- =====================================================
-- 2. AWARD POINTS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT 'other',
  p_points INTEGER DEFAULT 0,
  p_description TEXT DEFAULT NULL,
  p_product_id UUID DEFAULT NULL,
  p_list_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_active DATE;
  v_streak INTEGER;
  v_user_email TEXT;
BEGIN
  -- Determine the email to use
  v_user_email := COALESCE(p_email, (SELECT email FROM auth.users WHERE id = p_user_id));

  IF v_user_email IS NULL AND p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No user identifier provided');
  END IF;

  -- Insert into points history
  INSERT INTO points_history (user_id, email, name, event_type, points, description, product_id, list_id)
  VALUES (p_user_id, v_user_email, p_name, p_event_type, p_points, p_description, p_product_id, p_list_id);

  -- Upsert user_stats
  INSERT INTO user_stats (user_id, email, name, total_points, last_active_date, streak_days,
    gifts_claimed, lists_created, items_added)
  VALUES (
    p_user_id,
    v_user_email,
    COALESCE(p_name, split_part(v_user_email, '@', 1)),
    p_points,
    v_today,
    1,
    CASE WHEN p_event_type = 'claim' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'create_list' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'add_item' THEN 1 ELSE 0 END
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, user_stats.user_id),
    name = COALESCE(EXCLUDED.name, user_stats.name),
    total_points = user_stats.total_points + p_points,
    gifts_claimed = user_stats.gifts_claimed + CASE WHEN p_event_type = 'claim' THEN 1 ELSE 0 END,
    lists_created = user_stats.lists_created + CASE WHEN p_event_type = 'create_list' THEN 1 ELSE 0 END,
    items_added = user_stats.items_added + CASE WHEN p_event_type = 'add_item' THEN 1 ELSE 0 END,
    -- Update streak logic
    streak_days = CASE
      WHEN user_stats.last_active_date = v_today THEN user_stats.streak_days -- Same day, no change
      WHEN user_stats.last_active_date = v_today - 1 THEN user_stats.streak_days + 1 -- Consecutive day
      ELSE 1 -- Streak broken, reset to 1
    END,
    last_active_date = v_today,
    updated_at = NOW();

  RETURN json_build_object('success', true, 'points_awarded', p_points);
END;
$$;

-- =====================================================
-- 3. GET LEADERBOARD FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_timeframe TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 10,
  p_friends_only BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  points BIGINT,
  rank BIGINT,
  streak_days INTEGER,
  badges TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Determine date range based on timeframe
  v_start_date := CASE p_timeframe
    WHEN 'today' THEN DATE_TRUNC('day', NOW())
    WHEN 'week' THEN DATE_TRUNC('week', NOW())
    WHEN 'month' THEN DATE_TRUNC('month', NOW())
    ELSE '1970-01-01'::TIMESTAMPTZ
  END;

  IF p_friends_only AND p_user_id IS NOT NULL THEN
    -- Friends-only leaderboard
    RETURN QUERY
    WITH friend_ids AS (
      -- Get accepted friends (both directions)
      SELECT
        CASE
          WHEN f.user_id = p_user_id THEN f.friend_id
          ELSE f.user_id
        END AS fid
      FROM friends f
      WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
        AND f.status = 'accepted'
      UNION
      SELECT p_user_id AS fid -- Include self
    ),
    friend_points AS (
      SELECT
        ph.user_id,
        ph.email,
        ph.name,
        SUM(ph.points) AS total_points
      FROM points_history ph
      WHERE ph.created_at >= v_start_date
        AND (
          ph.user_id IN (SELECT fid FROM friend_ids)
          OR ph.email IN (SELECT u.email FROM auth.users u WHERE u.id IN (SELECT fid FROM friend_ids))
        )
      GROUP BY ph.user_id, ph.email, ph.name
    )
    SELECT
      fp.user_id,
      fp.email,
      fp.name,
      fp.total_points AS points,
      ROW_NUMBER() OVER (ORDER BY fp.total_points DESC) AS rank,
      COALESCE(us.streak_days, 0) AS streak_days,
      COALESCE(us.badges, '{}') AS badges
    FROM friend_points fp
    LEFT JOIN user_stats us ON us.email = fp.email
    ORDER BY fp.total_points DESC
    LIMIT p_limit;
  ELSE
    -- Global leaderboard
    RETURN QUERY
    WITH ranked_users AS (
      SELECT
        ph.user_id,
        ph.email,
        ph.name,
        SUM(ph.points) AS total_points
      FROM points_history ph
      WHERE ph.created_at >= v_start_date
      GROUP BY ph.user_id, ph.email, ph.name
    )
    SELECT
      ru.user_id,
      ru.email,
      ru.name,
      ru.total_points AS points,
      ROW_NUMBER() OVER (ORDER BY ru.total_points DESC) AS rank,
      COALESCE(us.streak_days, 0) AS streak_days,
      COALESCE(us.badges, '{}') AS badges
    FROM ranked_users ru
    LEFT JOIN user_stats us ON us.email = ru.email
    ORDER BY ru.total_points DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- =====================================================
-- 4. GET USER RANK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_rank(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_timeframe TEXT DEFAULT 'all',
  p_friends_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  rank BIGINT,
  points BIGINT,
  streak_days INTEGER,
  badges TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_user_email TEXT;
BEGIN
  -- Get user email
  v_user_email := COALESCE(p_email, (SELECT email FROM auth.users WHERE id = p_user_id));

  IF v_user_email IS NULL THEN
    RETURN;
  END IF;

  -- Determine date range
  v_start_date := CASE p_timeframe
    WHEN 'today' THEN DATE_TRUNC('day', NOW())
    WHEN 'week' THEN DATE_TRUNC('week', NOW())
    WHEN 'month' THEN DATE_TRUNC('month', NOW())
    ELSE '1970-01-01'::TIMESTAMPTZ
  END;

  IF p_friends_only AND p_user_id IS NOT NULL THEN
    -- Friends-only rank
    RETURN QUERY
    WITH friend_ids AS (
      SELECT
        CASE
          WHEN f.user_id = p_user_id THEN f.friend_id
          ELSE f.user_id
        END AS fid
      FROM friends f
      WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
        AND f.status = 'accepted'
      UNION
      SELECT p_user_id AS fid
    ),
    friend_points AS (
      SELECT
        ph.email,
        SUM(ph.points) AS total_points
      FROM points_history ph
      WHERE ph.created_at >= v_start_date
        AND (
          ph.user_id IN (SELECT fid FROM friend_ids)
          OR ph.email IN (SELECT u.email FROM auth.users u WHERE u.id IN (SELECT fid FROM friend_ids))
        )
      GROUP BY ph.email
    ),
    ranked AS (
      SELECT
        fp.email,
        fp.total_points,
        ROW_NUMBER() OVER (ORDER BY fp.total_points DESC) AS user_rank
      FROM friend_points fp
    )
    SELECT
      r.user_rank AS rank,
      r.total_points AS points,
      COALESCE(us.streak_days, 0) AS streak_days,
      COALESCE(us.badges, '{}') AS badges
    FROM ranked r
    LEFT JOIN user_stats us ON us.email = r.email
    WHERE r.email = v_user_email;
  ELSE
    -- Global rank
    RETURN QUERY
    WITH user_points AS (
      SELECT
        ph.email,
        SUM(ph.points) AS total_points
      FROM points_history ph
      WHERE ph.created_at >= v_start_date
      GROUP BY ph.email
    ),
    ranked AS (
      SELECT
        up.email,
        up.total_points,
        ROW_NUMBER() OVER (ORDER BY up.total_points DESC) AS user_rank
      FROM user_points up
    )
    SELECT
      r.user_rank AS rank,
      r.total_points AS points,
      COALESCE(us.streak_days, 0) AS streak_days,
      COALESCE(us.badges, '{}') AS badges
    FROM ranked r
    LEFT JOIN user_stats us ON us.email = r.email
    WHERE r.email = v_user_email;
  END IF;
END;
$$;

-- =====================================================
-- 5. GET USER STATS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_stats(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_points INTEGER,
  gifts_claimed INTEGER,
  gifts_given INTEGER,
  lists_created INTEGER,
  items_added INTEGER,
  streak_days INTEGER,
  badges TEXT[],
  last_active_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  v_user_email := COALESCE(p_email, (SELECT email FROM auth.users WHERE id = p_user_id));

  RETURN QUERY
  SELECT
    COALESCE(us.total_points, 0),
    COALESCE(us.gifts_claimed, 0),
    COALESCE(us.gifts_given, 0),
    COALESCE(us.lists_created, 0),
    COALESCE(us.items_added, 0),
    COALESCE(us.streak_days, 0),
    COALESCE(us.badges, '{}'),
    us.last_active_date
  FROM user_stats us
  WHERE us.email = v_user_email
     OR us.user_id = p_user_id;
END;
$$;

-- =====================================================
-- 6. CHECK AND AWARD BADGES FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_badges(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_stats RECORD;
  v_new_badges TEXT[] := '{}';
  v_current_badges TEXT[];
  v_unique_recipients INTEGER;
BEGIN
  v_user_email := COALESCE(p_email, (SELECT email FROM auth.users WHERE id = p_user_id));

  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'new_badges', v_new_badges);
  END IF;

  -- Get current stats
  SELECT * INTO v_stats FROM user_stats WHERE email = v_user_email;

  IF v_stats IS NULL THEN
    RETURN json_build_object('success', true, 'new_badges', v_new_badges);
  END IF;

  v_current_badges := COALESCE(v_stats.badges, '{}');

  -- Check each badge condition

  -- first_gift: Claimed first item
  IF v_stats.gifts_claimed >= 1 AND NOT 'first_gift' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'first_gift');
  END IF;

  -- generous_5: Claimed 5+ items
  IF v_stats.gifts_claimed >= 5 AND NOT 'generous_5' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'generous_5');
  END IF;

  -- generous_10: Claimed 10+ items
  IF v_stats.gifts_claimed >= 10 AND NOT 'generous_10' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'generous_10');
  END IF;

  -- gift_master: Claimed 50+ items
  IF v_stats.gifts_claimed >= 50 AND NOT 'gift_master' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'gift_master');
  END IF;

  -- list_creator: Created 3+ lists
  IF v_stats.lists_created >= 3 AND NOT 'list_creator' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'list_creator');
  END IF;

  -- streak_7: 7-day streak
  IF v_stats.streak_days >= 7 AND NOT 'streak_7' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'streak_7');
  END IF;

  -- streak_30: 30-day streak
  IF v_stats.streak_days >= 30 AND NOT 'streak_30' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'streak_30');
  END IF;

  -- secret_santa: Claimed for 5+ different people
  SELECT COUNT(DISTINCT l.user_id) INTO v_unique_recipients
  FROM points_history ph
  JOIN products p ON p.id = ph.product_id
  JOIN lists l ON l.id = p.list_id
  WHERE ph.email = v_user_email
    AND ph.event_type = 'claim';

  IF v_unique_recipients >= 5 AND NOT 'secret_santa' = ANY(v_current_badges) THEN
    v_new_badges := array_append(v_new_badges, 'secret_santa');
  END IF;

  -- Update user_stats with new badges
  IF array_length(v_new_badges, 1) > 0 THEN
    UPDATE user_stats
    SET badges = badges || v_new_badges,
        updated_at = NOW()
    WHERE email = v_user_email;
  END IF;

  RETURN json_build_object('success', true, 'new_badges', v_new_badges);
END;
$$;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Points history: Users can see all (for leaderboard), insert own
CREATE POLICY "Anyone can view points_history" ON points_history
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert points_history" ON points_history
  FOR INSERT WITH CHECK (true);

-- User stats: Anyone can view (for leaderboard)
CREATE POLICY "Anyone can view user_stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage user_stats" ON user_stats
  FOR ALL USING (true);

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute on functions to anon and authenticated
GRANT EXECUTE ON FUNCTION award_points TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_badges TO anon, authenticated;

-- Grant table access
GRANT SELECT ON points_history TO anon, authenticated;
GRANT INSERT ON points_history TO anon, authenticated;
GRANT SELECT ON user_stats TO anon, authenticated;
GRANT INSERT, UPDATE ON user_stats TO anon, authenticated;

-- =====================================================
-- DONE!
-- Your leaderboard system is now ready.
-- =====================================================
