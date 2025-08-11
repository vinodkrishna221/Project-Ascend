/**
 * Automatic Retry Mechanisms for Transient Failures
 * 
 * This module provides:
 * - Automatic retry logic with exponential backoff
 * - Circuit breaker pattern for service protection
 * - Retry policies based on error types
 * - Fallback mechanisms for service unavailability
 * 
 * Requirements: 4.4 - Automatic retry mechanisms for transient failures
 */

import { AuthError, ErrorCategory, ErrorCode, isRetryable, getRetryDelay, getMaxRetries } from './errors'

// Retry Configuration
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
}

// Default retry configurations by error category
export const DEFAULT_RETRY_CONFIGS: Record<ErrorCategory, RetryConfig> = {
  [ErrorCategory.NETWORK]: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  },
  [ErrorCategory.SERVICE]: {
    maxRetries: 3,
    baseDelay: 5000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  [ErrorCategory.RATE_LIMIT]: {
    maxRetries: 2,
    baseDelay: 60000,
    maxDelay: 300000,
    backoffMultiplier: 1.5,
    jitter: false
  },
  [ErrorCategory.VERIFICATION]: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
    jitter: true
  },
  [ErrorCategory.VALIDATION]: {
    maxRetries: 0, // Don't retry validation errors
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [ErrorCategory.AUTHENTICATION]: {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true
  },
  [ErrorCategory.AUTHORIZATION]: {
    maxRetries: 0, // Don't retry authorization errors
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false
  },
  [ErrorCategory.SYSTEM]: {
    maxRetries: 2,
    baseDelay: 10000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true
  }
}

// Retry Result
export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: AuthError
  attempts: number
  totalTime: number
}

// Retry Statistics
export interface RetryStats {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  averageRetryTime: number
  lastAttemptTime: Date
}

/**
 * Calculate retry delay with exponential backoff and optional jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  errorDelay?: number
): number {
  // Use error-specific delay if provided
  if (errorDelay && errorDelay > 0) {
    return errorDelay
  }

  // Calculate exponential backoff
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
  
  // Apply maximum delay limit
  delay = Math.min(delay, config.maxDelay)
  
  // Add jitter to prevent thundering herd
  if (config.jitter) {
    const jitterAmount = delay * 0.1 // 10% jitter
    delay += (Math.random() - 0.5) * 2 * jitterAmount
  }
  
  return Math.max(delay, 0)
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with automatic backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  onRetry?: (attempt: number, error: AuthError) => void
): Promise<RetryResult<T>> {
  const startTime = Date.now()
  let lastError: AuthError | undefined
  let attempts = 0
  
  const defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  }
  
  const finalConfig = { ...defaultConfig, ...config }
  
  while (attempts <= finalConfig.maxRetries) {
    attempts++
    
    try {
      const result = await fn()
      return {
        success: true,
        data: result,
        attempts,
        totalTime: Date.now() - startTime
      }
    } catch (error) {
      const authError = error instanceof Error 
        ? (error as any).authError || { code: ErrorCode.INTERNAL_SERVER_ERROR, retryable: true }
        : { code: ErrorCode.INTERNAL_SERVER_ERROR, retryable: true }
      
      lastError = authError
      
      // Don't retry if error is not retryable or we've exceeded max attempts
      if (!isRetryable(authError) || attempts > finalConfig.maxRetries) {
        break
      }
      
      // Calculate delay for next attempt
      const delay = calculateRetryDelay(attempts, finalConfig, getRetryDelay(authError))
      
      // Notify about retry attempt
      if (onRetry) {
        onRetry(attempts, authError)
      }
      
      // Wait before retrying
      if (delay > 0) {
        await sleep(delay)
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts,
    totalTime: Date.now() - startTime
  }
}

/**
 * Retry a function based on error category
 */
export async function retryByErrorCategory<T>(
  fn: () => Promise<T>,
  category: ErrorCategory,
  onRetry?: (attempt: number, error: AuthError) => void
): Promise<RetryResult<T>> {
  const config = DEFAULT_RETRY_CONFIGS[category]
  return retryWithBackoff(fn, config, onRetry)
}

/**
 * Circuit Breaker for protecting services
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime?: Date
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private successThreshold: number = 2
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== undefined && 
           (Date.now() - this.lastFailureTime.getTime()) >= this.recoveryTimeout
  }
  
  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'CLOSED'
  }
  
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }
  
  getState(): string {
    return this.state
  }
  
  getFailureCount(): number {
    return this.failureCount
  }
}

/**
 * Retry manager for tracking retry statistics
 */
export class RetryManager {
  private stats: Map<string, RetryStats> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  
  /**
   * Execute a function with retry logic and circuit breaker protection
   */
  async executeWithRetry<T>(
    key: string,
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    // Get or create circuit breaker for this key
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker())
    }
    
    const circuitBreaker = this.circuitBreakers.get(key)!
    
    // Wrap function with circuit breaker
    const wrappedFn = () => circuitBreaker.execute(fn)
    
    // Execute with retry
    const result = await retryWithBackoff(wrappedFn, config, (attempt, error) => {
      this.updateStats(key, false, attempt)
    })
    
    // Update stats
    if (result.success) {
      this.updateStats(key, true, result.attempts)
    }
    
    return result
  }
  
  /**
   * Update retry statistics
   */
  private updateStats(key: string, success: boolean, attempts: number): void {
    const current = this.stats.get(key) || {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageRetryTime: 0,
      lastAttemptTime: new Date()
    }
    
    current.totalAttempts += attempts
    if (success) {
      current.successfulAttempts++
    } else {
      current.failedAttempts++
    }
    current.lastAttemptTime = new Date()
    
    this.stats.set(key, current)
  }
  
  /**
   * Get retry statistics for a key
   */
  getStats(key: string): RetryStats | undefined {
    return this.stats.get(key)
  }
  
  /**
   * Get all retry statistics
   */
  getAllStats(): Map<string, RetryStats> {
    return new Map(this.stats)
  }
  
  /**
   * Reset statistics for a key
   */
  resetStats(key: string): void {
    this.stats.delete(key)
  }
  
  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(key: string): string {
    const breaker = this.circuitBreakers.get(key)
    return breaker ? breaker.getState() : 'UNKNOWN'
  }
}

// Global retry manager instance
export const globalRetryManager = new RetryManager()

/**
 * Convenience function for retrying authentication operations
 */
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  config?: Partial<RetryConfig>
): Promise<T> {
  const result = await globalRetryManager.executeWithRetry(
    `auth_${operationName}`,
    operation,
    config
  )
  
  if (result.success && result.data !== undefined) {
    return result.data
  }
  
  throw result.error || new Error(`Failed to execute ${operationName}`)
}

/**
 * Fallback mechanism for service unavailability
 */
export class FallbackManager {
  private fallbacks: Map<string, () => Promise<any>> = new Map()
  
  /**
   * Register a fallback function for a service
   */
  registerFallback(serviceKey: string, fallbackFn: () => Promise<any>): void {
    this.fallbacks.set(serviceKey, fallbackFn)
  }
  
  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    serviceKey: string,
    primaryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>
  ): Promise<T> {
    try {
      return await primaryFn()
    } catch (error) {
      const authError = error as AuthError
      
      // Only use fallback for service unavailability errors
      if (authError.code === ErrorCode.SERVICE_UNAVAILABLE || 
          authError.code === ErrorCode.TIMEOUT_ERROR ||
          authError.code === ErrorCode.CONNECTION_FAILED) {
        
        const fallback = fallbackFn || this.fallbacks.get(serviceKey)
        if (fallback) {
          console.warn(`Using fallback for ${serviceKey}:`, authError.message)
          return await fallback()
        }
      }
      
      throw error
    }
  }
}

// Global fallback manager instance
export const globalFallbackManager = new FallbackManager()

// Register common fallbacks
globalFallbackManager.registerFallback('email_verification', async () => {
  // Fallback: Show manual verification instructions
  throw new Error('Email service unavailable. Please contact support for manual verification.')
})

globalFallbackManager.registerFallback('college_database', async () => {
  // Fallback: Suggest email verification
  throw new Error('College database unavailable. Please try email verification if your college provides email addresses.')
})