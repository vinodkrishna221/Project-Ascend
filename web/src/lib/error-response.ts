/**
 * Error Response System for User-Friendly Error Messages
 * 
 * This module provides:
 * - User-friendly error message formatting
 * - Recovery step generation
 * - Error context management
 * - Localization support for error messages
 * 
 * Requirements: 4.1, 4.2 - User-friendly error messages with clear recovery steps
 */

import { AuthError, RecoveryStep, RecoveryAction, ErrorSeverity } from './errors'

// Error Display Configuration
export interface ErrorDisplayConfig {
  showTechnicalDetails: boolean
  showRecoverySteps: boolean
  showContactSupport: boolean
  maxRecoverySteps: number
  locale: string
}

// Default error display configuration
export const DEFAULT_ERROR_DISPLAY_CONFIG: ErrorDisplayConfig = {
  showTechnicalDetails: false,
  showRecoverySteps: true,
  showContactSupport: true,
  maxRecoverySteps: 3,
  locale: 'en'
}

// Error Message Templates
export interface ErrorMessageTemplate {
  title: string
  message: string
  icon?: string
  color?: string
  actionLabel?: string
}

// Error message templates by severity
export const ERROR_MESSAGE_TEMPLATES: Record<ErrorSeverity, ErrorMessageTemplate> = {
  [ErrorSeverity.LOW]: {
    title: 'Quick Fix Needed',
    message: 'This is easy to fix!',
    icon: '⚠️',
    color: 'yellow',
    actionLabel: 'Fix This'
  },
  [ErrorSeverity.MEDIUM]: {
    title: 'Something Went Wrong',
    message: 'Don\'t worry, we can help you resolve this.',
    icon: '❗',
    color: 'orange',
    actionLabel: 'Try Again'
  },
  [ErrorSeverity.HIGH]: {
    title: 'Service Issue',
    message: 'We\'re experiencing some technical difficulties.',
    icon: '🚨',
    color: 'red',
    actionLabel: 'Get Help'
  },
  [ErrorSeverity.CRITICAL]: {
    title: 'System Error',
    message: 'We\'re working to fix this critical issue.',
    icon: '💥',
    color: 'red',
    actionLabel: 'Contact Support'
  }
}

// Recovery Action Labels and Descriptions
export const RECOVERY_ACTION_LABELS: Record<RecoveryAction, { label: string; description: string; icon?: string }> = {
  [RecoveryAction.RETRY]: {
    label: 'Try Again',
    description: 'Attempt the operation again',
    icon: '🔄'
  },
  [RecoveryAction.RETRY_WITH_DELAY]: {
    label: 'Try Again Later',
    description: 'Wait a moment and try again',
    icon: '⏰'
  },
  [RecoveryAction.RESEND_CODE]: {
    label: 'Get New Code',
    description: 'Request a fresh verification code',
    icon: '📧'
  },
  [RecoveryAction.CONTACT_SUPPORT]: {
    label: 'Contact Support',
    description: 'Get help from our support team',
    icon: '💬'
  },
  [RecoveryAction.REQUEST_DOMAIN_ADDITION]: {
    label: 'Request College Addition',
    description: 'Add your college to our system',
    icon: '🏫'
  },
  [RecoveryAction.CONTACT_COLLEGE_ADMIN]: {
    label: 'Contact College Admin',
    description: 'Reach out to your college administration',
    icon: '👨‍💼'
  },
  [RecoveryAction.WAIT_AND_RETRY]: {
    label: 'Wait and Try Again',
    description: 'Wait for the cooldown period to end',
    icon: '⏳'
  },
  [RecoveryAction.REFRESH_PAGE]: {
    label: 'Refresh Page',
    description: 'Reload the page and try again',
    icon: '🔄'
  },
  [RecoveryAction.CHECK_CONNECTION]: {
    label: 'Check Connection',
    description: 'Verify your internet connection',
    icon: '📶'
  },
  [RecoveryAction.TRY_ALTERNATIVE_METHOD]: {
    label: 'Try Alternative Method',
    description: 'Use a different verification method',
    icon: '🔀'
  }
}

// Formatted Error Response
export interface FormattedErrorResponse {
  id: string
  title: string
  message: string
  userMessage: string
  severity: ErrorSeverity
  icon: string
  color: string
  recoverySteps: FormattedRecoveryStep[]
  technicalDetails?: {
    code: string
    category: string
    timestamp: string
    requestId?: string
  }
  supportInfo?: {
    contactUrl: string
    documentationUrl?: string
    statusPageUrl?: string
  }
}

// Formatted Recovery Step
export interface FormattedRecoveryStep {
  id: string
  action: RecoveryAction
  label: string
  description: string
  icon?: string
  url?: string
  automated?: boolean
  delay?: number
  delayText?: string
  primary?: boolean
}

/**
 * Format an AuthError for display to users
 */
export function formatErrorForDisplay(
  error: AuthError,
  config: Partial<ErrorDisplayConfig> = {}
): FormattedErrorResponse {
  const finalConfig = { ...DEFAULT_ERROR_DISPLAY_CONFIG, ...config }
  const template = ERROR_MESSAGE_TEMPLATES[error.severity]
  
  // Generate unique error ID
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Format recovery steps
  const recoverySteps = formatRecoverySteps(
    error.recoverySteps,
    finalConfig.maxRecoverySteps
  )
  
  // Build formatted response
  const response: FormattedErrorResponse = {
    id: errorId,
    title: template.title,
    message: template.message,
    userMessage: error.userMessage,
    severity: error.severity,
    icon: template.icon || '❗',
    color: template.color || 'red',
    recoverySteps
  }
  
  // Add technical details if requested
  if (finalConfig.showTechnicalDetails) {
    response.technicalDetails = {
      code: error.code,
      category: error.category,
      timestamp: error.timestamp.toISOString(),
      requestId: error.requestId
    }
  }
  
  // Add support information if requested
  if (finalConfig.showContactSupport) {
    response.supportInfo = {
      contactUrl: '/support',
      documentationUrl: '/help',
      statusPageUrl: '/status'
    }
  }
  
  return response
}

/**
 * Format recovery steps for display
 */
export function formatRecoverySteps(
  steps: RecoveryStep[],
  maxSteps: number = 3
): FormattedRecoveryStep[] {
  return steps
    .slice(0, maxSteps)
    .map((step, index) => {
      const actionInfo = RECOVERY_ACTION_LABELS[step.action]
      const stepId = `step_${index}_${step.action.toLowerCase()}`
      
      return {
        id: stepId,
        action: step.action,
        label: step.label || actionInfo.label,
        description: step.description || actionInfo.description,
        icon: actionInfo.icon,
        url: step.url,
        automated: step.automated,
        delay: step.delay,
        delayText: step.delay ? formatDelay(step.delay) : undefined,
        primary: index === 0 // First step is primary
      }
    })
}

/**
 * Format delay time into human-readable text
 */
export function formatDelay(delayMs: number): string {
  const seconds = Math.floor(delayMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }
}

/**
 * Generate contextual help text based on error
 */
export function generateContextualHelp(error: AuthError): string {
  switch (error.code) {
    case 'EMAIL_DOMAIN_NOT_RECOGNIZED':
      return 'Make sure you\'re using your official college email address. If your college isn\'t in our system yet, you can request to add it.'
    
    case 'VERIFICATION_CODE_EXPIRED':
      return 'Verification codes expire after 15 minutes for security. Request a new code and enter it promptly.'
    
    case 'COLLEGE_CREDENTIALS_INVALID':
      return 'Double-check that your name, branch, year, and verification password match exactly what your college provided.'
    
    case 'RATE_LIMIT_EXCEEDED':
      return 'We limit verification attempts to prevent abuse. Take a short break and try again.'
    
    case 'NETWORK_ERROR':
      return 'Check your internet connection and try again. If you\'re on a slow connection, the request might have timed out.'
    
    case 'SERVICE_UNAVAILABLE':
      return 'Our servers are temporarily experiencing high load. We\'re working to resolve this quickly.'
    
    default:
      return 'If this problem continues, please contact our support team with the error details.'
  }
}

/**
 * Create error toast notification data
 */
export interface ErrorToastData {
  id: string
  title: string
  message: string
  type: 'error' | 'warning' | 'info'
  duration: number
  actions?: Array<{
    label: string
    action: () => void
    primary?: boolean
  }>
}

export function createErrorToast(error: AuthError): ErrorToastData {
  const formatted = formatErrorForDisplay(error)
  
  // Determine toast type based on severity
  let type: 'error' | 'warning' | 'info' = 'error'
  if (error.severity === ErrorSeverity.LOW) {
    type = 'warning'
  } else if (error.severity === ErrorSeverity.MEDIUM) {
    type = 'info'
  }
  
  // Determine duration based on severity
  let duration = 5000 // 5 seconds default
  if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
    duration = 10000 // 10 seconds for serious errors
  } else if (error.severity === ErrorSeverity.LOW) {
    duration = 3000 // 3 seconds for minor issues
  }
  
  // Create action buttons from recovery steps
  const actions = formatted.recoverySteps
    .slice(0, 2) // Max 2 actions in toast
    .map(step => ({
      label: step.label,
      action: () => {
        // This would be implemented by the component using the toast
        console.log(`Execute recovery action: ${step.action}`)
      },
      primary: step.primary
    }))
  
  return {
    id: formatted.id,
    title: formatted.title,
    message: formatted.userMessage,
    type,
    duration,
    actions: actions.length > 0 ? actions : undefined
  }
}

/**
 * Create error modal data
 */
export interface ErrorModalData {
  id: string
  title: string
  message: string
  userMessage: string
  icon: string
  severity: ErrorSeverity
  recoverySteps: FormattedRecoveryStep[]
  helpText: string
  supportInfo?: {
    contactUrl: string
    documentationUrl?: string
  }
  onClose?: () => void
  onRetry?: () => void
}

export function createErrorModal(
  error: AuthError,
  onClose?: () => void,
  onRetry?: () => void
): ErrorModalData {
  const formatted = formatErrorForDisplay(error)
  const helpText = generateContextualHelp(error)
  
  return {
    id: formatted.id,
    title: formatted.title,
    message: formatted.message,
    userMessage: formatted.userMessage,
    icon: formatted.icon,
    severity: formatted.severity,
    recoverySteps: formatted.recoverySteps,
    helpText,
    supportInfo: formatted.supportInfo,
    onClose,
    onRetry
  }
}

/**
 * Create inline error message data
 */
export interface InlineErrorData {
  id: string
  message: string
  type: 'error' | 'warning'
  recoveryAction?: {
    label: string
    action: () => void
  }
}

export function createInlineError(error: AuthError): InlineErrorData {
  const formatted = formatErrorForDisplay(error)
  
  // Get primary recovery action
  const primaryStep = formatted.recoverySteps.find(step => step.primary) || 
                     formatted.recoverySteps[0]
  
  return {
    id: formatted.id,
    message: formatted.userMessage,
    type: error.severity === ErrorSeverity.LOW ? 'warning' : 'error',
    recoveryAction: primaryStep ? {
      label: primaryStep.label,
      action: () => {
        console.log(`Execute recovery action: ${primaryStep.action}`)
      }
    } : undefined
  }
}

/**
 * Log error for analytics and monitoring
 */
export function logErrorForAnalytics(error: AuthError, context?: Record<string, any>): void {
  const logData = {
    errorId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    code: error.code,
    category: error.category,
    severity: error.severity,
    message: error.message,
    userMessage: error.userMessage,
    retryable: error.retryable,
    timestamp: error.timestamp.toISOString(),
    requestId: error.requestId,
    context: {
      ...error.context,
      ...context
    },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  }
  
  // In a real implementation, this would send to analytics service
  console.error('Authentication Error:', logData)
  
  // Could also send to external services like Sentry, LogRocket, etc.
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'auth_error', {
      error_code: error.code,
      error_category: error.category,
      error_severity: error.severity,
      custom_map: {
        error_id: logData.errorId
      }
    })
  }
}