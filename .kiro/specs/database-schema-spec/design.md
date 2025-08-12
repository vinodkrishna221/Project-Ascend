# Database Schema Design Document

## Overview

The Database Schema system provides the foundational data structure for the entire Ascend platform, leveraging PostgreSQL's advanced features through Supabase to ensure data integrity, security, and performance. This system implements comprehensive Row Level Security (RLS), strategic indexing, and robust migration procedures to support the platform's student-focused social networking features while maintaining scalability and reliability.

## Architecture

### PostgreSQL Schema Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Core Tables   │  │   Junction      │  │   Analytics     │ │
│  │   (Users, Posts)│  │   Tables        │  │   Tables        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Row Level     │  │   Strategic     │  │   Full-Text     │ │
│  │   Security      │  │   Indexes       │  │   Search        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Constraints   │  │   Triggers      │  │   Functions     │ │
│  │   & Validation  │  │   & Automation  │  │   & Procedures  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
Application Layer → Supabase Client → PostgREST → RLS Policies → PostgreSQL Tables
        ↓                ↓              ↓           ↓              ↓
   CRUD Operations → JWT Validation → Policy Check → Index Lookup → Data Access
        ↓                ↓              ↓           ↓              ↓
   Real-time Subs → Auth Context → Permission Filter → Query Execution → Change Notification
```

## Core Database Schema

### 1. User Management Schema

```sql
-- Extend Supabase auth.users with profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  
  -- Role and verification
  role user_role NOT NULL DEFAULT 'student',
  verification_status verification_status DEFAULT 'pending',
  verification_method verification_method DEFAULT 'email',
  
  -- College association
  college_id UUID REFERENCES guilds(id),
  graduation_year INTEGER,
  
  -- Profile data
  skills JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]',
  privacy_settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_graduation_year CHECK (graduation_year >= 2020 AND graduation_year <= 2030),
  CONSTRAINT valid_skills CHECK (jsonb_typeof(skills) = 'array'),
  CONSTRAINT valid_interests CHECK (jsonb_typeof(interests) = 'array')
);

-- User preferences and settings
CREATE TABLE user_preferences (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  
  -- Notification preferences
  notification_settings JSONB DEFAULT '{}',
  privacy_mode privacy_mode DEFAULT 'standard',
  
  -- UI preferences
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  
  -- Feature preferences
  show_online_status BOOLEAN DEFAULT TRUE,
  allow_collaboration_requests BOOLEAN DEFAULT TRUE,
  show_in_directory BOOLEAN DEFAULT TRUE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom types for user management
CREATE TYPE user_role AS ENUM ('student', 'aspirant', 'admin', 'moderator');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE verification_method AS ENUM ('email', 'college_database', 'manual');
CREATE TYPE privacy_mode AS ENUM ('open', 'standard', 'private', 'anonymous');
```

### 2. Content Management Schema

```sql
-- Posts table for all user-generated content
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Content
  type post_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  
  -- Context
  community_id UUID REFERENCES communities(id),
  guild_id UUID REFERENCES guilds(id),
  project_id UUID REFERENCES projects(id),
  
  -- Privacy and moderation
  is_anonymous BOOLEAN DEFAULT FALSE,
  visibility post_visibility DEFAULT 'public',
  moderation_status moderation_status DEFAULT 'approved',
  
  -- Engagement metrics
  kudos_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT valid_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  CONSTRAINT valid_media_urls CHECK (jsonb_typeof(media_urls) = 'array')
);

-- Comments on posts
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  parent_comment_id UUID REFERENCES comments(id),
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Engagement
  kudos_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

-- Post interactions (kudos, saves, reports)
CREATE TABLE post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type interaction_type NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id, type)
);

-- Custom types for content
CREATE TYPE post_type AS ENUM ('win', 'project_update', 'question', 'announcement');
CREATE TYPE post_visibility AS ENUM ('public', 'community', 'guild', 'private');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE interaction_type AS ENUM ('kudos', 'save', 'report', 'share');
```

### 3. Community and Guild Schema

```sql
-- Communities for cross-college interest groups
CREATE TABLE communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Organization
  category TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  
  -- Management
  created_by UUID REFERENCES profiles(id) NOT NULL,
  moderators UUID[] DEFAULT '{}',
  
  -- Metrics
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  activity_score DECIMAL(5,2) DEFAULT 0.0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT valid_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_tags CHECK (jsonb_typeof(tags) = 'array')
);

-- College guilds for official college representation
CREATE TABLE guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_name TEXT UNIQUE NOT NULL,
  college_domain TEXT UNIQUE,
  college_code TEXT UNIQUE,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSONB DEFAULT '{}',
  
  -- Management
  admin_users UUID[] DEFAULT '{}',
  moderators UUID[] DEFAULT '{}',
  
  -- Settings
  allows_aspirants BOOLEAN DEFAULT TRUE,
  requires_verification BOOLEAN DEFAULT TRUE,
  
  -- Metrics
  member_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  aspirant_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_college_name CHECK (char_length(college_name) >= 3),
  CONSTRAINT valid_college_domain CHECK (college_domain IS NULL OR college_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$')
);

-- Community memberships
CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  role member_role DEFAULT 'member',
  status membership_status DEFAULT 'active',
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (community_id, user_id)
);

-- Guild memberships
CREATE TABLE guild_members (
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  role member_role DEFAULT 'member',
  status membership_status DEFAULT 'active',
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  PRIMARY KEY (guild_id, user_id)
);

-- Custom types for communities and guilds
CREATE TYPE member_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'suspended', 'banned');
```

### 4. Project and Collaboration Schema

```sql
-- Projects for collaboration and portfolio
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Project details
  skills_used JSONB DEFAULT '[]',
  technologies JSONB DEFAULT '[]',
  status project_status DEFAULT 'active',
  
  -- Collaboration
  created_by UUID REFERENCES profiles(id) NOT NULL,
  collaborators UUID[] DEFAULT '{}',
  is_seeking_collaborators BOOLEAN DEFAULT FALSE,
  max_collaborators INTEGER DEFAULT 5,
  
  -- Content
  repository_url TEXT,
  demo_url TEXT,
  media_urls JSONB DEFAULT '[]',
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  kudos_count INTEGER DEFAULT 0,
  collaboration_requests INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT valid_max_collaborators CHECK (max_collaborators >= 1 AND max_collaborators <= 20),
  CONSTRAINT valid_skills_used CHECK (jsonb_typeof(skills_used) = 'array')
);

-- Skill endorsements tied to projects
CREATE TABLE endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endorser_id UUID REFERENCES profiles(id) NOT NULL,
  endorsed_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  skill_name TEXT NOT NULL,
  message TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(endorser_id, endorsed_id, project_id, skill_name)
);

-- Collaboration requests
CREATE TABLE collaboration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) NOT NULL,
  
  message TEXT,
  skills_offered JSONB DEFAULT '[]',
  status request_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  UNIQUE(project_id, requester_id)
);

-- Custom types for projects
CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'paused', 'cancelled');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
```

## Row Level Security (RLS) Policies

### 1. Profile Access Policies

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view verified profiles
CREATE POLICY "Users can view verified profiles" ON profiles
  FOR SELECT USING (
    verification_status = 'verified' 
    AND (
      privacy_settings->>'profile_visibility' IS NULL 
      OR privacy_settings->>'profile_visibility' = 'public'
      OR auth.uid() = id
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Post Access Policies

```sql
-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can view posts based on visibility and membership
CREATE POLICY "Users can view posts" ON posts
  FOR SELECT USING (
    CASE visibility
      WHEN 'public' THEN TRUE
      WHEN 'community' THEN community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
      WHEN 'guild' THEN guild_id IN (
        SELECT guild_id FROM guild_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
      WHEN 'private' THEN user_id = auth.uid()
      ELSE FALSE
    END
    AND moderation_status = 'approved'
  );

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      community_id IS NULL 
      OR community_id IN (
        SELECT community_id FROM community_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Community Access Policies

```sql
-- Enable RLS on communities table
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Users can view public communities or communities they're members of
CREATE POLICY "Users can view communities" ON communities
  FOR SELECT USING (
    is_public = TRUE 
    OR id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );

-- Verified users can create communities
CREATE POLICY "Verified users can create communities" ON communities
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND verification_status = 'verified'
    )
  );
```

## Strategic Indexing Strategy

### 1. Performance Indexes

```sql
-- User and profile indexes
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX idx_profiles_college_id ON profiles(college_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at DESC);

-- Post performance indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_community_id ON posts(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX idx_posts_guild_id ON posts(guild_id) WHERE guild_id IS NOT NULL;
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) WHERE moderation_status = 'approved';

-- Composite indexes for common queries
CREATE INDEX idx_posts_community_published ON posts(community_id, published_at DESC) 
  WHERE community_id IS NOT NULL AND moderation_status = 'approved';
CREATE INDEX idx_posts_user_type_created ON posts(user_id, type, created_at DESC);

-- Comment indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

### 2. Full-Text Search Indexes

```sql
-- Full-text search on posts
CREATE INDEX idx_posts_search ON posts USING gin(
  to_tsvector('english', title || ' ' || content)
) WHERE moderation_status = 'approved';

-- Full-text search on profiles
CREATE INDEX idx_profiles_search ON profiles USING gin(
  to_tsvector('english', name || ' ' || COALESCE(bio, ''))
) WHERE verification_status = 'verified';

-- Full-text search on communities
CREATE INDEX idx_communities_search ON communities USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- JSONB indexes for skills and tags
CREATE INDEX idx_profiles_skills ON profiles USING gin(skills);
CREATE INDEX idx_posts_media_urls ON posts USING gin(media_urls);
CREATE INDEX idx_communities_tags ON communities USING gin(tags);
CREATE INDEX idx_projects_skills_used ON projects USING gin(skills_used);
```

### 3. Relationship and Foreign Key Indexes

```sql
-- Membership indexes
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_guild_members_user_id ON guild_members(user_id);
CREATE INDEX idx_guild_members_guild_id ON guild_members(guild_id);

-- Interaction indexes
CREATE INDEX idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX idx_post_interactions_type ON post_interactions(type);

-- Project and collaboration indexes
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_seeking_collaborators ON projects(is_seeking_collaborators) 
  WHERE is_seeking_collaborators = TRUE;
CREATE INDEX idx_endorsements_endorsed_id ON endorsements(endorsed_id);
CREATE INDEX idx_endorsements_project_id ON endorsements(project_id);
```

## Data Integrity and Constraints

### 1. Referential Integrity

```sql
-- Ensure profile exists for auth user
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'New User'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ensure_profile_exists();
```

### 2. Data Validation Triggers

```sql
-- Update post engagement counts
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'kudos' THEN
      UPDATE posts SET kudos_count = kudos_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'kudos' THEN
      UPDATE posts SET kudos_count = kudos_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_interaction_counts
  AFTER INSERT OR DELETE ON post_interactions
  FOR EACH ROW EXECUTE FUNCTION update_post_engagement_counts();
```

### 3. Data Consistency Functions

```sql
-- Update community member counts
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();
```

## Migration Strategy

### 1. Migration File Structure

```sql
-- migrations/001_initial_schema.sql
BEGIN;

-- Create custom types first
CREATE TYPE user_role AS ENUM ('student', 'aspirant', 'admin', 'moderator');
-- ... other types

-- Create core tables
CREATE TABLE profiles (...);
CREATE TABLE posts (...);
-- ... other tables

-- Create indexes
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);
-- ... other indexes

-- Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view verified profiles" ON profiles ...;
-- ... other policies

COMMIT;
```

### 2. Safe Migration Procedures

```sql
-- Example: Adding a new column safely
-- migrations/002_add_user_preferences.sql
BEGIN;

-- Add column with default value
ALTER TABLE profiles 
ADD COLUMN preferences JSONB DEFAULT '{}';

-- Update existing rows (if needed)
UPDATE profiles 
SET preferences = '{}'::jsonb 
WHERE preferences IS NULL;

-- Add constraint after data is populated
ALTER TABLE profiles 
ADD CONSTRAINT valid_preferences 
CHECK (jsonb_typeof(preferences) = 'object');

COMMIT;
```

### 3. Rollback Procedures

```sql
-- Always include rollback instructions
-- To rollback migration 002:
-- ALTER TABLE profiles DROP COLUMN preferences;
```

This comprehensive database schema design provides a solid foundation for the Ascend platform with proper data modeling, security, performance optimization, and maintainability.