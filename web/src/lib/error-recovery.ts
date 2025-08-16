/**
 * Error Recovery and Support Features
 * 
 * This module provides:
 * - Guided error recovery flows with step-by-step instructions
 * - Support contact integration with context-aware help
 * - Error reporting system for continuous improvement
 * - Status page integration for service availability updates
 * 
 * Requirements: 4.1, 4.2, 4.6, 7.5
 */

import { AuthError, ErrorCode, RecoveryAction } from './errors'
import { retryAuthOperation } from './retry'

// Recovery Flow Step
export interface RecoveryFlowStep {
  id: string
  title: string
  description: string
  instruction: string
  action?: RecoveryAction
  automated?: boolean
  userInput?: {
    type: 'text' | 'email' | 'select' | 'file'
    label: string
    placeholder?: string
    options?: string[]
    validation?: (value: string) => string | null
  }
  nextStep?: string
  onComplete?: (data?: any) => Promise<void>
  estimatedTime?: number // in seconds
}

// Recovery Flow
export interface RecoveryFlow {
  id: string
  title: string
  description: string
  errorCodes: ErrorCode[]
  steps: RecoveryFlowStep[]
  estimatedTotalTime: number
  successMessage: string
  fallbackSupport?: {
    title: string
    description: string
    contactUrl: string
  }
}

// Recovery Flow Registry
export const RECOVERY_FLOWS: Record<string, RecoveryFlow> = {
  email_verification_failed: {
    id: 'email_verification_failed',
    title: 'Fix Email Verification Issues',
    description: 'Let\'s get your email verification working step by step.',
    errorCodes: [
      ErrorCode.EMAIL_SEND_FAILED,
      ErrorCode.EMAIL_DOMAIN_NOT_RECOGNIZED,
      ErrorCode.VERIFICATION_CODE_EXPIRED,
      ErrorCode.VERIFICATION_CODE_INVALID
    ],
    estimatedTotalTime: 300, // 5 minutes
    successMessage: 'Great! Your email verification is now working.',
    steps: [
      {
        id: 'check_email_format',
        title: 'Check Your Email Address',
        description: 'Let\'s make sure your email address is correct.',
        instruction: 'Please verify that your email address is spelled correctly and is your official college email.',
        userInput: {
          type: 'email',
          label: 'Your College Email',
          placeholder: 'student@college.edu',
          validation: (value) => {
            if (!value.includes('@')) return 'Please enter a valid email address'
            if (!value.includes('.')) return 'Please enter a valid email address'
            return null
          }
        },
        nextStep: 'check_spam_folder',
        estimatedTime: 30
      },
      {
        id: 'check_spam_folder',
        title: 'Check Your Spam/Junk Folder',
        description: 'Sometimes verification emails end up in spam.',
        instruction: 'Open your email app and check your spam, junk, or promotions folder for an email from Ascend.',
        nextStep: 'resend_verification',
        estimatedTime: 60
      },
      {
        id: 'resend_verification',
        title: 'Request New Verification Code',
        description: 'Let\'s send you a fresh verification code.',
        instruction: 'Click the button below to send a new verification code to your email.',
        action: RecoveryAction.RESEND_CODE,
        automated: true,
        nextStep: 'enter_code',
        estimatedTime: 30,
        onComplete: async () => {
          // This would trigger the resend verification code API call
          console.log('Resending verification code...')
        }
      },
      {
        id: 'enter_code',
        title: 'Enter Verification Code',
        description: 'Enter the 6-digit code from your email.',
        instruction: 'Check your email for the verification code and enter it below. The code expires in 15 minutes.',
        userInput: {
          type: 'text',
          label: 'Verification Code',
          placeholder: '123456',
          validation: (value) => {
            if (value.length !== 6) return 'Verification code must be 6 digits'
            if (!/^\d+$/.test(value)) return 'Verification code must contain only numbers'
            return null
          }
        },
        estimatedTime: 60,
        onComplete: async (data) => {
          // This would verify the code
          console.log('Verifying code:', data.code)
        }
      }
    ],
    fallbackSupport: {
      title: 'Still Having Issues?',
      description: 'If these steps didn\'t work, our support team can help you manually verify your account.',
      contactUrl: '/support?issue=email_verification'
    }
  },

  college_database_verification_failed: {
    id: 'college_database_verification_failed',
    title: 'Fix College Database Verification',
    description: 'Let\'s resolve issues with your college database verification.',
    errorCodes: [
      ErrorCode.COLLEGE_CREDENTIALS_INVALID,
      ErrorCode.COLLEGE_STUDENT_NOT_FOUND,
      ErrorCode.COLLEGE_DATABASE_UNAVAILABLE
    ],
    estimatedTotalTime: 600, // 10 minutes
    successMessage: 'Perfect! Your college credentials have been verified.',
    steps: [
      {
        id: 'verify_college_selection',
        title: 'Confirm Your College',
        description: 'Make sure you\'ve selected the correct college.',
        instruction: 'Double-check that you\'ve selected your exact college from the list.',
        userInput: {
          type: 'select',
          label: 'Your College',
          options: [] // This would be populated dynamically
        },
        nextStep: 'check_credentials_format',
        estimatedTime: 60
      },
      {
        id: 'check_credentials_format',
        title: 'Check Your Information Format',
        description: 'Verify that your details match exactly what your college provided.',
        instruction: 'Make sure your name, branch, and year match exactly what\'s in your college records. Check for spelling, spaces, and capitalization.',
        nextStep: 'verify_password',
        estimatedTime: 120
      },
      {
        id: 'verify_password',
        title: 'Verify Your Password',
        description: 'Confirm your verification password is correct.',
        instruction: 'The verification password is provided by your college administration. If you\'re unsure, contact them for the correct password.',
        userInput: {
          type: 'text',
          label: 'Verification Password',
          placeholder: 'Enter the password from your college'
        },
        nextStep: 'contact_college_admin',
        estimatedTime: 60
      },
      {
        id: 'contact_college_admin',
        title: 'Contact College Administration',
        description: 'If your details still don\'t work, your college admin can help.',
        instruction: 'Contact your college\'s student administration office to verify your details are in their database.',
        estimatedTime: 300,
        onComplete: async () => {
          console.log('Providing college contact information...')
        }
      }
    ],
    fallbackSupport: {
      title: 'Need More Help?',
      description: 'Our support team can coordinate with your college to resolve verification issues.',
      contactUrl: '/support?issue=college_verification'
    }
  },

  network_connection_issues: {
    id: 'network_connection_issues',
    title: 'Fix Connection Problems',
    description: 'Let\'s troubleshoot your internet connection issues.',
    errorCodes: [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.CONNECTION_FAILED,
      ErrorCode.TIMEOUT_ERROR
    ],
    estimatedTotalTime: 180, // 3 minutes
    successMessage: 'Great! Your connection is working properly now.',
    steps: [
      {
        id: 'check_internet_connection',
        title: 'Check Internet Connection',
        description: 'Let\'s verify your internet is working.',
        instruction: 'Try opening another website or app to confirm your internet connection is working.',
        nextStep: 'refresh_page',
        estimatedTime: 30
      },
      {
        id: 'refresh_page',
        title: 'Refresh the Page',
        description: 'Sometimes a simple refresh fixes connection issues.',
        instruction: 'Click the refresh button in your browser or press Ctrl+R (Cmd+R on Mac).',
        action: RecoveryAction.REFRESH_PAGE,
        automated: true,
        nextStep: 'try_different_network',
        estimatedTime: 10,
        onComplete: async () => {
          window.location.reload()
        }
      },
      {
        id: 'try_different_network',
        title: 'Try a Different Network',
        description: 'Your current network might be blocking the connection.',
        instruction: 'If possible, try switching to a different WiFi network or use mobile data.',
        nextStep: 'clear_browser_cache',
        estimatedTime: 60
      },
      {
        id: 'clear_browser_cache',
        title: 'Clear Browser Cache',
        description: 'Cached data might be causing connection issues.',
        instruction: 'Clear your browser\'s cache and cookies, then try again.',
        estimatedTime: 60
      }
    ],
    fallbackSupport: {
      title: 'Still Can\'t Connect?',
      description: 'If connection issues persist, it might be a temporary server problem.',
      contactUrl: '/support?issue=connection'
    }
  },

  rate_limit_recovery: {
    id: 'rate_limit_recovery',
    title: 'Wait for Rate Limit Reset',
    description: 'You\'ve made too many attempts. Let\'s wait for the limit to reset.',
    errorCodes: [
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.TOO_MANY_ATTEMPTS,
      ErrorCode.VERIFICATION_CODE_ATTEMPTS_EXCEEDED
    ],
    estimatedTotalTime: 3600, // 1 hour
    successMessage: 'The rate limit has been reset. You can try again now.',
    steps: [
      {
        id: 'explain_rate_limit',
        title: 'Why Rate Limits Exist',
        description: 'Rate limits protect your account and our service.',
        instruction: 'We limit verification attempts to prevent abuse and protect your account security. This is a temporary restriction.',
        nextStep: 'wait_for_reset',
        estimatedTime: 60
      },
      {
        id: 'wait_for_reset',
        title: 'Wait for Reset',
        description: 'The rate limit will automatically reset after some time.',
        instruction: 'Please wait for the cooldown period to end. You can close this page and come back later.',
        estimatedTime: 3540 // Most of the hour
      }
    ],
    fallbackSupport: {
      title: 'Urgent Verification Needed?',
      description: 'If you need immediate access, our support team may be able to help.',
      contactUrl: '/support?issue=rate_limit'
    }
  }
}

// Recovery Flow Manager
export class RecoveryFlowManager {
  private currentFlow?: RecoveryFlow
  private currentStepIndex = 0
  private stepData: Record<string, any> = {}
  private onStepComplete?: (stepId: string, data?: any) => void
  private onFlowComplete?: (flowId: string) => void
  private onFlowFailed?: (flowId: string, error: string) => void

  /**
   * Start a recovery flow for an error
   */
  startFlow(
    error: AuthError,
    onStepComplete?: (stepId: string, data?: any) => void,
    onFlowComplete?: (flowId: string) => void,
    onFlowFailed?: (flowId: string, error: string) => void
  ): RecoveryFlow | null {
    // Find appropriate recovery flow
    const flow = this.findFlowForError(error)
    if (!flow) return null

    this.currentFlow = flow
    this.currentStepIndex = 0
    this.stepData = {}
    this.onStepComplete = onStepComplete
    this.onFlowComplete = onFlowComplete
    this.onFlowFailed = onFlowFailed

    return flow
  }

  /**
   * Get current step
   */
  getCurrentStep(): RecoveryFlowStep | null {
    if (!this.currentFlow || this.currentStepIndex >= this.currentFlow.steps.length) {
      return null
    }
    return this.currentFlow.steps[this.currentStepIndex]
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(data?: any): Promise<boolean> {
    const currentStep = this.getCurrentStep()
    if (!currentStep) return false

    // Store step data
    if (data) {
      this.stepData[currentStep.id] = data
    }

    // Execute step completion handler
    if (currentStep.onComplete) {
      try {
        await currentStep.onComplete(data)
      } catch (error) {
        if (this.onFlowFailed) {
          this.onFlowFailed(this.currentFlow!.id, `Step failed: ${error}`)
        }
        return false
      }
    }

    // Notify step completion
    if (this.onStepComplete) {
      this.onStepComplete(currentStep.id, data)
    }

    // Move to next step
    if (currentStep.nextStep) {
      const nextStepIndex = this.currentFlow!.steps.findIndex(s => s.id === currentStep.nextStep)
      if (nextStepIndex !== -1) {
        this.currentStepIndex = nextStepIndex
        return true
      }
    } else {
      this.currentStepIndex++
    }

    // Check if flow is complete
    if (this.currentStepIndex >= this.currentFlow!.steps.length) {
      if (this.onFlowComplete) {
        this.onFlowComplete(this.currentFlow!.id)
      }
      return false // Flow complete
    }

    return true
  }

  /**
   * Skip current step
   */
  skipStep(): boolean {
    const currentStep = this.getCurrentStep()
    if (!currentStep) return false

    this.currentStepIndex++
    return this.currentStepIndex < this.currentFlow!.steps.length
  }

  /**
   * Get flow progress
   */
  getProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentFlow) {
      return { current: 0, total: 0, percentage: 0 }
    }

    const current = this.currentStepIndex + 1
    const total = this.currentFlow.steps.length
    const percentage = Math.round((current / total) * 100)

    return { current, total, percentage }
  }

  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining(): number {
    if (!this.currentFlow) return 0

    let remainingTime = 0
    for (let i = this.currentStepIndex; i < this.currentFlow.steps.length; i++) {
      remainingTime += this.currentFlow.steps[i].estimatedTime || 60
    }

    return remainingTime
  }

  /**
   * Find recovery flow for error
   */
  private findFlowForError(error: AuthError): RecoveryFlow | null {
    for (const flow of Object.values(RECOVERY_FLOWS)) {
      if (flow.errorCodes.includes(error.code)) {
        return flow
      }
    }
    return null
  }

  /**
   * Reset flow
   */
  reset(): void {
    this.currentFlow = undefined
    this.currentStepIndex = 0
    this.stepData = {}
    this.onStepComplete = undefined
    this.onFlowComplete = undefined
    this.onFlowFailed = undefined
  }
}

// Support Contact Integration
export interface SupportTicket {
  id: string
  subject: string
  description: string
  errorContext: {
    errorCode: string
    errorMessage: string
    userAgent: string
    url: string
    timestamp: string
    userId?: string
  }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: Date
  updatedAt: Date
}

export class SupportManager {
  /**
   * Create support ticket from error
   */
  async createTicketFromError(
    error: AuthError,
    userDescription?: string,
    userEmail?: string
  ): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subject: `Authentication Error: ${error.code}`,
      description: userDescription || error.userMessage,
      errorContext: {
        errorCode: error.code,
        errorMessage: error.message,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        timestamp: error.timestamp.toISOString(),
        userId: userEmail
      },
      priority: this.determinePriority(error),
      category: error.category.toLowerCase(),
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // In a real implementation, this would send to support system
    console.log('Creating support ticket:', ticket)
    
    // Could integrate with systems like Zendesk, Intercom, etc.
    await this.sendToSupportSystem(ticket)

    return ticket
  }

  /**
   * Get contextual help for error
   */
  getContextualHelp(error: AuthError): {
    title: string
    description: string
    helpArticles: Array<{ title: string; url: string }>
    contactOptions: Array<{ type: string; label: string; url: string }>
  } {
    const baseHelp = {
      title: 'Need Help?',
      description: 'Here are some resources that might help resolve your issue.',
      helpArticles: [
        { title: 'Authentication Troubleshooting Guide', url: '/help/auth-troubleshooting' },
        { title: 'College Email Verification', url: '/help/email-verification' },
        { title: 'Account Setup Guide', url: '/help/account-setup' }
      ],
      contactOptions: [
        { type: 'chat', label: 'Live Chat', url: '/support/chat' },
        { type: 'email', label: 'Email Support', url: '/support/email' },
        { type: 'faq', label: 'FAQ', url: '/help/faq' }
      ]
    }

    // Customize based on error type
    switch (error.code) {
      case ErrorCode.EMAIL_DOMAIN_NOT_RECOGNIZED:
        return {
          ...baseHelp,
          title: 'College Not Found?',
          description: 'If your college isn\'t in our system, we can help add it.',
          helpArticles: [
            { title: 'How to Request College Addition', url: '/help/request-college' },
            { title: 'Supported Colleges List', url: '/help/colleges' },
            ...baseHelp.helpArticles
          ]
        }

      case ErrorCode.COLLEGE_CREDENTIALS_INVALID:
        return {
          ...baseHelp,
          title: 'Credential Issues?',
          description: 'Let\'s help you verify your college credentials.',
          helpArticles: [
            { title: 'College Database Verification Guide', url: '/help/college-verification' },
            { title: 'Contacting Your College Admin', url: '/help/college-contact' },
            ...baseHelp.helpArticles
          ]
        }

      case ErrorCode.NETWORK_ERROR:
        return {
          ...baseHelp,
          title: 'Connection Problems?',
          description: 'Network issues can usually be resolved quickly.',
          helpArticles: [
            { title: 'Connection Troubleshooting', url: '/help/connection' },
            { title: 'Browser Compatibility', url: '/help/browsers' },
            ...baseHelp.helpArticles
          ]
        }

      default:
        return baseHelp
    }
  }

  /**
   * Determine support ticket priority
   */
  private determinePriority(error: AuthError): 'low' | 'medium' | 'high' | 'urgent' {
    switch (error.severity) {
      case 'CRITICAL':
        return 'urgent'
      case 'HIGH':
        return 'high'
      case 'MEDIUM':
        return 'medium'
      case 'LOW':
      default:
        return 'low'
    }
  }

  /**
   * Send ticket to support system
   */
  private async sendToSupportSystem(ticket: SupportTicket): Promise<void> {
    // In a real implementation, this would integrate with your support system
    // For example, Zendesk API, Intercom API, etc.
    
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticket)
      })

      if (!response.ok) {
        throw new Error('Failed to create support ticket')
      }
    } catch (error) {
      console.error('Failed to send support ticket:', error)
      // Could fall back to email or other methods
    }
  }
}

// Error Reporting System
export interface ErrorReport {
  id: string
  errorCode: string
  errorMessage: string
  userMessage: string
  context: Record<string, any>
  userAgent: string
  url: string
  timestamp: Date
  userId?: string
  sessionId?: string
  resolved: boolean
  resolution?: string
}

export class ErrorReportingManager {
  private reports: ErrorReport[] = []

  /**
   * Report error for analytics and improvement
   */
  async reportError(
    error: AuthError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): Promise<ErrorReport> {
    const report: ErrorReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorCode: error.code,
      errorMessage: error.message,
      userMessage: error.userMessage,
      context: {
        ...error.context,
        ...context
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: error.timestamp,
      userId,
      sessionId,
      resolved: false
    }

    this.reports.push(report)

    // Send to analytics service
    await this.sendToAnalytics(report)

    return report
  }

  /**
   * Mark error as resolved
   */
  markResolved(reportId: string, resolution: string): void {
    const report = this.reports.find(r => r.id === reportId)
    if (report) {
      report.resolved = true
      report.resolution = resolution
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number
    errorsByCode: Record<string, number>
    resolvedErrors: number
    topErrors: Array<{ code: string; count: number }>
  } {
    const totalErrors = this.reports.length
    const resolvedErrors = this.reports.filter(r => r.resolved).length
    
    const errorsByCode: Record<string, number> = {}
    this.reports.forEach(report => {
      errorsByCode[report.errorCode] = (errorsByCode[report.errorCode] || 0) + 1
    })

    const topErrors = Object.entries(errorsByCode)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }))

    return {
      totalErrors,
      errorsByCode,
      resolvedErrors,
      topErrors
    }
  }

  /**
   * Send error report to analytics
   */
  private async sendToAnalytics(report: ErrorReport): Promise<void> {
    try {
      // Send to analytics service (e.g., Google Analytics, Mixpanel, etc.)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'auth_error_reported', {
          error_code: report.errorCode,
          error_category: report.context?.category,
          custom_map: {
            error_id: report.id
          }
        })
      }

      // Send to internal analytics API
      await fetch('/api/analytics/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      })
    } catch (error) {
      console.error('Failed to send error report to analytics:', error)
    }
  }
}

// Service Status Integration
export interface ServiceStatus {
  service: string
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage'
  lastChecked: Date
  description?: string
  estimatedResolution?: Date
}

export class ServiceStatusManager {
  private statusCache: Map<string, ServiceStatus> = new Map()
  private cacheExpiry = 60000 // 1 minute

  /**
   * Get service status
   */
  async getServiceStatus(service: string): Promise<ServiceStatus> {
    const cached = this.statusCache.get(service)
    if (cached && Date.now() - cached.lastChecked.getTime() < this.cacheExpiry) {
      return cached
    }

    try {
      const response = await fetch(`/api/status/${service}`)
      const status: ServiceStatus = await response.json()
      
      this.statusCache.set(service, status)
      return status
    } catch (error) {
      // Return default status if API fails
      const defaultStatus: ServiceStatus = {
        service,
        status: 'operational',
        lastChecked: new Date(),
        description: 'Status check unavailable'
      }
      
      this.statusCache.set(service, defaultStatus)
      return defaultStatus
    }
  }

  /**
   * Check if error might be due to service outage
   */
  async isServiceOutage(error: AuthError): Promise<boolean> {
    const serviceMap: Record<string, string> = {
      [ErrorCode.EMAIL_SEND_FAILED]: 'email',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'api',
      [ErrorCode.DATABASE_ERROR]: 'database',
      [ErrorCode.COLLEGE_DATABASE_UNAVAILABLE]: 'college_database'
    }

    const service = serviceMap[error.code]
    if (!service) return false

    const status = await this.getServiceStatus(service)
    return status.status !== 'operational'
  }

  /**
   * Get status page URL
   */
  getStatusPageUrl(): string {
    return '/status'
  }
}

// Global instances
export const globalRecoveryFlowManager = new RecoveryFlowManager()
export const globalSupportManager = new SupportManager()
export const globalErrorReportingManager = new ErrorReportingManager()
export const globalServiceStatusManager = new ServiceStatusManager()