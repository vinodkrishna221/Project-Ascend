/**
 * Comprehensive Error Handling System for Authentication Flow
 * 
 * This module provides:
 * - Error classification and standardized error codes
 * - User-friendly error messages with recovery steps
 * - Automatic retry mechanisms for transient failures
 * - Fallback options for service unavailability
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

// Error Categories
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  SERVICE = 'SERVICE',
  RATE_LIMIT = 'RATE_LIMIT',
  VERIFICATION = 'VERIFICATION',
  SYSTEM = 'SYSTEM'
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Standardized Error Codes
export enum ErrorCode {
  // Email Verification Errors (4.1, 4.5)
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  EMAIL_INVALID_FORMAT = 'EMAIL_INVALID_FORMAT',
  EMAIL_DOMAIN_NOT_RECOGNIZED = 'EMAIL_DOMAIN_NOT_RECOGNIZED',
  VERIFICATION_CODE_EXPIRED = 'VERIFICATION_CODE_EXPIRED',
  VERIFICATION_CODE_INVALID = 'VERIFICATION_CODE_INVALID',
  VERIFICATION_CODE_ATTEMPTS_EXCEEDED = 'VERIFICATION_CODE_ATTEMPTS_EXCEEDED',
  
  // College Database Verification Errors (4.6)
  COLLEGE_CREDENTIALS_INVALID = 'COLLEGE_CREDENTIALS_INVALID',
  COLLEGE_STUDENT_NOT_FOUND = 'COLLEGE_STUDENT_NOT_FOUND',
  COLLEGE_CREDENTIALS_ALREADY_USED = 'COLLEGE_CREDENTIALS_ALREADY_USED',
  COLLEGE_DATABASE_UNAVAILABLE = 'COLLEGE_DATABASE_UNAVAILABLE',
  
  // Network and Service Errors (4.4)
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // Rate Limiting Errors (4.3)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Validation Errors
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  INPUT_TOO_SHORT = 'INPUT_TOO_SHORT',
  INPUT_TOO_LONG = 'INPUT_TOO_LONG'
}

// Recovery Action Types
export enum RecoveryAction {
  RETRY = 'RETRY',
  RETRY_WITH_DELAY = 'RETRY_WITH_DELAY',
  RESEND_CODE = 'RESEND_CODE',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  REQUEST_DOMAIN_ADDITION = 'REQUEST_DOMAIN_ADDITION',
  CONTACT_COLLEGE_ADMIN = 'CONTACT_COLLEGE_ADMIN',
  WAIT_AND_RETRY = 'WAIT_AND_RETRY',
  REFRESH_PAGE = 'REFRESH_PAGE',
  CHECK_CONNECTION = 'CHECK_CONNECTION',
  TRY_ALTERNATIVE_METHOD = 'TRY_ALTERNATIVE_METHOD'
}

// Structured Error Interface
export interface AuthError {
  code: ErrorCode
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  userMessage: string
  recoverySteps: RecoveryStep[]
  retryable: boolean
  retryDelay?: number
  maxRetries?: number
  context?: Record<string, any>
  timestamp: Date
  requestId?: string
}

// Recovery Step Interface
export interface RecoveryStep {
  action: RecoveryAction
  label: string
  description: string
  url?: string
  automated?: boolean
  delay?: number
}

// Error Classification Map
export const ERROR_DEFINITIONS: Record<ErrorCode, Omit<AuthError, 'timestamp' | 'context' | 'requestId'>> = {
  // Email Verification Errors
  [ErrorCode.EMAIL_SEND_FAILED]: {
    code: ErrorCode.EMAIL_SEND_FAILED,
    category: ErrorCategory.SERVICE,
    severity: ErrorSeverity.MEDIUM,
    message: 'Failed to send verification email',
    userMessage: 'We couldn\'t send the verification email right now. This might be a temporary issue.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again',
        description: 'Click to resend the verification email'
      },
      {
        action: RecoveryAction.CHECK_CONNECTION,
        label: 'Check Connection',
        description: 'Make sure you have a stable internet connection'
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'If the problem persists, contact our support team',
        url: '/support'
      }
    ],
    retryable: true,
    retryDelay: 5000,
    maxRetries: 3
  },

  [ErrorCode.EMAIL_DOMAIN_NOT_RECOGNIZED]: {
    code: ErrorCode.EMAIL_DOMAIN_NOT_RECOGNIZED,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Email domain not recognized as a college domain',
    userMessage: 'We don\'t recognize this email domain as belonging to a college. You can request to add your college.',
    recoverySteps: [
      {
        action: RecoveryAction.REQUEST_DOMAIN_ADDITION,
        label: 'Request College Addition',
        description: 'Submit a request to add your college to our system',
        url: '/request-college'
      },
      {
        action: RecoveryAction.TRY_ALTERNATIVE_METHOD,
        label: 'Try Alternative Verification',
        description: 'Use college database verification if your college doesn\'t provide email addresses'
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'Get help with college verification',
        url: '/support'
      }
    ],
    retryable: false
  },

  [ErrorCode.VERIFICATION_CODE_EXPIRED]: {
    code: ErrorCode.VERIFICATION_CODE_EXPIRED,
    category: ErrorCategory.VERIFICATION,
    severity: ErrorSeverity.LOW,
    message: 'Verification code has expired',
    userMessage: 'Your verification code has expired. Don\'t worry, we can send you a new one!',
    recoverySteps: [
      {
        action: RecoveryAction.RESEND_CODE,
        label: 'Get New Code',
        description: 'We\'ll send a fresh verification code to your email',
        automated: true
      }
    ],
    retryable: true,
    maxRetries: 5
  },

  [ErrorCode.VERIFICATION_CODE_INVALID]: {
    code: ErrorCode.VERIFICATION_CODE_INVALID,
    category: ErrorCategory.VERIFICATION,
    severity: ErrorSeverity.LOW,
    message: 'Invalid verification code',
    userMessage: 'The verification code you entered doesn\'t match. Please check and try again.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again',
        description: 'Double-check the code in your email and enter it again'
      },
      {
        action: RecoveryAction.RESEND_CODE,
        label: 'Get New Code',
        description: 'Request a new verification code if you can\'t find the original'
      }
    ],
    retryable: true,
    maxRetries: 3
  },

  [ErrorCode.VERIFICATION_CODE_ATTEMPTS_EXCEEDED]: {
    code: ErrorCode.VERIFICATION_CODE_ATTEMPTS_EXCEEDED,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    message: 'Too many verification attempts',
    userMessage: 'You\'ve made too many verification attempts. Please wait before trying again.',
    recoverySteps: [
      {
        action: RecoveryAction.WAIT_AND_RETRY,
        label: 'Wait and Try Again',
        description: 'Wait for the cooldown period to end, then request a new code',
        delay: 3600000 // 1 hour
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'If you need immediate help, contact our support team',
        url: '/support'
      }
    ],
    retryable: true,
    retryDelay: 3600000 // 1 hour
  },

  // College Database Verification Errors
  [ErrorCode.COLLEGE_CREDENTIALS_INVALID]: {
    code: ErrorCode.COLLEGE_CREDENTIALS_INVALID,
    category: ErrorCategory.VERIFICATION,
    severity: ErrorSeverity.MEDIUM,
    message: 'College credentials are invalid',
    userMessage: 'The credentials you entered don\'t match our college database. Please check your information.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Check and Try Again',
        description: 'Verify your name, branch, year, and verification password are correct'
      },
      {
        action: RecoveryAction.CONTACT_COLLEGE_ADMIN,
        label: 'Contact College Admin',
        description: 'Contact your college administration to verify your details'
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'Get help with college database verification',
        url: '/support'
      }
    ],
    retryable: true,
    maxRetries: 3
  },

  [ErrorCode.COLLEGE_STUDENT_NOT_FOUND]: {
    code: ErrorCode.COLLEGE_STUDENT_NOT_FOUND,
    category: ErrorCategory.VERIFICATION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Student not found in college database',
    userMessage: 'We couldn\'t find your details in the college database. This might be because your information hasn\'t been added yet.',
    recoverySteps: [
      {
        action: RecoveryAction.CONTACT_COLLEGE_ADMIN,
        label: 'Contact College Admin',
        description: 'Ask your college administration to add your details to the database'
      },
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again Later',
        description: 'If your college recently added your information, try again in a few hours'
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'Get help with college database verification',
        url: '/support'
      }
    ],
    retryable: true,
    retryDelay: 3600000 // 1 hour
  },

  [ErrorCode.COLLEGE_CREDENTIALS_ALREADY_USED]: {
    code: ErrorCode.COLLEGE_CREDENTIALS_ALREADY_USED,
    category: ErrorCategory.VERIFICATION,
    severity: ErrorSeverity.HIGH,
    message: 'College credentials already used',
    userMessage: 'These credentials have already been used to create an account. Each student can only create one account.',
    recoverySteps: [
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'If you believe this is an error, contact our support team',
        url: '/support'
      }
    ],
    retryable: false
  },

  [ErrorCode.COLLEGE_DATABASE_UNAVAILABLE]: {
    code: ErrorCode.COLLEGE_DATABASE_UNAVAILABLE,
    category: ErrorCategory.SERVICE,
    severity: ErrorSeverity.HIGH,
    message: 'College database temporarily unavailable',
    userMessage: 'The college database is temporarily unavailable. Please try again in a few minutes.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY_WITH_DELAY,
        label: 'Try Again Later',
        description: 'Wait a few minutes and try the verification again',
        delay: 300000 // 5 minutes
      },
      {
        action: RecoveryAction.TRY_ALTERNATIVE_METHOD,
        label: 'Try Email Verification',
        description: 'If your college provides email addresses, try email verification instead'
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'If the issue persists, contact our support team',
        url: '/support'
      }
    ],
    retryable: true,
    retryDelay: 300000, // 5 minutes
    maxRetries: 3
  },

  // Network and Service Errors
  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    message: 'Network connection error',
    userMessage: 'There seems to be a problem with your internet connection. Please check and try again.',
    recoverySteps: [
      {
        action: RecoveryAction.CHECK_CONNECTION,
        label: 'Check Connection',
        description: 'Make sure you have a stable internet connection'
      },
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again',
        description: 'Retry the operation once your connection is stable'
      },
      {
        action: RecoveryAction.REFRESH_PAGE,
        label: 'Refresh Page',
        description: 'Refresh the page and try again'
      }
    ],
    retryable: true,
    retryDelay: 2000,
    maxRetries: 3
  },

  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    category: ErrorCategory.SERVICE,
    severity: ErrorSeverity.HIGH,
    message: 'Service temporarily unavailable',
    userMessage: 'Our service is temporarily unavailable. We\'re working to fix this as quickly as possible.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY_WITH_DELAY,
        label: 'Try Again Later',
        description: 'Wait a few minutes and try again',
        delay: 300000 // 5 minutes
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'If the issue persists, contact our support team',
        url: '/support'
      }
    ],
    retryable: true,
    retryDelay: 300000, // 5 minutes
    maxRetries: 3
  },

  [ErrorCode.TIMEOUT_ERROR]: {
    code: ErrorCode.TIMEOUT_ERROR,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    message: 'Request timeout',
    userMessage: 'The request took too long to complete. This might be due to a slow connection.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again',
        description: 'Retry the operation'
      },
      {
        action: RecoveryAction.CHECK_CONNECTION,
        label: 'Check Connection',
        description: 'Make sure you have a stable internet connection'
      }
    ],
    retryable: true,
    retryDelay: 5000,
    maxRetries: 2
  },

  // Rate Limiting Errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    message: 'Rate limit exceeded',
    userMessage: 'You\'re making requests too quickly. Please wait a moment before trying again.',
    recoverySteps: [
      {
        action: RecoveryAction.WAIT_AND_RETRY,
        label: 'Wait and Try Again',
        description: 'Wait for the rate limit to reset, then try again',
        delay: 60000 // 1 minute
      }
    ],
    retryable: true,
    retryDelay: 60000 // 1 minute
  },

  // Default implementations for other error codes
  [ErrorCode.TOO_MANY_ATTEMPTS]: {
    code: ErrorCode.TOO_MANY_ATTEMPTS,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    message: 'Too many attempts',
    userMessage: 'You\'ve made too many attempts. Please wait before trying again.',
    recoverySteps: [
      {
        action: RecoveryAction.WAIT_AND_RETRY,
        label: 'Wait and Try Again',
        description: 'Wait for the cooldown period to end',
        delay: 900000 // 15 minutes
      }
    ],
    retryable: true,
    retryDelay: 900000 // 15 minutes
  },

  [ErrorCode.INVALID_CREDENTIALS]: {
    code: ErrorCode.INVALID_CREDENTIALS,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Invalid credentials',
    userMessage: 'The email or password you entered is incorrect.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again',
        description: 'Check your email and password and try again'
      }
    ],
    retryable: true,
    maxRetries: 3
  },

  [ErrorCode.SESSION_EXPIRED]: {
    code: ErrorCode.SESSION_EXPIRED,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    message: 'Session expired',
    userMessage: 'Your session has expired. Please log in again.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Log In Again',
        description: 'You\'ll be redirected to the login page'
      }
    ],
    retryable: false
  },

  [ErrorCode.TOKEN_INVALID]: {
    code: ErrorCode.TOKEN_INVALID,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Invalid token',
    userMessage: 'Your authentication token is invalid. Please log in again.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Log In Again',
        description: 'You\'ll be redirected to the login page'
      }
    ],
    retryable: false
  },

  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    message: 'Internal server error',
    userMessage: 'Something went wrong on our end. We\'re working to fix this issue.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY_WITH_DELAY,
        label: 'Try Again Later',
        description: 'Wait a few minutes and try again',
        delay: 300000 // 5 minutes
      },
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'If the issue persists, contact our support team',
        url: '/support'
      }
    ],
    retryable: true,
    retryDelay: 300000, // 5 minutes
    maxRetries: 2
  },

  [ErrorCode.DATABASE_ERROR]: {
    code: ErrorCode.DATABASE_ERROR,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    message: 'Database error',
    userMessage: 'We\'re experiencing database issues. Please try again in a few minutes.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY_WITH_DELAY,
        label: 'Try Again Later',
        description: 'Wait a few minutes and try again',
        delay: 300000 // 5 minutes
      }
    ],
    retryable: true,
    retryDelay: 300000, // 5 minutes
    maxRetries: 2
  },

  [ErrorCode.CONFIGURATION_ERROR]: {
    code: ErrorCode.CONFIGURATION_ERROR,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    message: 'Configuration error',
    userMessage: 'There\'s a configuration issue on our end. We\'re working to resolve this.',
    recoverySteps: [
      {
        action: RecoveryAction.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'Contact our support team for assistance',
        url: '/support'
      }
    ],
    retryable: false
  },

  [ErrorCode.EMAIL_INVALID_FORMAT]: {
    code: ErrorCode.EMAIL_INVALID_FORMAT,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Correct Email',
        description: 'Check your email format and try again'
      }
    ],
    retryable: true,
    maxRetries: 5
  },

  [ErrorCode.CONNECTION_FAILED]: {
    code: ErrorCode.CONNECTION_FAILED,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    message: 'Connection failed',
    userMessage: 'Failed to connect to our servers. Please check your internet connection.',
    recoverySteps: [
      {
        action: RecoveryAction.CHECK_CONNECTION,
        label: 'Check Connection',
        description: 'Make sure you have a stable internet connection'
      },
      {
        action: RecoveryAction.RETRY,
        label: 'Try Again',
        description: 'Retry the operation'
      }
    ],
    retryable: true,
    retryDelay: 3000,
    maxRetries: 3
  },

  [ErrorCode.REQUIRED_FIELD_MISSING]: {
    code: ErrorCode.REQUIRED_FIELD_MISSING,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Required field missing',
    userMessage: 'Please fill in all required fields.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Complete Form',
        description: 'Fill in the missing required fields'
      }
    ],
    retryable: true,
    maxRetries: 10
  },

  [ErrorCode.INVALID_INPUT_FORMAT]: {
    code: ErrorCode.INVALID_INPUT_FORMAT,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Invalid input format',
    userMessage: 'Please check the format of your input.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Correct Format',
        description: 'Check the input format and try again'
      }
    ],
    retryable: true,
    maxRetries: 5
  },

  [ErrorCode.INPUT_TOO_SHORT]: {
    code: ErrorCode.INPUT_TOO_SHORT,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Input too short',
    userMessage: 'This field requires more characters.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Add More Characters',
        description: 'Enter more characters to meet the minimum requirement'
      }
    ],
    retryable: true,
    maxRetries: 5
  },

  [ErrorCode.INPUT_TOO_LONG]: {
    code: ErrorCode.INPUT_TOO_LONG,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Input too long',
    userMessage: 'This field has too many characters.',
    recoverySteps: [
      {
        action: RecoveryAction.RETRY,
        label: 'Shorten Input',
        description: 'Reduce the number of characters to meet the maximum requirement'
      }
    ],
    retryable: true,
    maxRetries: 5
  }
}

/**
 * Create a standardized error from an error code
 */
export function createAuthError(
  code: ErrorCode,
  context?: Record<string, any>,
  requestId?: string
): AuthError {
  const definition = ERROR_DEFINITIONS[code]
  
  return {
    ...definition,
    context,
    requestId,
    timestamp: new Date()
  }
}

/**
 * Create an error from a generic Error object
 */
export function createAuthErrorFromGeneric(
  error: Error,
  context?: Record<string, any>,
  requestId?: string
): AuthError {
  // Try to map common error messages to specific error codes
  const message = error.message.toLowerCase()
  
  let code = ErrorCode.INTERNAL_SERVER_ERROR
  
  if (message.includes('network') || message.includes('fetch')) {
    code = ErrorCode.NETWORK_ERROR
  } else if (message.includes('timeout')) {
    code = ErrorCode.TIMEOUT_ERROR
  } else if (message.includes('rate limit') || message.includes('too many')) {
    code = ErrorCode.RATE_LIMIT_EXCEEDED
  } else if (message.includes('email') && message.includes('send')) {
    code = ErrorCode.EMAIL_SEND_FAILED
  } else if (message.includes('invalid') && message.includes('email')) {
    code = ErrorCode.EMAIL_INVALID_FORMAT
  } else if (message.includes('domain') && message.includes('not')) {
    code = ErrorCode.EMAIL_DOMAIN_NOT_RECOGNIZED
  } else if (message.includes('expired')) {
    code = ErrorCode.VERIFICATION_CODE_EXPIRED
  } else if (message.includes('invalid') && message.includes('code')) {
    code = ErrorCode.VERIFICATION_CODE_INVALID
  } else if (message.includes('database')) {
    code = ErrorCode.DATABASE_ERROR
  }
  
  return createAuthError(code, { originalError: error.message, ...context }, requestId)
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: AuthError): boolean {
  return error.retryable
}

/**
 * Get retry delay for an error
 */
export function getRetryDelay(error: AuthError): number {
  return error.retryDelay || 1000
}

/**
 * Get maximum retries for an error
 */
export function getMaxRetries(error: AuthError): number {
  return error.maxRetries || 3
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: AuthError): string {
  return JSON.stringify({
    code: error.code,
    category: error.category,
    severity: error.severity,
    message: error.message,
    context: error.context,
    requestId: error.requestId,
    timestamp: error.timestamp.toISOString()
  })
}