# Student Verification Design Document

## Overview

The Student Verification system is designed as a comprehensive, multi-layered validation platform that ensures the integrity of Ascend's student-only community while providing an exceptional user experience. The system combines automated domain validation, manual review processes, and flexible verification methods to accommodate diverse educational institutions globally. Built on Supabase's robust infrastructure, the system provides real-time status updates, secure document handling, and seamless integration with the broader Ascend platform while maintaining a student-first approach that builds trust and confidence.

## Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Applications"
        WEB[Web App<br/>Next.js]
        MOBILE[Mobile App<br/>React Native]
    end
    
    subgraph "Verification Management Layer"
        VERIFICATION_API[Verification API<br/>Custom Endpoints]
        DOMAIN_SERVICE[Domain Validation<br/>Service]
        STATE_MACHINE[Verification State<br/>Machine]
        BADGE_SERVICE[Badge Management<br/>Service]
    end
    
    subgraph "MVP Database Verification"
        ASCEND_DB_SERVICE[Ascend Database<br/>Verification Service]
        CREDENTIAL_MANAGER[Credential Management<br/>Service]
        BULK_UPLOAD[Bulk Student Data<br/>Upload Service]
    end
    
    subgraph "Manual Review System"
        REVIEW_QUEUE[Manual Review<br/>Queue Service]
        ADMIN_TOOLS[Admin Review<br/>Tools]
        DECISION_ENGINE[Decision Tracking<br/>Engine]
    end
    
    subgraph "Data Layer"
        DOMAINS[College Domains<br/>Table]
        VERIFICATION_STATES[Verification States<br/>Table]
        STUDENT_DATABASE[Student Database<br/>Table (MVP)]
        REVIEW_QUEUE_DATA[Review Queue<br/>Table]
        AUDIT_LOGS[Audit Logs<br/>Table]
    end
    
    subgraph "External Services"
        DOMAIN_VALIDATORS[Domain Validation<br/>APIs]
        EDUCATIONAL_DBS[Educational Institution<br/>Databases]
        EMAIL_SERVICE[Email Notification<br/>Service]
        SECURITY_SCANNERS[Security & Fraud<br/>Detection]
    end
    
    subgraph "Future Enhancement"
        COLLEGE_APIS[College-Managed<br/>APIs (Future)]
        MIGRATION_TOOLS[Database Migration<br/>Tools (Future)]
    end
    
    WEB --> VERIFICATION_API
    MOBILE --> VERIFICATION_API
    
    VERIFICATION_API --> DOMAIN_SERVICE
    VERIFICATION_API --> STATE_MACHINE
    VERIFICATION_API --> BADGE_SERVICE
    VERIFICATION_API --> ASCEND_DB_SERVICE
    
    DOMAIN_SERVICE --> REVIEW_QUEUE
    STATE_MACHINE --> REVIEW_QUEUE
    ASCEND_DB_SERVICE --> CREDENTIAL_MANAGER
    CREDENTIAL_MANAGER --> BULK_UPLOAD
    
    REVIEW_QUEUE --> ADMIN_TOOLS
    ADMIN_TOOLS --> DECISION_ENGINE
    
    DOMAIN_SERVICE --> DOMAINS
    STATE_MACHINE --> VERIFICATION_STATES
    ASCEND_DB_SERVICE --> STUDENT_DATABASE
    REVIEW_QUEUE --> REVIEW_QUEUE_DATA
    DECISION_ENGINE --> AUDIT_LOGS
    
    DOMAIN_SERVICE --> DOMAIN_VALIDATORS
    DOMAIN_SERVICE --> EDUCATIONAL_DBS
    VERIFICATION_API --> EMAIL_SERVICE
    DOMAIN_SERVICE --> SECURITY_SCANNERS
    
    MIGRATION_TOOLS -.-> COLLEGE_APIS
    BULK_UPLOAD -.-> MIGRATION_TOOLS
```

### MVP Strategy: Ascend-Managed Database Verification

**Phase 1 (MVP)**: Ascend manages all college student databases directly in Supabase
- Rapid deployment without requiring college technical infrastructure
- Centralized security and data quality control
- Streamlined onboarding for colleges without email systems
- Proof of concept validation before scaling

**Phase 2 (Future)**: Transition to college-managed systems
- Colleges manage their own student verification databases
- Ascend provides APIs, tools, and support for integration
- Maintains backward compatibility with MVP-verified students
- Scales verification system through distributed management

## Components and Interfaces

### Core Verification Components

#### 1. Verification Management Controller
```typescript
interface VerificationController {
  // Email verification flow
  initiateEmailVerification(email: string, userRole: UserRole): Promise<VerificationResponse>;
  verifyEmailCode(email: string, code: string): Promise<VerificationResult>;
  
  // MVP: Ascend-managed database verification
  initiateCollegeDBVerification(collegeId: string): Promise<CollegeDBForm>;
  verifyCollegeCredentials(credentials: CollegeCredentials): Promise<VerificationResult>;
  
  // Verification status management
  getVerificationStatus(userId: string): Promise<VerificationStatus>;
  updateVerificationStatus(userId: string, status: VerificationState, reason?: string): Promise<void>;
  
  // Manual review
  submitForManualReview(userId: string, evidence: ReviewEvidence): Promise<ReviewSubmission>;
  getReviewStatus(reviewId: string): Promise<ReviewStatus>;
}
```

#### 2. Domain Validation Service
```typescript
interface DomainValidationService {
  validateDomain(domain: string): Promise<DomainValidationResult>;
  addDomainToWhitelist(domain: string, validationData: DomainData): Promise<void>;
  removeDomainFromWhitelist(domain: string, reason: string): Promise<void>;
  getDomainStatus(domain: string): Promise<DomainStatus>;
  bulkValidateDomains(domains: string[]): Promise<BulkValidationResult>;
  
  // Automated validation algorithms
  checkEducationalDomainPatterns(domain: string): Promise<PatternMatchResult>;
  validateDNSRecords(domain: string): Promise<DNSValidationResult>;
  checkInstitutionalWebsite(domain: string): Promise<WebsiteValidationResult>;
  scanDomainReputation(domain: string): Promise<ReputationResult>;
}

interface DomainValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  validationMethod: 'automatic' | 'manual_required';
  reasons: string[];
  institutionInfo?: InstitutionInfo;
  requiresReview: boolean;
}
```

#### 3. MVP College Database Service (Ascend-Managed)
```typescript
interface CollegeDBService {
  // MVP: Ascend administrators manage college data
  createCollegeDatabase(collegeId: string, collegeInfo: CollegeInfo): Promise<void>;
  bulkUploadStudents(collegeId: string, students: StudentRecord[], uploadedBy: string): Promise<BulkUploadResult>;
  addStudentRecord(collegeId: string, student: StudentRecord, addedBy: string): Promise<void>;
  
  // Student verification against Ascend-managed database
  verifyStudentCredentials(credentials: CollegeCredentials): Promise<CredentialVerificationResult>;
  markCredentialsAsUsed(studentId: string, userId: string): Promise<void>;
  
  // Database management
  updateStudentRecord(studentId: string, updates: StudentRecordUpdate): Promise<void>;
  deactivateExpiredRecords(collegeId: string): Promise<void>;
  getCollegeDatabaseStats(collegeId: string): Promise<DatabaseStats>;
  
  // Future: Migration preparation
  prepareForCollegeMigration(collegeId: string): Promise<MigrationPlan>;
  exportCollegeData(collegeId: string): Promise<ExportData>;
}

interface StudentRecord {
  studentName: string;
  branch: string;
  year: number;
  rollNumber?: string;
  verificationPassword: string; // Will be hashed
  email?: string; // Optional for future email integration
  graduationDate?: Date;
  isActive: boolean;
}

interface CollegeCredentials {
  collegeId: string;
  studentName: string;
  branch: string;
  year: number;
  verificationPassword: string;
  rollNumber?: string;
}
```

#### 4. Verification State Machine
```typescript
interface VerificationStateMachine {
  getCurrentState(userId: string): Promise<VerificationState>;
  transitionState(userId: string, newState: VerificationState, context: StateTransitionContext): Promise<void>;
  getValidTransitions(currentState: VerificationState): Promise<VerificationState[]>;
  getStateHistory(userId: string): Promise<StateTransition[]>;
  
  // State validation
  canTransition(currentState: VerificationState, targetState: VerificationState): boolean;
  validateTransitionContext(transition: StateTransition): Promise<ValidationResult>;
}

enum VerificationState {
  PENDING = 'pending',
  EMAIL_SENT = 'email_sent',
  EMAIL_VERIFIED = 'email_verified',
  DB_VERIFICATION_REQUIRED = 'db_verification_required',
  DB_VERIFIED = 'db_verified',
  MANUAL_REVIEW = 'manual_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  ALUMNI = 'alumni'
}

interface StateTransitionContext {
  reason: string;
  triggeredBy: 'user' | 'system' | 'admin';
  evidence?: any;
  adminId?: string;
  automaticTransition?: boolean;
}
```

#### 5. Manual Review Service
```typescript
interface ManualReviewService {
  submitForReview(userId: string, reviewType: ReviewType, evidence: ReviewEvidence): Promise<ReviewSubmission>;
  getReviewQueue(filters: ReviewQueueFilters): Promise<ReviewQueueItem[]>;
  assignReview(reviewId: string, adminId: string): Promise<void>;
  completeReview(reviewId: string, decision: ReviewDecision): Promise<void>;
  
  // Review management
  escalateReview(reviewId: string, reason: string): Promise<void>;
  getReviewHistory(userId: string): Promise<ReviewHistory[]>;
  getReviewMetrics(timeRange: TimeRange): Promise<ReviewMetrics>;
}

enum ReviewType {
  DOMAIN_VALIDATION = 'domain_validation',
  INTERNATIONAL_COLLEGE = 'international_college',
  DOCUMENT_VERIFICATION = 'document_verification',
  APPEAL = 'appeal',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  EDGE_CASE = 'edge_case'
}

interface ReviewEvidence {
  documents?: DocumentUpload[];
  explanation: string;
  contactInfo?: ContactInfo;
  institutionInfo?: InstitutionInfo;
  previousAttempts?: string[];
}

interface ReviewDecision {
  approved: boolean;
  reason: string;
  conditions?: string[];
  followUpRequired?: boolean;
  newVerificationState: VerificationState;
}
```

#### 6. Verification Badge Service
```typescript
interface BadgeService {
  getBadgeForUser(userId: string): Promise<VerificationBadge>;
  updateBadge(userId: string, verificationData: VerificationData): Promise<void>;
  getBadgeHierarchy(): Promise<BadgeHierarchy>;
  
  // Badge display and trust signals
  formatBadgeForContext(badge: VerificationBadge, context: DisplayContext): Promise<FormattedBadge>;
  getTrustScore(userId: string): Promise<TrustScore>;
  getBadgeExplanation(badgeType: BadgeType): Promise<BadgeExplanation>;
}

interface VerificationBadge {
  type: BadgeType;
  level: BadgeLevel;
  verificationMethod: VerificationMethod;
  issuedAt: Date;
  expiresAt?: Date;
  trustScore: number;
  displayText: string;
  hoverText: string;
}

enum BadgeType {
  EMAIL_VERIFIED = 'email_verified',
  DATABASE_VERIFIED = 'database_verified',
  MANUALLY_VERIFIED = 'manually_verified',
  ALUMNI_VERIFIED = 'alumni_verified',
  INTERNATIONAL_VERIFIED = 'international_verified'
}

enum BadgeLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  INSTITUTIONAL = 'institutional'
}
```

### User Interface Components

#### 1. Verification Flow Components (Mobile)
```typescript
interface VerificationScreens {
  VerificationWelcomeScreen: React.FC<WelcomeProps>;
  EmailVerificationScreen: React.FC<EmailVerificationProps>;
  CollegeSelectionScreen: React.FC<CollegeSelectionProps>;
  CollegeCredentialsScreen: React.FC<CollegeCredentialsProps>;
  DocumentUploadScreen: React.FC<DocumentUploadProps>;
  VerificationStatusScreen: React.FC<StatusScreenProps>;
  ManualReviewScreen: React.FC<ManualReviewProps>;
  VerificationCompleteScreen: React.FC<CompleteScreenProps>;
}

interface CollegeCredentialsProps {
  college: College;
  onSubmit: (credentials: CollegeCredentials) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
  helpText: string;
}
```

#### 2. Admin Interface Components
```typescript
interface AdminComponents {
  DomainManagementDashboard: React.FC<DomainDashboardProps>;
  ReviewQueueDashboard: React.FC<ReviewQueueProps>;
  BulkStudentUpload: React.FC<BulkUploadProps>;
  VerificationAnalytics: React.FC<AnalyticsProps>;
  CollegeDatabaseManager: React.FC<DatabaseManagerProps>;
}

interface BulkUploadProps {
  collegeId: string;
  onUpload: (file: File) => Promise<BulkUploadResult>;
  onValidate: (data: StudentRecord[]) => Promise<ValidationResult>;
  uploadHistory: UploadHistory[];
  isProcessing: boolean;
}
```

## Data Models

### Core Verification Data Structure

#### 1. Enhanced College Domains Table
```sql
CREATE TABLE college_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE, -- Nullable for colleges without email domains
  college_name TEXT NOT NULL,
  country TEXT NOT NULL,
  
  -- Domain validation
  validation_status domain_validation_status DEFAULT 'pending',
  validation_method validation_method DEFAULT 'automatic',
  validation_confidence INTEGER DEFAULT 0, -- 0-100
  validation_date TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  
  -- Domain properties
  provides_email BOOLEAN DEFAULT TRUE,
  domain_type domain_type DEFAULT 'standard',
  is_active BOOLEAN DEFAULT TRUE,
  requires_manual_review BOOLEAN DEFAULT FALSE,
  
  -- Institution information
  institution_info JSONB DEFAULT '{}',
  website_url TEXT,
  contact_email TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_validated TIMESTAMPTZ,
  
  -- Analytics
  student_count INTEGER DEFAULT 0,
  verification_success_rate DECIMAL(5,2) DEFAULT 0.00
);

CREATE TYPE domain_validation_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'under_review');
CREATE TYPE validation_method AS ENUM ('automatic', 'manual', 'bulk_import', 'partnership');
CREATE TYPE domain_type AS ENUM ('standard', 'international', 'database_only', 'special_case');
```

#### 2. MVP College Student Database (Ascend-Managed)
```sql
CREATE TABLE college_student_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID REllege_domains(id) NOT NULL,
  
  -- Student informationfor admin operations
CREAudent_name TEXT NOT NULL,
  brancID DEFAUOT NULL,
  year INTEd UUID REULL,
  rolladed_by UUIT,
  T, -- Optionar funtegran
  
  -- Verame Ttion credentials
  filefication_EGERword TEXT NOT NULL, --hed with bcrypt
  password_hash INTEGER INTEGER DEFAULT 1, -- Fture hash up
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,0,
  ed BOOLEAALSE,
  u- d_by UUID REFEREsles(id),
  upload_sTIMESTAMPTZ,
  
  compxpiration and graduation
  error_log Jdate DATE,
  t TIMESTAMPTZ,
  -- Validation
  validtadata and audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REprofiles(id) NOT NULL, -- Ascend admin who added
  updatedIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  
  -- Data source trac
  upload_batch_idID, -- For bulk uploads
  data_source TEXT DEFAULT 'manual', -- 'manual', 'bulk_upload', 'api_import'
  
  -- Ensure uniqueness per college
  UNIQUE(: Colle_id, student_nament (dish, year),
  UNIQ TABLE col_id, verification_password),
  
  co Prevent dupl Rate usage
  (college_id,y) WHERE used_by IS NOT NULL
);

-- Index for efficient loL,s
CREATE INDEe TEX_college_student_db_college_id ON college_student_database(college_id);
CREATE INDEX idx_college_student_db_active ON college_student_database(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_college_student_db_unused ON collestudent_database(is_used) WHERE is_uLSE;
```

#### 3. Verification States ane,
    "can_view_analytics": true,
    "can_manage_admins": false
  }',
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  onboarded_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  
  -- Management
  created_by UUID REFERENCES profiles(id) NOT NULL, -- Ascend admin who onboarded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- MVP: This table exists but is not used until Phase 2
  enabled BOOLEAN DEFAULT FALSE
);

-- Future: College-managed student database migration
CREATE TABLE college_database_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID REFERENCES guilds(id) NOT NULL,
  
  -- Migration details
  migration_type migration_type NOT NULL,
  migration_status migration_status DEFAULT 'planned',
  
  -- Data migration
  records_to_migrate INTEGER,
  records_migrated INTEGER DEFAULT 0,
  migration_started_at TIMESTAMPTZ,
  migration_completed_at TIMESTAMPTZ,
  
  -- Rollback capability
  can_rollback BOOLEAN DEFAULT TRUE,
  rollback_deadline TIMESTAMPTZ,
  
  -- Management
  initiated_by UUID REFERENCES profiles(id) NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE migration_type AS ENUM (
  'ascend_to_college', 'college_to_ascend', 'college_to_college'
);

CREATE TYPE migration_status AS ENUM (
  'planned', 'in_progress', 'completed', 'failed', 'rolled_back'
);
```

#### 5. Verification Audit and Analytics
```sql
CREATE TABLE verification_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Event details
  event_type audit_event_type NOT NULL,
  user_id UUID REFERENCES profiles(id),
  admin_id UUID REFERENCES profiles(id),
  
  -- Context
  college_id UUID REFERENCES guilds(id),
  domain_id UUID REFERENCES college_domains(id),
  verification_state_before verification_state,
  verification_state_after verification_state,
  
  -- Event data
  event_data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  severity audit_severity DEFAULT 'info'
);

CREATE TYPE audit_event_type AS ENUM (
  'verification_attempt', 'verification_success', 'verification_failure',
  'state_transition', 'admin_action', 'domain_validation',
  'bulk_upload', 'security_event', 'migration_event'
);

CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'error', 'critical');

-- Verification analytics aggregation
CREATE TABLE verification_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Time period
  date DATE NOT NULL,
  hour INTEGER, -- For hourly aggregation
  
  -- Scope
  college_id UUID REFERENCES guilds(id),
  domain_id UUID REFERENCES college_domains(id),
  
  -- Metrics
  verification_attempts INTEGER DEFAULT 0,
  verification_successes INTEGER DEFAULT 0,
  verification_failures INTEGER DEFAULT 0,
  
  -- Method breakdown
  email_verifications INTEGER DEFAULT 0,
  database_verifications INTEGER DEFAULT 0,
  manual_verifications INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_processing_time_seconds DECIMAL(10,2),
  median_processing_time_seconds DECIMAL(10,2),
  
  -- Quality metrics
  false_positive_rate DECIMAL(5,4),
  false_negative_rate DECIMAL(5,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, hour, college_id, domain_id)
);
```

### Badge and Trust System

#### 1. Verification Badges
```sql
CREATE TABLE verification_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,scalated');
```

#### 6. Bulk Upload Tracking
```sql
CREATE TABLE bulk_upload_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID REFERENCES college_domains(id) NOT NULL,
  
  -- Upload details
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  
  -- Processing status
  status upload_status DEFAULT 'processing',
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  
  -- Results
  validation_errors JSONB DEFAULT '[]',
  processing_log JSONB DEFAULT '[]',
  
  -- Timing
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  rollback_available BOOLEAN DEFAULT TRUE
);

CREATE TYPE upload_status AS ENUM ('processing', 'completed', 'failed', 'cancelled', 'rolled_back');
```

## Security Considerations

### MVP Database Security

#### 1. Credential Security
```typescript
// Secure password hashing for college database credentials
const hashVerificationPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // High security for verification passwords
  return await bcrypt.hash(password, saltRounds);
};

// Secure credential verification
const verifyCredentials = async (
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Password strength validation for bulk uploads
const validatePasswordStrength = (password: string): ValidationResult => {
  const minLength = 8;
  const hasNumbers = /\d/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasNumbers && hasLetters,
    suggestions: [
      'Use at least 8 characters',
      'Include numbers and letters',
      'Consider special characters for extra security'
    ]
  };
};
```

#### 2. Access Control and Audit
```sql
-- Row Level Security for college database access
CREATE POLICY "Ascend admins can manage college databases" ON college_student_database
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'platform_admin' OR role = 'college_admin'
    )
  );

-- Students can only verify against unused records
CREATE POLICY "Students can verify unused credentials" ON college_student_database
  FOR SELECT USING (
    is_active = TRUE AND 
    is_used = FALSE AND 
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Comprehensive audit logging
CREATE OR REPLACE FUNCTION log_verification_attempt()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO verification_audit_log (
    user_id, action, table_name, record_id, 
    old_data, new_data, ip_address, user_agent
  ) VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, 
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD), to_jsonb(NEW),
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER audit_college_database_changes
  AFTER INSERT OR UPDATE OR DELETE ON college_student_database
  FOR EACH ROW EXECUTE FUNCTION log_verification_attempt();
```

#### 3. Rate Limiting and Abuse Prevention
```typescript
// Rate limiting for verification attempts
interface RateLimitConfig {
  emailVerification: {
    maxAttempts: 5;
    windowMinutes: 15;
    lockoutMinutes: 60;
  };
  databaseVerification: {
    maxAttempts: 3;
    windowMinutes: 10;
    lockoutMinutes: 30;
  };
  manualReview: {
    maxSubmissions: 2;
    windowHours: 24;
  };
}

const checkRateLimit = async (
  userId: string, 
  action: string
): Promise<RateLimitResult> => {
  const config = rateLimitConfig[action];
  const attempts = await getRecentAttempts(userId, action, config.windowMinutes);
  
  if (attempts.length >= config.maxAttempts) {
    const oldestAttempt = attempts[attempts.length - 1];
    const lockoutEnds = new Date(oldestAttempt.timestamp.getTime() + 
      config.lockoutMinutes * 60 * 1000);
    
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutEnds,
      message: `Too many attempts. Try again after ${lockoutEnds.toLocaleTimeString()}`
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - attempts.length,
    lockoutEnds: null
  };
};
```

## Testing Strategy

### Unit Testing Approach

#### 1. Verification Service Testing
```typescript
describe('CollegeDBService', () => {
  describe('verifyStudentCredentials', () => {
    it('should verify valid credentials successfully', async () => {
      const credentials = {
        collegeId: 'test-college',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'test-password'
      };
      
      const result = await collegeDBService.verifyStudentCredentials(credentials);
      expect(result.verified).toBe(true);
      expect(result.studentRecord).toBeDefined();
    });
    
    it('should reject invalid credentials', async () => {
      const credentials = {
        collegeId: 'test-college',
        studentName: 'John Doe',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'wrong-password'
      };
      
      const result = await collegeDBService.verifyStudentCredentials(credentials);
      expect(result.verified).toBe(false);
      expect(result.reason).toContain('Invalid credentials');
    });
    
    it('should prevent reuse of credentials', async () => {
      // First use should succeed
      const credentials = {
        collegeId: 'test-college',
        studentName: 'Jane Doe',
        branch: 'Engineering',
        year: 2024,
        verificationPassword: 'unique-password'
      };
      
      const firstResult = await collegeDBService.verifyStudentCredentials(credentials);
      expect(firstResult.verified).toBe(true);
      
      await collegeDBService.markCredentialsAsUsed(firstResult.studentRecord.id, 'user-1');
      
      // Second use should fail
      const secondResult = await collegeDBService.verifyStudentCredentials(credentials);
      expect(secondResult.verified).toBe(false);
      expect(secondResult.reason).toContain('already been used');
    });
  });
});
```

#### 2. State Machine Testing
```typescript
describe('VerificationStateMachine', () => {
  describe('state transitions', () => {
    it('should allow valid state transitions', async () => {
      const userId = 'test-user';
      await stateMachine.transitionState(userId, VerificationState.PENDING, {
        reason: 'Initial state',
        triggeredBy: 'system'
      });
      
      const canTransition = await stateMachine.canTransition(
        VerificationState.PENDING, 
        VerificationState.EMAIL_SENT
      );
      expect(canTransition).toBe(true);
    });
    
    it('should prevent invalid state transitions', async () => {
      const canTransition = await stateMachine.canTransition(
        VerificationState.VERIFIED, 
        VerificationState.PENDING
      );
      expect(canTransition).toBe(false);
    });
  });
});
```

### Integration Testing

#### 1. End-to-End Verification Flow
```typescript
describe('Complete Verification Flow', () => {
  it('should complete email verification successfully', async () => {
    // Initiate verification
    const initResponse = await request(app)
      .post('/api/v1/verification/email/initiate')
      .send({ email: 'student@testcollege.edu' })
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(initResponse.status).toBe(200);
    
    // Verify code
    const verifyResponse = await request(app)
      .post('/api/v1/verification/email/verify')
      .send({ 
        email: 'student@testcollege.edu',
        code: 'test-code'
      })
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.verificationStatus).toBe('verified');
  });
  
  it('should complete database verification successfully', async () => {
    // Select college without email
    const collegeResponse = await request(app)
      .get('/api/v1/verification/colleges/database-only')
      .set('Authorization', `Bearer ${userToken}`);
    
    const college = collegeResponse.body.data[0];
    
    // Submit credentials
    const verifyResponse = await request(app)
      .post('/api/v1/verification/database/verify')
      .send({
        collegeId: college.id,
        studentName: 'Test Student',
        branch: 'Computer Science',
        year: 2024,
        verificationPassword: 'test-password'
      })
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.verificationStatus).toBe('verified');
  });
});
```

## Performance Optimization

### Database Optimization

#### 1. Efficient Verification Queries
```sql
-- Optimized credential lookup with proper indexing
CREATE INDEX idx_college_db_lookup ON college_student_database(
  college_id, student_name, branch, year
) WHERE is_active = TRUE AND is_used = FALSE;

-- Partial index for unused credentials
CREATE INDEX idx_college_db_unused ON college_student_database(college_id) 
WHERE is_active = TRUE AND is_used = FALSE;

-- Composite index for verification status queries
CREATE INDEX idx_verification_status_lookup ON user_verification_states(
  user_id, current_state, verification_method
);
```

#### 2. Caching Strategy
```typescript
// Cache frequently accessed domain validation results
const cacheDomainValidation = async (domain: string, result: DomainValidationResult) => {
  const cacheKey = `domain_validation:${domain}`;
  const ttl = result.isValid ? 86400 : 3600; // 24h for valid, 1h for invalid
  
  await supabase
    .from('verification_cache')
    .upsert({
      cache_key: cacheKey,
      data: result,
      expires_at: new Date(Date.now() + ttl * 1000)
    });
};

// Cache college database stats for admin dashboards
const cacheCollegeStats = async (collegeId: string) => {
  const stats = await calculateCollegeStats(collegeId);
  const cacheKey = `college_stats:${collegeId}`;
  
  await supabase
    .from('verification_cache')
    .upsert({
      cache_key: cacheKey,
      data: stats,
      expires_at: new Date(Date.now() + 300 * 1000) // 5 minutes
    });
};
```

## Real-Time Features Implementation

### Verification Status Updates

#### 1. Real-Time Status Propagation
```typescript
// Real-time verification status updates
const subscribeToVerificationUpdates = (userId: string) => {
  return supabase
    .channel(`verification-${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_verification_states',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      const newState = payload.new as VerificationState;
      handleVerificationStateChange(newState);
    })
    .subscribe();
};

// Real-time badge updates
const subscribeToProfileUpdates = (userId: string) => {
  return supabase
    .channel(`profile-verification-${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`
    }, (payload) => {
      if (payload.new.verification_status !== payload.old.verification_status) {
        updateVerificationBadge(payload.new);
      }
    })
    .subscribe();
};
```

#### 2. Admin Dashboard Real-Time Updates
```typescript
// Real-time review queue updates for admins
const subscribeToReviewQueue = (adminId: string) => {
  return supabase
    .channel('admin-review-queue')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'verification_review_queue'
    }, (payload) => {
      updateReviewQueueDisplay(payload);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bulk_upload_batches'
    }, (payload) => {
      notifyNewBulkUpload(payload.new);
    })
    .subscribe();
};
```

## Deployment Architecture

### Supabase Configuration

#### 1. Database Setup and Migrations
```sql
-- Migration: 001_create_verification_tables.sql
BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE domain_validation_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'under_review');
CREATE TYPE verification_state AS ENUM ('pending', 'email_sent', 'email_verified', 'db_verification_required', 'db_verified', 'manual_review', 'verified', 'rejected', 'suspended', 'expired', 'alumni');
CREATE TYPE verification_method AS ENUM ('email', 'college_database', 'manual', 'document', 'alumni_network');

-- Create tables
CREATE TABLE college_domains (...);
CREATE TABLE college_student_database (...);
CREATE TABLE user_verification_states (...);
CREATE TABLE verification_state_history (...);
CREATE TABLE verification_review_queue (...);
CREATE TABLE bulk_upload_batches (...);

-- Create indexes
CREATE INDEX idx_college_student_db_college_id ON college_student_database(college_id);
CREATE INDEX idx_verification_status_lookup ON user_verification_states(user_id, current_state);

-- Enable RLS
ALTER TABLE college_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_student_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_states ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active domains" ON college_domains
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage verification" ON user_verification_states
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('platform_admin', 'college_admin'))
    OR auth.uid() = user_id
  );

COMMIT;
```

#### 2. Edge Functions for Verification Processing
```typescript
// Edge function: process-verification
export const processVerification = async (req: Request) => {
  const { userId, verificationType, data } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  try {
    switch (verificationType) {
      case 'email':
        return await processEmailVerification(supabase, userId, data);
      case 'college_database':
        return await processCollegeDBVerification(supabase, userId, data);
      case 'manual_review':
        return await submitForManualReview(supabase, userId, data);
      default:
        throw new Error('Invalid verification type');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

const processCollegeDBVerification = async (
  supabase: SupabaseClient,
  userId: string,
  credentials: CollegeCredentials
) => {
  // Verify credentials against college database
  const { data: studentRecord, error } = await supabase
    .from('college_student_database')
    .select('*')
    .eq('college_id', credentials.collegeId)
    .eq('student_name', credentials.studentName)
    .eq('branch', credentials.branch)
    .eq('year', credentials.year)
    .eq('is_active', true)
    .eq('is_used', false)
    .single();
    
  if (error || !studentRecord) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Student record not found or already used' 
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify password
  const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
  const passwordMatch = await bcrypt.compare(
    credentials.verificationPassword, 
    studentRecord.verification_password
  );
  
  if (!passwordMatch) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid verification password' 
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Mark credentials as used and update verification status
  await supabase.rpc('complete_database_verification', {
    p_user_id: userId,
    p_student_record_id: studentRecord.id,
    p_college_id: credentials.collegeId
  });
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      verificationStatus: 'verified',
      verificationMethod: 'college_database'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
```

This comprehensive design document provides the foundation for implementing Ascend's student verification system with the MVP approach of Ascend-managed college databases, while preparing for future transition to college-managed systems. The design emphasizes security, user experience, and scalability while maintaining the student-first philosophy.

#### 1. MVP Configuration
```env
# Su      eronfiguration
Sror: 'CRERL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=yDEr-service-role-key

# Domain Validation Services
DOMAIN_VALIDATION_ANTIALS_ALREAdomain-api-key
EDUCATIONAL_DB_API_KEY=your-edu-db-key

# Security
BCRYPT_ROUNDS=12
VERIFIDY_USED' KEN_EXPIRY=900000 utes

#ting
VERIFICATION_RATE_LIMIT_WINDOW=3600000  # r
VERIFIC_LIMIT_MAX_ATT5

# MVP: Admin Configuration
ASCEND_ADMIN_EMAILS=admin1@,admin2@ascend.c
   K_UPLOAD_MAX_SIZE=10 }), { status: 409 });
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    studentId: student.id,
    collegeId: student.college_id
  }));
};TCH_SIZE=1000

# Future: Advanced tics
ANALYTICSNTION_DAYS=365
REPORTING_SCHEDULE=daily
```

## Real-Time Features Implementation

### Supabase Real-Time Integration

#### 1. Verification Status Updates
```typescript
// Real-time verification status updates
const subscribeToVerificationUpdates = (userId: string) => {
  return supabase
    .channel(`verification-${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_verification_states',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      handleVerificationStatusChange(payload.new);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'verification_badges',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      handleNewBadge(payload.new);
    })
    .subscribe();
};
```

#### 2. Admin Dashboard Real-Time Updates
```typescript
// Real-time admin dashboard updates
const subscribeToAdminUpdates = () => {
  return supabase
    .channel('admin-verification-queue')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'manual_review_queue'
    }, (payload) => {
      updateReviewQueueDisplay(payload);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'student_data_uploads'
    }, (payload) => {
      updateBulkUploadStatus(payload.new);
    })
    .subscribe();
};
```

## Future Migration Strategy

### Phase 2: College-Managed Database Transition

#### 1. Migration Planning
```typescript
interface MigrationPlan {
  collegeId: string;
  currentStudentCount: number;
  estimatedMigrationTime: number;
  requiredCollegePreparation: string[];
  riskAssessment: RiskLevel;
  rollbackPlan: RollbackStrategy;
  
  phases: MigrationPhase[];
}

interface MigrationPhase {
  name: string;
  description: string;
  duration: number;
  dependencies: string[];
  successCriteria: string[];
  rollbackTriggers: string[];
}
```

#### 2. College Onboarding Process
```typescript
interface CollegeOnboardingFlow {
  // Phase 1: Initial Assessment
  assessCollegeReadiness(collegeId: string): Promise<ReadinessAssessment>;
  
  // Phase 2: Technical Setup
  provideIntegrationTools(collegeId: string): Promise<IntegrationPackage>;
  setupCollegeAPI(collegeId: string, apiConfig: APIConfig): Promise<void>;
  
  // Phase 3: Data Migration
  migrateStudentData(collegeId: string, migrationPlan: MigrationPlan): Promise<MigrationResult>;
  
  // Phase 4: Validation and Go-Live
  validateMigration(collegeId: string): Promise<ValidationResult>;
  activateCollegeManagement(collegeId: string): Promise<void>;
  
  // Phase 5: Support and Monitoring
  provideContinuousSupport(collegeId: string): Promise<SupportPlan>;
}
```

#### 3. Backward Compatibility
```typescript
// Ensure MVP-verified students maintain access during transition
const maintainBackwardCompatibility = async (collegeId: string) => {
  // Preserve existing verification statuses
  await preserveExistingVerifications(collegeId);
  
  // Create mapping between old and new systems
  await createVerificationMapping(collegeId);
  
  // Ensure seamless user experience
  await updateUserInterfaces(collegeId);
  
  // Monitor for any access issues
  await setupCompatibilityMonitoring(collegeId);
};
```

This comprehensive design document provides the foundation for implementing Ascend's student verification system with a clear MVP strategy using Ascend-managed databases, while preparing for future scalability through college-managed systems. The design maintains the student-first philosophy while ensuring robust security and seamless user experience.
```

This comprehensive design document provides the foundation for implementing Ascend's student verification system with a clear MVP strategy that transitions from Ascend-managed to college-managed verification while maintaining security, scalability, and the student-first experience.