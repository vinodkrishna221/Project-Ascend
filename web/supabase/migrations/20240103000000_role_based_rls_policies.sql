-- Role-Based Access Control RLS Policies Migration
-- This migration implements comprehensive RLS policies for role-based data access
-- Requirements: 6.4, 6.5

BEGIN;

-- Drop existing policies to recreate them with role-based access
DROP POLICY IF EXISTS "Users can view verified profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Enhanced profile policies with role-based access
CREATE POLICY "Users can view verified profiles based on role" ON profiles
  FOR SELECT USING (
    -- Users can always view their own profile
    auth.uid() = id
    OR
    -- Verified users can view other verified profiles
    (
      verification_status = 'verified'
      AND EXISTS (
        SELECT 1 FROM profiles viewer
        WHERE viewer.id = auth.uid()
        AND viewer.verification_status = 'verified'
      )
    )
    OR
    -- Platform admins can view all profiles
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'platform_admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR
    -- Platform admins can update any profile
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'platform_admin'
    )
  );

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create communities table and policies (if not exists)
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  moderators UUID[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Community access policies based on roles
CREATE POLICY "Public communities visible to all verified users" ON communities
  FOR SELECT USING (
    is_public = TRUE
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'verified'
    )
  );

CREATE POLICY "Private communities visible to members and admins" ON communities
  FOR SELECT USING (
    -- Public communities
    is_public = TRUE
    OR
    -- Community members can view private communities
    auth.uid() = ANY(
      SELECT user_id FROM community_members
      WHERE community_id = communities.id
    )
    OR
    -- Community moderators can view
    auth.uid() = ANY(moderators)
    OR
    -- Community creator can view
    auth.uid() = created_by
    OR
    -- Platform admins can view all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Verified students can create communities" ON communities
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'verified'
      AND profiles.role IN ('student', 'guild_admin', 'platform_admin')
    )
  );

CREATE POLICY "Community creators and moderators can update communities" ON communities
  FOR UPDATE USING (
    auth.uid() = created_by
    OR auth.uid() = ANY(moderators)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

-- Create community_members table and policies (if not exists)
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view community memberships" ON community_members
  FOR SELECT USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR
    -- Community moderators can see all members
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_id
      AND (
        auth.uid() = communities.created_by
        OR auth.uid() = ANY(communities.moderators)
      )
    )
    OR
    -- Platform admins can see all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Verified users can join communities based on role" ON community_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'verified'
    )
    AND (
      -- Students can join any community
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('student', 'guild_admin', 'platform_admin')
      )
      OR
      -- Aspirants can only join public communities
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'aspirant'
        )
        AND EXISTS (
          SELECT 1 FROM communities
          WHERE communities.id = community_id
          AND communities.is_public = TRUE
        )
      )
    )
  );

CREATE POLICY "Users can leave communities" ON community_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR
    -- Community moderators can remove members
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_id
      AND (
        auth.uid() = communities.created_by
        OR auth.uid() = ANY(communities.moderators)
      )
    )
    OR
    -- Platform admins can remove anyone
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

-- Create posts table and policies (if not exists)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  media_urls JSONB DEFAULT '[]',
  anonymous BOOLEAN DEFAULT FALSE,
  community_id UUID REFERENCES communities(id),
  guild_id UUID, -- Will reference guilds when implemented
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Post access policies based on roles and community membership
CREATE POLICY "Users can view posts based on role and membership" ON posts
  FOR SELECT USING (
    -- Users can view their own posts
    auth.uid() = user_id
    OR
    -- Users can view posts in communities they're members of
    (
      community_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM community_members
        WHERE community_members.community_id = posts.community_id
        AND community_members.user_id = auth.uid()
      )
    )
    OR
    -- Users can view posts in public communities (even if not members)
    (
      community_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = posts.community_id
        AND communities.is_public = TRUE
      )
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.verification_status = 'verified'
      )
    )
    OR
    -- Guild members can view guild posts
    (
      guild_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.college_id = posts.guild_id
        AND profiles.verification_status = 'verified'
      )
    )
    OR
    -- Platform admins can view all posts
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Verified users can create posts based on role" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.verification_status = 'verified'
    )
    AND (
      -- Students can create posts
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('student', 'guild_admin', 'platform_admin')
      )
      OR
      -- Aspirants can only create posts in guild Q&A sections (anonymous)
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'aspirant'
        )
        AND guild_id IS NOT NULL
        AND anonymous = TRUE
      )
    )
  );

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (
    auth.uid() = user_id
    OR
    -- Community moderators can update posts in their communities
    (
      community_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = posts.community_id
        AND (
          auth.uid() = communities.created_by
          OR auth.uid() = ANY(communities.moderators)
        )
      )
    )
    OR
    -- Guild admins can update posts in their guilds
    (
      guild_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'guild_admin'
        AND profiles.college_id = posts.guild_id
      )
    )
    OR
    -- Platform admins can update any post
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (
    auth.uid() = user_id
    OR
    -- Community moderators can delete posts in their communities
    (
      community_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = posts.community_id
        AND (
          auth.uid() = communities.created_by
          OR auth.uid() = ANY(communities.moderators)
        )
      )
    )
    OR
    -- Guild admins can delete posts in their guilds
    (
      guild_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'guild_admin'
        AND profiles.college_id = posts.guild_id
      )
    )
    OR
    -- Platform admins can delete any post
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

-- Enhanced college student database policies
DROP POLICY IF EXISTS "Platform admins can manage college student database" ON college_student_database;
DROP POLICY IF EXISTS "Guild admins can view their college student database" ON college_student_database;

CREATE POLICY "Admins can manage college student database" ON college_student_database
  FOR ALL USING (
    -- Platform admins can manage all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
    OR
    -- Guild admins can manage their college's database
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'guild_admin'
        AND profiles.college_id = college_student_database.college_id
      )
    )
  );

-- Enhanced college domains policies
DROP POLICY IF EXISTS "Platform admins can manage college domains" ON college_domains;

CREATE POLICY "Admins can manage college domains" ON college_domains
  FOR ALL USING (
    -- Platform admins can manage all domains
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

-- Enhanced user sessions policies
DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;

CREATE POLICY "Users and admins can manage sessions" ON user_sessions
  FOR ALL USING (
    -- Users can manage their own sessions
    user_id = auth.uid()
    OR
    -- Platform admins can manage any session
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
  );

-- Enhanced auth audit log policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON auth_audit_log;
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON auth_audit_log;

CREATE POLICY "Users and admins can view audit logs" ON auth_audit_log
  FOR SELECT USING (
    -- Users can view their own audit logs
    user_id = auth.uid()
    OR
    -- Platform admins can view all audit logs
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'platform_admin'
    )
    OR
    -- Guild admins can view audit logs for their guild members
    (
      user_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles viewer
        WHERE viewer.id = auth.uid()
        AND viewer.role = 'guild_admin'
        AND EXISTS (
          SELECT 1 FROM profiles target
          WHERE target.id = auth_audit_log.user_id
          AND target.college_id = viewer.college_id
        )
      )
    )
  );

-- Create function to check user role
CREATE OR REPLACE FUNCTION check_user_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_id
    AND profiles.role = required_role::user_role
    AND profiles.verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user has any of the specified roles
CREATE OR REPLACE FUNCTION check_user_has_any_role(user_id UUID, roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_id
    AND profiles.role::TEXT = ANY(roles)
    AND profiles.verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access community
CREATE OR REPLACE FUNCTION can_user_access_community(user_id UUID, community_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_public BOOLEAN;
  is_member BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id AND verification_status = 'verified';
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Platform admins can access everything
  IF user_role = 'platform_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if community is public
  SELECT is_public INTO is_public FROM communities WHERE id = community_id;
  
  -- Check if user is member
  SELECT EXISTS(
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = can_user_access_community.community_id 
    AND community_members.user_id = can_user_access_community.user_id
  ) INTO is_member;
  
  -- Students can access any community they're members of, or public communities
  IF user_role IN ('student', 'guild_admin') THEN
    RETURN is_member OR is_public;
  END IF;
  
  -- Aspirants can only access public communities
  IF user_role = 'aspirant' THEN
    RETURN is_public;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_public ON communities(is_public);
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_community_members_community_user ON community_members(community_id, user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_guild_id ON posts(guild_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_anonymous ON posts(anonymous);

COMMIT;