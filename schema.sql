-- AMORIO Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING OBJECTS (Clean slate)
-- ============================================
-- Drop tables first (CASCADE handles policies, indexes, constraints)
DROP TABLE IF EXISTS call_rooms CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_friendship(UUID, UUID);
DROP FUNCTION IF EXISTS get_friends(UUID);
DROP FUNCTION IF EXISTS create_or_get_pending_call_room(UUID, UUID);
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false
);

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FRIENDSHIPS TABLE (Mutual connections)
-- ============================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure user1_id < user2_id to prevent duplicates
  CONSTRAINT unique_friendship UNIQUE(user1_id, user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- Index for fast friend lookups
CREATE INDEX idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX idx_friendships_user2 ON friendships(user2_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID REFERENCES friendships(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index for fast message retrieval
CREATE INDEX idx_messages_friendship ON messages(friendship_id, created_at DESC);

-- ============================================
-- CALL ROOMS TABLE (For friend video calls)
-- ============================================
CREATE TABLE call_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID REFERENCES friendships(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Index for active rooms
CREATE INDEX idx_call_rooms_status ON call_rooms(status) WHERE status = 'pending';

-- Anti-spam: only one pending room per friendship at a time
CREATE UNIQUE INDEX uniq_pending_call_room_per_friendship
ON call_rooms(friendship_id)
WHERE status = 'pending';

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_rooms ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- FRIENDSHIPS: Users can see their own friendships
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships they're part of" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES: Users can read/write messages in their friendships
CREATE POLICY "Users can view messages in their friendships" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f 
      WHERE f.id = messages.friendship_id 
      AND (f.user1_id = auth.uid() OR f.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their friendships" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM friendships f 
      WHERE f.id = friendship_id 
      AND (f.user1_id = auth.uid() OR f.user2_id = auth.uid())
    )
  );

-- CALL ROOMS: Users can manage rooms for their friendships
CREATE POLICY "Users can view call rooms for their friendships" ON call_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f 
      WHERE f.id = call_rooms.friendship_id 
      AND (f.user1_id = auth.uid() OR f.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create call rooms for their friendships" ON call_rooms
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM friendships f 
      WHERE f.id = friendship_id 
      AND (f.user1_id = auth.uid() OR f.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update call rooms for their friendships" ON call_rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.id = call_rooms.friendship_id
      AND (f.user1_id = auth.uid() OR f.user2_id = auth.uid())
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create friendship (ensures ordered IDs)
CREATE OR REPLACE FUNCTION create_friendship(user_a UUID, user_b UUID)
RETURNS UUID AS $$
DECLARE
  friendship_id UUID;
  ordered_user1 UUID;
  ordered_user2 UUID;
BEGIN
  -- Order the user IDs
  IF user_a < user_b THEN
    ordered_user1 := user_a;
    ordered_user2 := user_b;
  ELSE
    ordered_user1 := user_b;
    ordered_user2 := user_a;
  END IF;
  
  -- Try to insert, or get existing
  INSERT INTO friendships (user1_id, user2_id)
  VALUES (ordered_user1, ordered_user2)
  ON CONFLICT (user1_id, user2_id) DO NOTHING
  RETURNING id INTO friendship_id;
  
  -- If no insert happened, get existing
  IF friendship_id IS NULL THEN
    SELECT id INTO friendship_id FROM friendships 
    WHERE user1_id = ordered_user1 AND user2_id = ordered_user2;
  END IF;
  
  RETURN friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all friends for a user
CREATE OR REPLACE FUNCTION get_friends(user_id UUID)
RETURNS TABLE (
  friendship_id UUID,
  friend_id UUID,
  friend_email TEXT,
  friend_name TEXT,
  friend_avatar TEXT,
  friend_online BOOLEAN,
  friend_last_seen TIMESTAMPTZ,
  friendship_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS friendship_id,
    CASE WHEN f.user1_id = user_id THEN f.user2_id ELSE f.user1_id END AS friend_id,
    p.email AS friend_email,
    p.display_name AS friend_name,
    p.avatar_url AS friend_avatar,
    p.is_online AS friend_online,
    p.last_seen AS friend_last_seen,
    f.created_at AS friendship_created_at
  FROM friendships f
  JOIN profiles p ON p.id = CASE WHEN f.user1_id = user_id THEN f.user2_id ELSE f.user1_id END
  WHERE f.user1_id = user_id OR f.user2_id = user_id
  ORDER BY p.is_online DESC, p.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or reuse a pending friend call room (anti-spam)
CREATE OR REPLACE FUNCTION create_or_get_pending_call_room(target_friendship_id UUID, requester_id UUID)
RETURNS TABLE (
  room_id UUID,
  room_code TEXT,
  room_status TEXT,
  room_created_at TIMESTAMPTZ,
  room_is_new BOOLEAN
) AS $$
DECLARE
  existing_room RECORD;
  is_participant BOOLEAN;
BEGIN
  IF requester_id IS NULL OR auth.uid() IS DISTINCT FROM requester_id THEN
    RAISE EXCEPTION 'Unauthorized call room request';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.id = target_friendship_id
    AND (f.user1_id = requester_id OR f.user2_id = requester_id)
  ) INTO is_participant;

  IF NOT is_participant THEN
    RAISE EXCEPTION 'You are not part of this friendship';
  END IF;

  SELECT id, room_code, status, created_at
  INTO existing_room
  FROM call_rooms
  WHERE friendship_id = target_friendship_id
  AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      existing_room.id,
      existing_room.room_code,
      existing_room.status,
      existing_room.created_at,
      false;
    RETURN;
  END IF;

  INSERT INTO call_rooms (friendship_id, created_by, room_code, status)
  VALUES (
    target_friendship_id,
    requester_id,
    'call_' || replace(gen_random_uuid()::text, '-', ''),
    'pending'
  )
  RETURNING id, call_rooms.room_code, call_rooms.status, call_rooms.created_at
  INTO room_id, room_code, room_status, room_created_at;

  RETURN QUERY SELECT room_id, room_code, room_status, room_created_at, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
