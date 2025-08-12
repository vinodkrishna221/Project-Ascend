# Search & Discovery Design Document

## Overview

The Search & Discovery system provides students with powerful yet intuitive tools to find relevant content, people, communities, and opportunities across Ascend. The design emphasizes algorithmic matching, privacy protection, and Campus Confidence principles to create an encouraging discovery experience that builds student confidence rather than overwhelming them.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Search & Discovery System                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Search API    │  │ Recommendation  │  │   Analytics     │ │
│  │   Controller    │  │    Engine       │  │    Service      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Full-Text     │  │   Algorithmic   │  │    Privacy      │ │
│  │   Search        │  │    Scoring      │  │    Filter       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL    │  │     Redis       │  │   Elasticsearch │ │
│  │   Database      │  │     Cache       │  │   Search Index  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Search Flow Architecture

```
User Query → Input Processing → Privacy Filter → Search Execution → Ranking Algorithm → Result Formatting → Response
     ↓              ↓               ↓               ↓                ↓                 ↓              ↓
Query Parsing → Autocomplete → Permission Check → Multi-Index → Relevance Score → UI Components → JSON/HTML
     ↓              ↓               ↓               ↓                ↓                 ↓              ↓
Tokenization → Suggestions → RLS Policies → Elasticsearch → Engagement Weight → Mobile/Web → Analytics
```

## Components and Interfaces

### 1. Search API Controller

**Purpose**: Central API endpoint for all search operations

```typescript
interface SearchController {
  // Global search across all content types
  globalSearch(query: SearchQuery): Promise<SearchResults>;
  
  // Type-specific search methods
  searchUsers(query: UserSearchQuery): Promise<UserSearchResults>;
  searchPosts(query: PostSearchQuery): Promise<PostSearchResults>;
  searchCommunities(query: CommunitySearchQuery): Promise<CommunitySearchResults>;
  searchProjects(query: ProjectSearchQuery): Promise<ProjectSearchResults>;
  
  // Autocomplete and suggestions
  getSearchSuggestions(partialQuery: string): Promise<SearchSuggestion[]>;
  getTrendingSearches(): Promise<TrendingSearch[]>;
  
  // Discovery and recommendations
  getPersonalizedRecommendations(userId: string): Promise<RecommendationResults>;
  getDiscoveryFeed(userId: string): Promise<DiscoveryFeed>;
}

interface SearchQuery {
  query: string;
  filters: SearchFilters;
  pagination: PaginationParams;
  userId: string;
  contentTypes: ContentType[];
}

interface SearchFilters {
  dateRange?: DateRange;
  skills?: string[];
  colleges?: string[];
  communities?: string[];
  postTypes?: PostType[];
  verificationStatus?: VerificationStatus[];
  collaborationStatus?: CollaborationStatus;
}

interface SearchResults {
  users: UserResult[];
  posts: PostResult[];
  communities: CommunityResult[];
  projects: ProjectResult[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
}
```

### 2. Full-Text Search Engine

**Purpose**: Elasticsearch integration for powerful text search capabilities

```typescript
interface SearchEngine {
  // Index management
  createIndex(indexName: string, mapping: IndexMapping): Promise<void>;
  updateIndex(indexName: string, documents: Document[]): Promise<void>;
  deleteFromIndex(indexName: string, documentId: string): Promise<void>;
  
  // Search operations
  search(query: ElasticsearchQuery): Promise<SearchResponse>;
  multiSearch(queries: ElasticsearchQuery[]): Promise<SearchResponse[]>;
  
  // Aggregations for faceted search
  getAggregations(query: AggregationQuery): Promise<AggregationResults>;
}

interface IndexMapping {
  users: {
    name: { type: 'text', analyzer: 'standard' };
    bio: { type: 'text', analyzer: 'standard' };
    skills: { type: 'keyword' };
    college: { type: 'keyword' };
    verification_status: { type: 'keyword' };
    created_at: { type: 'date' };
  };
  posts: {
    title: { type: 'text', analyzer: 'standard', boost: 2.0 };
    content: { type: 'text', analyzer: 'standard' };
    type: { type: 'keyword' };
    community_id: { type: 'keyword' };
    skills_mentioned: { type: 'keyword' };
    created_at: { type: 'date' };
  };
  communities: {
    name: { type: 'text', analyzer: 'standard', boost: 2.0 };
    description: { type: 'text', analyzer: 'standard' };
    category: { type: 'keyword' };
    member_count: { type: 'integer' };
    activity_score: { type: 'float' };
  };
  projects: {
    title: { type: 'text', analyzer: 'standard', boost: 2.0 };
    description: { type: 'text', analyzer: 'standard' };
    skills_used: { type: 'keyword' };
    status: { type: 'keyword' };
    collaboration_status: { type: 'keyword' };
  };
}
```

### 3. Algorithmic Scoring System

**Purpose**: Calculate relevance scores for search results and recommendations

```typescript
interface ScoringAlgorithm {
  // Calculate relevance score for search results
  calculateRelevanceScore(
    document: SearchDocument,
    query: SearchQuery,
    userContext: UserContext
  ): number;
  
  // Calculate recommendation score
  calculateRecommendationScore(
    item: RecommendationItem,
    userProfile: UserProfile
  ): number;
  
  // Update scoring weights based on user feedback
  updateScoringWeights(
    feedback: UserFeedback[]
  ): Promise<void>;
}

interface ScoringFactors {
  textRelevance: number;      // 0.4 - How well query matches content
  recency: number;            // 0.2 - How recent the content is
  engagement: number;         // 0.2 - Likes, comments, shares
  userAffinity: number;       // 0.1 - User's past interactions
  communityRelevance: number; // 0.1 - Relevance to user's communities
}

interface RecommendationFactors {
  skillMatch: number;         // 0.3 - Matching skills/interests
  communityOverlap: number;   // 0.2 - Shared communities
  engagementHistory: number;  // 0.2 - Past interaction patterns
  collaborationPotential: number; // 0.15 - Complementary skills
  activityLevel: number;      // 0.15 - Recent activity/engagement
}
```

### 4. Privacy Filter Service

**Purpose**: Ensure search results respect user privacy settings and permissions

```typescript
interface PrivacyFilter {
  // Filter search results based on privacy settings
  filterSearchResults(
    results: SearchResults,
    searcherUserId: string
  ): Promise<SearchResults>;
  
  // Check if user can view specific content
  canUserViewContent(
    contentId: string,
    contentType: ContentType,
    viewerUserId: string
  ): Promise<boolean>;
  
  // Filter user profiles based on visibility settings
  filterUserProfiles(
    profiles: UserProfile[],
    viewerUserId: string
  ): Promise<UserProfile[]>;
  
  // Handle anonymous content in search results
  processAnonymousContent(
    content: Content[],
    viewerUserId: string
  ): Promise<Content[]>;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'students_only' | 'communities_only' | 'private';
  searchableBySkills: boolean;
  searchableByName: boolean;
  showInRecommendations: boolean;
  allowDirectMessages: boolean;
}
```

### 5. Recommendation Engine

**Purpose**: Generate personalized recommendations using algorithmic matching

```typescript
interface RecommendationEngine {
  // Generate user recommendations
  recommendUsers(
    userId: string,
    limit: number
  ): Promise<UserRecommendation[]>;
  
  // Generate community recommendations
  recommendCommunities(
    userId: string,
    limit: number
  ): Promise<CommunityRecommendation[]>;
  
  // Generate content recommendations
  recommendPosts(
    userId: string,
    limit: number
  ): Promise<PostRecommendation[]>;
  
  // Generate project collaboration recommendations
  recommendCollaborations(
    userId: string,
    limit: number
  ): Promise<CollaborationRecommendation[]>;
}

interface UserRecommendation {
  user: UserProfile;
  score: number;
  reasons: RecommendationReason[];
  mutualConnections: UserProfile[];
  sharedCommunities: Community[];
}

interface RecommendationReason {
  type: 'skill_match' | 'community_overlap' | 'collaboration_potential' | 'similar_interests';
  description: string;
  confidence: number;
}
```

### 6. Search Analytics Service

**Purpose**: Track search usage and optimize performance

```typescript
interface SearchAnalytics {
  // Track search queries and results
  trackSearch(
    query: string,
    userId: string,
    results: SearchResults,
    responseTime: number
  ): Promise<void>;
  
  // Track user interactions with search results
  trackSearchInteraction(
    searchId: string,
    resultId: string,
    interactionType: InteractionType,
    userId: string
  ): Promise<void>;
  
  // Generate search analytics reports
  generateSearchReport(
    dateRange: DateRange
  ): Promise<SearchAnalyticsReport>;
  
  // Get trending searches
  getTrendingSearches(
    timeframe: Timeframe
  ): Promise<TrendingSearch[]>;
  
  // Identify search gaps (queries with no results)
  getSearchGaps(
    dateRange: DateRange
  ): Promise<SearchGap[]>;
}

interface SearchAnalyticsReport {
  totalSearches: number;
  averageResponseTime: number;
  topQueries: QueryStats[];
  noResultQueries: string[];
  userEngagement: EngagementStats;
  contentTypeDistribution: ContentTypeStats;
}
```

## Data Models

### Search Index Documents

```typescript
// User document in search index
interface UserSearchDocument {
  id: string;
  name: string;
  bio: string;
  skills: string[];
  college: string;
  graduation_year: number;
  verification_status: VerificationStatus;
  communities: string[];
  activity_score: number;
  created_at: Date;
  updated_at: Date;
}

// Post document in search index
interface PostSearchDocument {
  id: string;
  title: string;
  content: string;
  type: PostType;
  author_id: string;
  author_name: string;
  community_id?: string;
  community_name?: string;
  skills_mentioned: string[];
  engagement_score: number;
  created_at: Date;
  is_anonymous: boolean;
}

// Community document in search index
interface CommunitySearchDocument {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  activity_score: number;
  recent_posts_count: number;
  moderators: string[];
  is_public: boolean;
  created_at: Date;
}

// Project document in search index
interface ProjectSearchDocument {
  id: string;
  title: string;
  description: string;
  skills_used: string[];
  status: ProjectStatus;
  collaboration_status: CollaborationStatus;
  creator_id: string;
  collaborators: string[];
  engagement_score: number;
  created_at: Date;
  completed_at?: Date;
}
```

### Database Schema Extensions

```sql
-- Search analytics table
CREATE TABLE search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  results_count INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  clicked_results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search suggestions table
CREATE TABLE search_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT UNIQUE NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_searched TIMESTAMPTZ DEFAULT NOW(),
  category TEXT,
  is_trending BOOLEAN DEFAULT FALSE
);

-- User search preferences
CREATE TABLE user_search_preferences (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  default_filters JSONB DEFAULT '{}',
  search_history_enabled BOOLEAN DEFAULT TRUE,
  personalized_recommendations BOOLEAN DEFAULT TRUE,
  trending_notifications BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendation feedback
CREATE TABLE recommendation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  recommendation_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  feedback_type TEXT NOT NULL, -- 'positive', 'negative', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search result click tracking
CREATE TABLE search_result_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_analytics_id UUID REFERENCES search_analytics(id),
  result_type TEXT NOT NULL,
  result_id UUID NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Error Handling

### Search Error Types

```typescript
enum SearchErrorType {
  QUERY_TOO_SHORT = 'QUERY_TOO_SHORT',
  QUERY_TOO_LONG = 'QUERY_TOO_LONG',
  INVALID_FILTERS = 'INVALID_FILTERS',
  SEARCH_TIMEOUT = 'SEARCH_TIMEOUT',
  INDEX_UNAVAILABLE = 'INDEX_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

interface SearchError {
  type: SearchErrorType;
  message: string;
  suggestions?: string[];
  retryAfter?: number;
}
```

### Error Handling Strategies

```typescript
class SearchErrorHandler {
  handleSearchError(error: SearchError, query: SearchQuery): SearchResponse {
    switch (error.type) {
      case SearchErrorType.QUERY_TOO_SHORT:
        return {
          results: [],
          error: {
            message: "Please enter at least 2 characters to search",
            suggestions: ["Try adding more specific terms", "Use filters to narrow your search"]
          }
        };
        
      case SearchErrorType.SEARCH_TIMEOUT:
        return {
          results: [],
          error: {
            message: "Search is taking longer than expected",
            suggestions: ["Try a more specific search", "Check your connection"]
          }
        };
        
      case SearchErrorType.INDEX_UNAVAILABLE:
        // Fallback to database search
        return this.fallbackDatabaseSearch(query);
        
      default:
        return this.genericErrorResponse(error);
    }
  }
}
```

## Testing Strategy

### Unit Testing

```typescript
describe('SearchController', () => {
  describe('globalSearch', () => {
    it('should return results from all content types', async () => {
      const query = { query: 'react', contentTypes: ['users', 'posts', 'projects'] };
      const results = await searchController.globalSearch(query);
      
      expect(results.users).toBeDefined();
      expect(results.posts).toBeDefined();
      expect(results.projects).toBeDefined();
    });
    
    it('should respect privacy filters', async () => {
      const query = { query: 'test', userId: 'user1' };
      const results = await searchController.globalSearch(query);
      
      // Verify no private content from other users
      results.users.forEach(user => {
        expect(user.profileVisibility).not.toBe('private');
      });
    });
  });
});

describe('ScoringAlgorithm', () => {
  it('should calculate relevance scores correctly', () => {
    const document = createMockDocument();
    const query = createMockQuery();
    const userContext = createMockUserContext();
    
    const score = scoringAlgorithm.calculateRelevanceScore(document, query, userContext);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

### Integration Testing

```typescript
describe('Search Integration', () => {
  it('should perform end-to-end search', async () => {
    // Create test data
    await createTestUser({ name: 'John Doe', skills: ['React', 'Node.js'] });
    await createTestPost({ title: 'React Tutorial', content: 'Learn React basics' });
    
    // Perform search
    const response = await request(app)
      .get('/api/v1/search')
      .query({ q: 'react', type: 'all' })
      .expect(200);
    
    expect(response.body.users).toHaveLength(1);
    expect(response.body.posts).toHaveLength(1);
  });
  
  it('should handle concurrent searches', async () => {
    const searches = Array(10).fill(null).map(() => 
      request(app).get('/api/v1/search').query({ q: 'test' })
    );
    
    const responses = await Promise.all(searches);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

### Performance Testing

```typescript
describe('Search Performance', () => {
  it('should complete searches within 500ms', async () => {
    const startTime = Date.now();
    
    await searchController.globalSearch({
      query: 'javascript',
      contentTypes: ['users', 'posts', 'projects', 'communities']
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });
  
  it('should handle large result sets efficiently', async () => {
    // Create 1000 test documents
    await createLargeTestDataset(1000);
    
    const results = await searchController.globalSearch({
      query: 'test',
      pagination: { limit: 100 }
    });
    
    expect(results.totalResults).toBeGreaterThan(100);
    expect(results.searchTime).toBeLessThan(1000);
  });
});
```

## Campus Confidence Integration

### Encouraging Search Experience

```typescript
interface EncouragingSearchFeatures {
  // Welcome messages for new searchers
  getWelcomeMessage(isFirstSearch: boolean): string;
  
  // Positive reinforcement for discoveries
  celebrateDiscovery(discoveryType: DiscoveryType): CelebrationMessage;
  
  // Supportive empty state messages
  getEmptyStateMessage(query: string): EncouragingMessage;
  
  // Growth-focused search suggestions
  getGrowthSuggestions(userProfile: UserProfile): SearchSuggestion[];
}

interface CelebrationMessage {
  message: string;
  animation: AnimationType;
  duration: number;
}

interface EncouragingMessage {
  title: string;
  description: string;
  suggestions: string[];
  callToAction: string;
}
```

### Discovery Celebrations

```typescript
const discoveryMessages = {
  firstCommunityJoin: {
    message: "🎉 Welcome to your first community! You're going to love connecting with peers who share your interests.",
    animation: 'confetti',
    duration: 3000
  },
  skillMatchFound: {
    message: "✨ Found someone with complementary skills! This could be the start of an amazing collaboration.",
    animation: 'sparkle',
    duration: 2000
  },
  projectDiscovered: {
    message: "🚀 This project looks inspiring! Don't hesitate to reach out if you're interested in collaborating.",
    animation: 'rocket',
    duration: 2500
  }
};
```

This comprehensive design document provides a solid foundation for implementing the Search & Discovery system with algorithmic approaches, strong privacy protection, and Campus Confidence integration. The architecture is scalable, the components are well-defined, and the testing strategy ensures reliability and performance.