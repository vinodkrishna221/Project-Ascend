# Notification System Design Document

## Overview

The Notification System provides intelligent, context-aware communication that keeps students connected while respecting their time, preferences, and study schedules. Built on Supabase's real-time capabilities and Edge Functions, this system transforms potentially overwhelming interruptions into supportive, well-timed communications that enhance the student experience and build confidence through Campus Confidence principles.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Notification System                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Notification  │  │    Smart        │  │   Multi-Channel │ │
│  │   Controller    │  │   Scheduler     │  │   Delivery      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Batching      │  │   Campus        │  │   Analytics     │ │
│  │   Engine        │  │   Confidence    │  │   Service       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Supabase      │  │     Redis       │  │   Push/Email    │ │
│  │   Real-time     │  │     Queue       │  │   Services      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Notification Flow Architecture

```
Event Trigger → Notification Controller → Smart Scheduler → Batching Engine → Multi-Channel Delivery → User Device
     ↓                ↓                     ↓               ↓                 ↓                    ↓
Database Change → Edge Function → Timing Analysis → Group Similar → Choose Channel → Push/Email/In-App
     ↓                ↓                     ↓               ↓                 ↓                    ↓
RLS Check → Privacy Filter → User Preferences → Batch Queue → Delivery Queue → Analytics Tracking
```

## Components and Interfaces

### 1. Notification Controller

**Purpose**: Central orchestrator for all notification operations

```typescript
interface NotificationController {
  // Core notification creation and management
  createNotification(event: NotificationEvent): Promise<NotificationResult>;
  scheduleNotification(notification: Notification, timing: TimingPreferences): Promise<void>;
  cancelNotification(notificationId: string): Promise<void>;
  
  // Batch processing
  processBatchQueue(): Promise<BatchProcessResult>;
  createDigestNotification(userId: string, timeframe: TimeFrame): Promise<DigestNotification>;
  
  // Real-time event handling
  handleRealtimeEvent(event: RealtimeEvent): Promise<void>;
  processUrgentNotification(notification: UrgentNotification): Promise<void>;
}

interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  triggeredBy: string;
  data: NotificationData;
  urgency: UrgencyLevel;
  privacy: PrivacyLevel;
  context: EventContext;
}

interface NotificationResult {
  notificationId: string;
  status: 'scheduled' | 'sent' | 'batched' | 'cancelled';
  deliveryTime: Date;
  channels: DeliveryChannel[];
  batchId?: string;
}

enum NotificationEventType {
  POST_KUDOS = 'post_kudos',
  POST_COMMENT = 'post_comment',
  COLLABORATION_REQUEST = 'collaboration_request',
  COMMUNITY_MENTION = 'community_mention',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  GUILD_ANNOUNCEMENT = 'guild_announcement',
  SYSTEM_UPDATE = 'system_update'
}
```

### 2. Smart Scheduler

**Purpose**: Intelligent timing and context-aware delivery scheduling

```typescript
interface SmartScheduler {
  // Timing optimization
  calculateOptimalDeliveryTime(
    notification: Notification,
    userPreferences: UserPreferences,
    userContext: UserContext
  ): Promise<Date>;
  
  // Context analysis
  analyzeUserContext(userId: string): Promise<UserContext>;
  checkQuietHours(userId: string, proposedTime: Date): Promise<boolean>;
  respectDoNotDisturb(userId: string): Promise<boolean>;
  
  // Batch timing
  determineBatchWindow(notifications: Notification[]): Promise<BatchWindow>;
  scheduleDigestDelivery(userId: string): Promise<Date>;
}

interface UserContext {
  currentActivity: ActivityStatus;
  timeZone: string;
  studySchedule: StudySchedule;
  deviceStatus: DeviceStatus;
  recentEngagement: EngagementHistory;
  quietHours: QuietHoursConfig;
}

interface StudySchedule {
  weeklySchedule: WeeklyHours;
  examPeriods: ExamPeriod[];
  focusMode: FocusModeConfig;
  customQuietHours: CustomQuietHours[];
}

interface BatchWindow {
  startTime: Date;
  endTime: Date;
  maxNotifications: number;
  priority: BatchPriority;
}
```

### 3. Batching Engine

**Purpose**: Intelligent grouping and batching of related notifications

```typescript
interface BatchingEngine {
  // Batch creation and management
  createBatch(notifications: Notification[]): Promise<NotificationBatch>;
  addToBatch(batchId: string, notification: Notification): Promise<void>;
  finalizeBatch(batchId: string): Promise<FinalizedBatch>;
  
  // Grouping logic
  groupSimilarNotifications(notifications: Notification[]): Promise<NotificationGroup[]>;
  determineBatchEligibility(notification: Notification): Promise<boolean>;
  
  // Batch optimization
  optimizeBatchContent(batch: NotificationBatch): Promise<OptimizedBatch>;
  createBatchSummary(notifications: Notification[]): Promise<BatchSummary>;
}

interface NotificationBatch {
  batchId: string;
  userId: string;
  notifications: Notification[];
  batchType: BatchType;
  scheduledDelivery: Date;
  priority: BatchPriority;
  summary: BatchSummary;
}

interface BatchSummary {
  title: string;
  description: string;
  actionButtons: ActionButton[];
  expandedView: ExpandedContent;
  celebrationLevel: CelebrationLevel;
}

enum BatchType {
  ENGAGEMENT_BATCH = 'engagement_batch',
  COMMUNITY_BATCH = 'community_batch',
  ACHIEVEMENT_BATCH = 'achievement_batch',
  DIGEST_BATCH = 'digest_batch',
  URGENT_BATCH = 'urgent_batch'
}
```

### 4. Multi-Channel Delivery Service

**Purpose**: Coordinate delivery across push, in-app, and email channels

```typescript
interface MultiChannelDelivery {
  // Channel coordination
  determineOptimalChannels(
    notification: Notification,
    userPreferences: ChannelPreferences,
    userContext: UserContext
  ): Promise<DeliveryChannel[]>;
  
  // Delivery execution
  deliverPushNotification(notification: Notification, deviceTokens: string[]): Promise<PushResult>;
  deliverInAppNotification(notification: Notification): Promise<InAppResult>;
  deliverEmailNotification(notification: Notification): Promise<EmailResult>;
  
  // Channel management
  preventDuplicateDelivery(notification: Notification): Promise<void>;
  handleDeliveryFailure(notification: Notification, channel: DeliveryChannel): Promise<void>;
  trackDeliveryStatus(notificationId: string): Promise<DeliveryStatus>;
}

interface ChannelPreferences {
  pushNotifications: PushPreferences;
  inAppNotifications: InAppPreferences;
  emailNotifications: EmailPreferences;
  channelPriority: DeliveryChannel[];
  deviceSpecificSettings: DeviceSettings[];
}

interface PushPreferences {
  enabled: boolean;
  quietHours: QuietHoursConfig;
  urgencyThreshold: UrgencyLevel;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
}

interface DeliveryStatus {
  notificationId: string;
  channel: DeliveryChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
  timestamp: Date;
  errorMessage?: string;
  retryCount: number;
}
```

### 5. Campus Confidence Message Generator

**Purpose**: Create encouraging, supportive notification content

```typescript
interface CampusConfidenceGenerator {
  // Message generation
  generateEncouragingMessage(
    notificationType: NotificationEventType,
    context: NotificationContext,
    userProfile: UserProfile
  ): Promise<EncouragingMessage>;
  
  // Celebration content
  createCelebrationContent(
    achievement: Achievement,
    celebrationLevel: CelebrationLevel
  ): Promise<CelebrationContent>;
  
  // Supportive messaging
  generateSupportiveReminder(
    reminderType: ReminderType,
    userContext: UserContext
  ): Promise<SupportiveMessage>;
  
  // First-time user guidance
  createWelcomingGuidance(
    interactionType: InteractionType,
    isFirstTime: boolean
  ): Promise<GuidanceMessage>;
}

interface EncouragingMessage {
  title: string;
  body: string;
  tone: MessageTone;
  emoji: string;
  callToAction: string;
  supportiveElements: SupportiveElement[];
}

interface CelebrationContent {
  celebrationMessage: string;
  visualElements: VisualElement[];
  shareableContent: ShareableContent;
  nextStepSuggestions: NextStepSuggestion[];
  confidenceBooster: ConfidenceBooster;
}

enum MessageTone {
  CELEBRATORY = 'celebratory',
  ENCOURAGING = 'encouraging',
  SUPPORTIVE = 'supportive',
  INFORMATIVE = 'informative',
  GENTLE_REMINDER = 'gentle_reminder'
}
```

### 6. Privacy Filter Service

**Purpose**: Ensure notification content respects privacy settings

```typescript
interface PrivacyFilter {
  // Content filtering
  filterNotificationContent(
    notification: Notification,
    recipientId: string
  ): Promise<FilteredNotification>;
  
  // Privacy validation
  validateNotificationPrivacy(
    notification: Notification,
    recipientId: string
  ): Promise<PrivacyValidationResult>;
  
  // Anonymous content handling
  processAnonymousNotification(
    notification: Notification
  ): Promise<AnonymousNotification>;
  
  // Sensitive content protection
  protectSensitiveInformation(
    content: NotificationContent,
    privacyLevel: PrivacyLevel
  ): Promise<ProtectedContent>;
}

interface PrivacyValidationResult {
  canSend: boolean;
  contentLevel: ContentLevel;
  requiredFiltering: FilteringRule[];
  alternativeContent?: AlternativeContent;
}

interface FilteringRule {
  field: string;
  action: FilterAction;
  replacement?: string;
  reason: string;
}

enum FilterAction {
  REMOVE = 'remove',
  MASK = 'mask',
  REPLACE = 'replace',
  GENERALIZE = 'generalize'
}
```

## Data Models

### Notification Storage Schema

```sql
-- Core notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  urgency urgency_level DEFAULT 'normal',
  privacy_level privacy_level DEFAULT 'standard',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Batching
  batch_id UUID REFERENCES notification_batches(id),
  is_batched BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status notification_status DEFAULT 'pending',
  delivery_channels TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification batches
CREATE TABLE notification_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  batch_type batch_type NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  
  -- Content
  notification_count INTEGER DEFAULT 0,
  priority batch_priority DEFAULT 'normal',
  
  -- Status
  status batch_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  
  -- Channel preferences
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Timing preferences
  quiet_hours JSONB DEFAULT '{}',
  time_zone TEXT DEFAULT 'UTC',
  batch_preferences JSONB DEFAULT '{}',
  
  -- Content preferences
  notification_types JSONB DEFAULT '{}',
  celebration_level celebration_level DEFAULT 'standard',
  
  -- Privacy preferences
  privacy_mode privacy_mode DEFAULT 'standard',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification analytics
CREATE TABLE notification_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Delivery tracking
  channel delivery_channel NOT NULL,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Engagement metrics
  engagement_score DECIMAL(3,2),
  action_taken TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom types
CREATE TYPE notification_type AS ENUM (
  'post_kudos', 'post_comment', 'collaboration_request',
  'community_mention', 'achievement_unlock', 'guild_announcement',
  'system_update', 'digest', 'reminder'
);

CREATE TYPE urgency_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE privacy_level AS ENUM ('public', 'standard', 'private', 'anonymous');
CREATE TYPE notification_status AS ENUM ('pending', 'scheduled', 'sent', 'delivered', 'failed', 'cancelled');
CREATE TYPE batch_type AS ENUM ('engagement', 'community', 'achievement', 'digest', 'urgent');
CREATE TYPE batch_priority AS ENUM ('low', 'normal', 'high');
CREATE TYPE batch_status AS ENUM ('pending', 'scheduled', 'sent', 'delivered', 'failed');
CREATE TYPE delivery_channel AS ENUM ('push', 'email', 'in_app', 'sms');
CREATE TYPE celebration_level AS ENUM ('minimal', 'standard', 'enthusiastic');
CREATE TYPE privacy_mode AS ENUM ('open', 'standard', 'private', 'anonymous');
```

## Error Handling

### Notification Error Types

```typescript
enum NotificationErrorType {
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONTENT_VALIDATION_FAILED = 'CONTENT_VALIDATION_FAILED',
  SCHEDULING_CONFLICT = 'SCHEDULING_CONFLICT',
  BATCH_PROCESSING_FAILED = 'BATCH_PROCESSING_FAILED'
}

interface NotificationError {
  type: NotificationErrorType;
  message: string;
  notificationId?: string;
  userId?: string;
  channel?: DeliveryChannel;
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Recovery Strategies

```typescript
class NotificationErrorHandler {
  async handleDeliveryFailure(
    notification: Notification,
    channel: DeliveryChannel,
    error: NotificationError
  ): Promise<RecoveryResult> {
    switch (error.type) {
      case NotificationErrorType.DELIVERY_FAILED:
        return this.retryWithBackoff(notification, channel);
        
      case NotificationErrorType.RATE_LIMIT_EXCEEDED:
        return this.scheduleRetryAfterLimit(notification, error.retryAfter);
        
      case NotificationErrorType.PRIVACY_VIOLATION:
        return this.filterAndRetry(notification);
        
      default:
        return this.logAndCancel(notification, error);
    }
  }
  
  private async retryWithBackoff(
    notification: Notification,
    channel: DeliveryChannel
  ): Promise<RecoveryResult> {
    const retryDelay = this.calculateBackoffDelay(notification.retryCount);
    await this.scheduleRetry(notification, channel, retryDelay);
    return { status: 'retry_scheduled', delay: retryDelay };
  }
}
```

## Testing Strategy

### Unit Testing

```typescript
describe('NotificationController', () => {
  describe('createNotification', () => {
    it('should create notification with proper privacy filtering', async () => {
      const event = createMockNotificationEvent();
      const result = await notificationController.createNotification(event);
      
      expect(result.status).toBe('scheduled');
      expect(result.channels).toContain('push');
    });
    
    it('should respect user quiet hours', async () => {
      const event = createMockNotificationEvent();
      const userWithQuietHours = createMockUserWithQuietHours();
      
      const result = await notificationController.createNotification(event);
      
      expect(result.deliveryTime).toBeAfter(userWithQuietHours.quietHours.endTime);
    });
  });
});

describe('BatchingEngine', () => {
  it('should group similar notifications correctly', async () => {
    const notifications = createMockSimilarNotifications();
    const groups = await batchingEngine.groupSimilarNotifications(notifications);
    
    expect(groups).toHaveLength(1);
    expect(groups[0].notifications).toHaveLength(3);
  });
});
```

### Integration Testing

```typescript
describe('Notification System Integration', () => {
  it('should handle end-to-end notification flow', async () => {
    // Create notification event
    const event = await createTestNotificationEvent();
    
    // Process through system
    const result = await notificationController.createNotification(event);
    
    // Verify delivery
    await waitForDelivery(result.notificationId);
    const deliveryStatus = await getDeliveryStatus(result.notificationId);
    
    expect(deliveryStatus.status).toBe('delivered');
  });
  
  it('should handle batch processing correctly', async () => {
    const events = await createMultipleTestEvents();
    
    // Process events
    const results = await Promise.all(
      events.map(event => notificationController.createNotification(event))
    );
    
    // Verify batching
    const batchId = results[0].batchId;
    expect(results.every(r => r.batchId === batchId)).toBe(true);
  });
});
```

## Campus Confidence Integration

### Encouraging Message Templates

```typescript
const campusConfidenceTemplates = {
  firstKudos: {
    title: "🎉 Your first kudos!",
    body: "Someone appreciated your post! This is just the beginning of your amazing journey on Ascend.",
    tone: MessageTone.CELEBRATORY,
    callToAction: "See who gave you kudos",
    confidenceBooster: "Your voice matters and people are listening!"
  },
  
  collaborationRequest: {
    title: "✨ Collaboration opportunity!",
    body: "{requesterName} thinks you'd be perfect for their project. Your skills are exactly what they need!",
    tone: MessageTone.ENCOURAGING,
    callToAction: "View collaboration details",
    confidenceBooster: "Your expertise is valued by your peers!"
  },
  
  achievementUnlock: {
    title: "🏆 Achievement unlocked!",
    body: "You've reached a new milestone: {achievementName}. Your dedication is paying off!",
    tone: MessageTone.CELEBRATORY,
    callToAction: "Share your achievement",
    confidenceBooster: "Every step forward is worth celebrating!"
  }
};
```

### Celebration Animations

```typescript
interface CelebrationConfig {
  confetti: {
    duration: 3000,
    colors: ['#2563EB', '#10B981', '#F59E0B', '#F97316'],
    intensity: 'medium'
  },
  
  sparkle: {
    duration: 2000,
    pattern: 'burst',
    color: '#F59E0B'
  },
  
  pulse: {
    duration: 1000,
    scale: 1.1,
    color: '#10B981'
  }
}
```

This comprehensive design document provides a solid foundation for implementing the Notification System with intelligent scheduling, privacy protection, and Campus Confidence integration while leveraging Supabase's real-time capabilities and Edge Functions.