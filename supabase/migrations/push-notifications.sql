-- Push Notifications Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- User Push Tokens Table
-- Stores OneSignal player IDs linked to users
-- ============================================

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onesignal_player_id TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, onesignal_player_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(user_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own tokens
CREATE POLICY "Users can manage own push tokens" ON user_push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Notification History Table
-- Tracks sent notifications for in-app center
-- ============================================

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'item_claimed', 'price_drop', 'back_in_stock', 'due_date_reminder', 'friend_request'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(user_id) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notification_history
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- RPC Functions
-- ============================================

-- Upsert push token (called on login)
CREATE OR REPLACE FUNCTION upsert_push_token(
  p_player_id TEXT,
  p_device_type TEXT DEFAULT 'ios'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  INSERT INTO user_push_tokens (user_id, onesignal_player_id, device_type, is_active, updated_at)
  VALUES (v_user_id, p_player_id, p_device_type, true, NOW())
  ON CONFLICT (user_id, onesignal_player_id)
  DO UPDATE SET is_active = true, updated_at = NOW();

  RETURN json_build_object('success', true);
END;
$$;

-- Deactivate push token (called on logout)
CREATE OR REPLACE FUNCTION deactivate_push_token(p_player_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_push_tokens
  SET is_active = false, updated_at = NOW()
  WHERE onesignal_player_id = p_player_id
    AND user_id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$;

-- Get user notifications (for notification center)
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  notification_type TEXT,
  title TEXT,
  body TEXT,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nh.id,
    nh.notification_type,
    nh.title,
    nh.body,
    nh.data,
    nh.read_at,
    nh.created_at
  FROM notification_history nh
  WHERE nh.user_id = auth.uid()
  ORDER BY nh.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notification_history
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL;

  RETURN json_build_object('success', true);
END;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notification_history
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;

  RETURN json_build_object('success', true);
END;
$$;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notification_history
  WHERE user_id = auth.uid()
    AND read_at IS NULL;

  RETURN v_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upsert_push_token TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_push_token TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
