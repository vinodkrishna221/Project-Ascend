// Production Security Configuration for Ascend Authentication System

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  headers: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
  };
  authentication: {
    jwtExpiry: number;
    refreshTokenExpiry: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    requireMFA: boolean;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltRounds: number;
  };
  audit: {
    logLevel: string;
    retentionDays: number;
    sensitiveFields: string[];
    enableRealTimeAlerts: boolean;
  };
}

export const productionSecurityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
      'https://your-production-domain.com',
      'https://admin.your-production-domain.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  
  headers: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
  
  authentication: {
    jwtExpiry: 24 * 60 * 60, // 24 hours in seconds
    refreshTokenExpiry: 30 * 24 * 60 * 60, // 30 days in seconds
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    passwordMinLength: 12,
    requireMFA: false, // Set to true when MFA is implemented
  },
  
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltRounds: 12,
  },
  
  audit: {
    logLevel: process.env.LOG_LEVEL || 'info',
    retentionDays: 90,
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session'
    ],
    enableRealTimeAlerts: true,
  },
};

// Rate limiting configurations for different endpoints
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    message: 'Too many API requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 verification emails per hour
    message: 'Too many verification emails sent, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  collegeVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 college verification attempts per hour
    message: 'Too many college verification attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// Security headers middleware configuration
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': productionSecurityConfig.headers.contentSecurityPolicy,
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '),
};

// Input validation rules
export const validationRules = {
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    maxLength: 254,
    required: true,
  },
  
  password: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    required: true,
  },
  
  collegeName: {
    minLength: 3,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-.,&'()]+$/,
    required: true,
  },
  
  verificationCode: {
    length: 6,
    pattern: /^[0-9]{6}$/,
    required: true,
  },
};

// Sensitive data patterns for log sanitization
export const sensitiveDataPatterns = [
  /password["\s]*[:=]["\s]*[^"'\s,}]+/gi,
  /token["\s]*[:=]["\s]*[^"'\s,}]+/gi,
  /secret["\s]*[:=]["\s]*[^"'\s,}]+/gi,
  /key["\s]*[:=]["\s]*[^"'\s,}]+/gi,
  /authorization["\s]*[:=]["\s]*[^"'\s,}]+/gi,
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email addresses
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/gi, // Credit card numbers
];

// Security event types for monitoring
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHENTICATION_SUCCESS = 'auth_success',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  MALICIOUS_REQUEST = 'malicious_request',
  ACCOUNT_LOCKOUT = 'account_lockout',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  COLLEGE_VERIFICATION = 'college_verification',
  ADMIN_ACTION = 'admin_action',
}

// Security monitoring thresholds
export const securityThresholds = {
  maxFailedLogins: 5,
  maxFailedLoginsWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerMinute: 60,
  maxConcurrentSessions: 5,
  suspiciousActivityThreshold: 10,
  dataAccessAnomalyThreshold: 100,
  geolocationAnomalyEnabled: true,
  deviceFingerprintingEnabled: true,
};

export default productionSecurityConfig;