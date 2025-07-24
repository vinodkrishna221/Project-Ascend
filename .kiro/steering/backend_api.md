# Ascend Backend API Guidelines

## Backend Architecture Overview

### Supabase-First Approach
Ascend leverages Supabase as the primary backend infrastructure, providing PostgreSQL database, authentication, real-time subscriptions, file storage, and Edge Functions in a unified platform.

**Core Backend Components:**
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with college email verification
- **Real-time**: PostgreSQL change data capture for live features
- **Storage**: S3-compatible file storage with CDN
- **Edge Functions**: Serverless functions for custom business logic
- **API**: Auto-generated REST and GraphQL APIs

## Database Schema Design

### Core Tables Structure

**profiles** (extends auth.users)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE, -- Nullable for college database verification
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  college_id UUID REFERENCES guilds(id),
  graduation_year INTEGER,
  verification_status verification_status DEFAULT 'pending',
  verification_method verification_method DEFAULT 'email',
  college_database_id UUID REFERENCES college_student_database(id), -- For database verification
  skills JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**posts**
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type post_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  anonymous BOOLEAN DEFAULT FALSE,
  community_id UUID REFERENCES communities(id),
  guild_id UUID REFERENCES guilds(id),
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**communities**
```sql
CREATE TABLE communities (
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
```

**guilds** (College Organizations)
```sql
CREATE TABLE guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_name TEXT UNIQUE NOT NULL,
  college_domain TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  admin_users UUID[] DEFAULT '{}',
  verification_documents JSONB DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**projects**
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  skills_used JSONB DEFAULT '[]',
  status project_status DEFAULT 'active',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  collaborators UUID[] DEFAULT '{}',
  is_seeking_collaborators BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Custom Types (Enums)
```sql
CREATE TYPE user_role AS ENUM ('student', 'aspirant', 'admin');
CREATE TYPE post_type AS ENUM ('win', 'project_update', 'question');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE verification_method AS ENUM ('email', 'college_database', 'manual');
```

### Junction Tables for Many-to-Many Relationships
```sql
-- Community memberships
CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- Guild memberships
CREATE TABLE guild_members (
  guild_id UUID REFERENCES guilds(id),
  user_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id)
);

-- Post interactions (kudos, saves, etc.)
CREATE TABLE post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type interaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

CREATE TYPE interaction_type AS ENUM ('kudos', 'save', 'report');

-- College student database for non-email verification
CREATE TABLE college_student_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID REFERENCES guilds(id) NOT NULL,
  student_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year INTEGER NOT NULL,
  roll_number TEXT, -- Optional but helpful
  verification_password TEXT NOT NULL, -- Hashed with bcrypt
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For graduated students
  used_at TIMESTAMPTZ, -- When student created account
  
  -- Ensure uniqueness per college
  UNIQUE(college_id, student_name, branch, year),
  UNIQUE(college_id, verification_password)
);

-- College admin management
CREATE TABLE college_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID REFERENCES guilds(id) NOT NULL,
  admin_email TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  permissions JSONB DEFAULT '{"can_add_students": true, "can_remove_students": true}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### Core Security Principles
1. **Student-Only Access**: Only verified students can access most content
2. **Privacy by Default**: Users control their data visibility
3. **Community-Based Access**: Content access based on community membership
4. **Anonymous Protection**: Anonymous posts hide user identity while maintaining ownership

### Essential RLS Policies

**Profiles Access**
```sql
-- Users can view verified profiles
CREATE POLICY "Users can view verified profiles" ON profiles
  FOR SELECT USING (verification_status = 'verified');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

**Posts Access**
```sql
-- Users can view posts in their communities
CREATE POLICY "Users can view community posts" ON posts
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
    OR guild_id IN (
      SELECT guild_id FROM guild_members 
      WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);
```

**Community Access**
```sql
-- Users can view public communities
CREATE POLICY "Users can view public communities" ON communities
  FOR SELECT USING (is_public = TRUE);

-- Community members can view private communities
CREATE POLICY "Members can view private communities" ON communities
  FOR SELECT USING (
    id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid()
    )
  );
```

## API Design Patterns

### RESTful Endpoint Structure
```
/api/v1/
├── /auth/
│   ├── POST /signup              # Student registration
│   ├── POST /verify-email        # College email verification
│   ├── POST /verify-college-credentials # College database verification
│   ├── POST /login               # Authentication
│   └── POST /logout              # Session termination
├── /colleges/
│   ├── GET /colleges/:id/students/verify # Check if student exists in college database
│   ├── POST /colleges/:id/students/bulk-upload # Bulk upload student data (admin only)
│   ├── POST /colleges/:id/students/add   # Add individual student (admin only)
│   ├── PUT /colleges/:id/students/:student-id/status # Update student status (admin only)
│   └── GET /colleges/:id/students/analytics # Student verification analytics (admin only)
├── /profiles/
│   ├── GET /profiles/:id         # Get user profile
│   ├── PATCH /profiles/:id       # Update profile
│   └── GET /profiles/me          # Current user profile
├── /posts/
│   ├── GET /posts                # Feed with pagination
│   ├── POST /posts               # Create post
│   ├── GET /posts/:id            # Get specific post
│   ├── PATCH /posts/:id          # Update post
│   └── DELETE /posts/:id         # Delete post
├── /communities/
│   ├── GET /communities          # List communities
│   ├── POST /communities         # Create community
│   ├── GET /communities/:id      # Get community details
│   ├── POST /communities/:id/join # Join community
│   └── DELETE /communities/:id/leave # Leave community
├── /guilds/
│   ├── GET /guilds               # List college guilds
│   ├── GET /guilds/:id           # Get guild details
│   ├── POST /guilds/:id/join     # Join guild
│   └── GET /guilds/:id/aspirants # Q&A section
└── /projects/
    ├── GET /projects             # List projects
    ├── POST /projects            # Create project
    ├── GET /projects/:id         # Get project details
    └── POST /projects/:id/collaborate # Request collaboration
```

### Response Format Standards
```typescript
// Success Response
interface APIResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    timestamp: string;
  };
}

// Error Response
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Pagination Standards
```typescript
// Query Parameters
interface PaginationParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  sort?: string;        // Default: 'created_at'
  order?: 'asc' | 'desc'; // Default: 'desc'
}

// Implementation Example
const getPosts = async (params: PaginationParams) => {
  const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = params;
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);
    
  return {
    data,
    meta: {
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    }
  };
};
```

### College Database Verification Implementation
```typescript
// College database verification endpoint
interface CollegeCredentialsRequest {
  college_id: string;
  student_name: string;
  branch: string;
  year: number;
  verification_password: string;
  roll_number?: string;
}

const verifyCollegeCredentials = async (credentials: CollegeCredentialsRequest) => {
  const { college_id, student_name, branch, year, verification_password } = credentials;
  
  // Look up student in college database
  const { data: studentRecord, error } = await supabase
    .from('college_student_database')
    .select('*')
    .eq('college_id', college_id)
    .eq('student_name', student_name)
    .eq('branch', branch)
    .eq('year', year)
    .eq('is_active', true)
    .single();
    
  if (error || !studentRecord) {
    return {
      success: false,
      error: {
        code: 'STUDENT_NOT_FOUND',
        message: 'Student not found in college database'
      }
    };
  }
  
  // Verify password
  const bcrypt = require('bcrypt');
  const passwordMatch = await bcrypt.compare(verification_password, studentRecord.verification_password);
  
  if (!passwordMatch) {
    return {
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'Invalid verification password'
      }
    };
  }
  
  // Check if already used
  if (studentRecord.used_at) {
    return {
      success: false,
      error: {
        code: 'CREDENTIALS_ALREADY_USED',
        message: 'These credentials have already been used to create an account'
      }
    };
  }
  
  return {
    success: true,
    data: {
      student_id: studentRecord.id,
      college_id: studentRecord.college_id,
      verified: true
    }
  };
};
```

## Real-time Features Implementation

### Supabase Real-time Subscriptions
```typescript
// Feed Updates
const subscribeToFeedUpdates = (userId: string) => {
  return supabase
    .channel(`user-feed-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `community_id=in.(${userCommunityIds.join(',')})`
    }, handlePostChange)
    .subscribe();
};

// Comment Updates
const subscribeToPostComments = (postId: string) => {
  return supabase
    .channel(`post-comments-${postId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `post_id=eq.${postId}`
    }, handleNewComment)
    .subscribe();
};

// Notification System
const subscribeToNotifications = (userId: string) => {
  return supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, handleNotification)
    .subscribe();
};
```

## Edge Functions Development

### Function Structure
```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationRequest {
  userId: string;
  type: 'kudos' | 'comment' | 'collaboration' | 'mention';
  data: any;
}

serve(async (req) => {
  try {
    const { userId, type, data }: NotificationRequest = await req.json();
    
    // Validate request
    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Create notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        data,
        read: false
      });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Common Edge Functions
1. **send-notification**: Handle push notifications and in-app alerts
2. **process-media**: Image/video processing and optimization
3. **moderate-content**: AI-powered content moderation
4. **verify-college-email**: College domain verification logic
5. **verify-college-credentials**: College database verification logic
6. **generate-feed**: Personalized feed algorithm
7. **skill-matching**: Project collaboration matching
8. **sync-college-database**: Periodic sync of college student databases

## File Storage Management

### Storage Bucket Structure
```
Storage Buckets:
├── avatars/              # User profile pictures
│   ├── public read access
│   ├── authenticated write access
│   └── 2MB max file size
├── post-media/           # Post images and videos
│   ├── authenticated read/write access
│   ├── 10MB max file size
│   └── automatic compression
├── project-files/        # Project documentation and media
│   ├── role-based access control
│   ├── 50MB max file size
│   └── version control
└── guild-documents/      # Official college documents
    ├── admin-only write access
    ├── member read access
    └── audit trail required
```

### File Upload Patterns
```typescript
// Client-side upload with progress
const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: (progress) => {
        console.log(`Upload progress: ${(progress.loaded / progress.total) * 100}%`);
      }
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
    
  return publicUrl;
};
```

## Error Handling Standards

### Error Classification
```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  SERVER = 'INTERNAL_SERVER_ERROR'
}

interface APIError {
  type: ErrorType;
  message: string;
  details?: any;
  code: string;
}
```

### Error Response Patterns
```typescript
// Validation Error
{
  success: false,
  error: {
    type: 'VALIDATION_ERROR',
    code: 'INVALID_EMAIL',
    message: 'Please provide a valid college email address',
    details: {
      field: 'email',
      value: 'invalid-email',
      constraint: 'Must be a valid college email domain'
    }
  }
}

// Authentication Error
{
  success: false,
  error: {
    type: 'AUTH_ERROR',
    code: 'INVALID_TOKEN',
    message: 'Your session has expired. Please log in again.',
    details: {
      action: 'redirect_to_login'
    }
  }
}
```

## Performance Optimization

### Database Optimization
```sql
-- Essential Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);

-- Composite Indexes for Common Queries
CREATE INDEX idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX idx_community_members_user ON community_members(user_id);

-- Full-text Search
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));
```

### Caching Strategy
```typescript
// Redis-like caching with Supabase
const cacheKey = `feed:${userId}:${page}`;
const cachedFeed = await supabase
  .from('cache')
  .select('data')
  .eq('key', cacheKey)
  .single();

if (cachedFeed.data && !isExpired(cachedFeed.data.created_at)) {
  return cachedFeed.data.data;
}

// Generate fresh data and cache
const freshData = await generateFeed(userId, page);
await supabase
  .from('cache')
  .upsert({
    key: cacheKey,
    data: freshData,
    expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  });
```

## API Testing Standards

### Unit Testing
```typescript
// Test database functions
describe('Post Creation', () => {
  it('should create post with valid data', async () => {
    const postData = {
      title: 'My First Project',
      content: 'Built a todo app with React',
      type: 'project_update',
      user_id: testUserId
    };
    
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();
      
    expect(error).toBeNull();
    expect(data.title).toBe(postData.title);
  });
});
```

### Integration Testing
```typescript
// Test API endpoints
describe('POST /api/v1/posts', () => {
  it('should create post for authenticated user', async () => {
    const response = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Test Post',
        content: 'Test content',
        type: 'win'
      });
      
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## Migration Management

### Migration Best Practices
```sql
-- migrations/20240101000000_initial_schema.sql
BEGIN;

-- Create tables in dependency order
CREATE TABLE guilds (...);
CREATE TABLE profiles (...);
CREATE TABLE communities (...);
CREATE TABLE posts (...);

-- Create indexes
CREATE INDEX ...;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY ...;

COMMIT;
```

### Rollback Procedures
```sql
-- Always include rollback instructions
-- To rollback this migration:
-- DROP TABLE posts CASCADE;
-- DROP TABLE communities CASCADE;
-- DROP TABLE profiles CASCADE;
-- DROP TABLE guilds CASCADE;
```

## Monitoring & Observability

### Key Metrics to Track
- API response times and error rates
- Database query performance
- Real-time subscription connection counts
- File upload success rates
- User authentication patterns
- Content moderation effectiveness

### Logging Standards
```typescript
// Structured logging
const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message: string, error: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
```

This comprehensive backend API guide ensures consistent, secure, and performant backend development for Ascend while maintaining the student-first principles and technical excellence required for the platform.