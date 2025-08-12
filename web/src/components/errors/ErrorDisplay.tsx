/**
 * Error Display Components
 * 
 * React components for displaying authentication errors with recovery options
 * 
 * Requirements: 4.1, 4.2 - User-friendly error messages with clear recovery steps
 */

import React, { useState, useEffect } from 'react'
import { AuthError } from '@/lib/errors'
import {
  createErrorToast,
  createErrorModal,
  createInlineError,
  ErrorToastData,
  ErrorModalData,
  InlineErrorData
} from '@/lib/error-response'
import { Button } from '@/components/ui/Button'

// Error Toast Component
interface ErrorToastProps {
  error: AuthError
  onClose: () => void
  onAction?: (action: string) => void
}

export function ErrorToast({ error, onClose, onAction }: ErrorToastProps) {
  const [toastData, setToastData] = useState<ErrorToastData>()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const data = createErrorToast(error)
    setToastData(data)

    // Auto-close after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade out animation
    }, data.duration)

    return () => clearTimeout(timer)
  }, [error, onClose])

  if (!toastData || !isVisible) return null

  const bgColor = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }[toastData.type]

  const textColor = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }[toastData.type]

  const iconColor = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }[toastData.type]

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full ${bgColor} border rounded-lg shadow-lg p-4 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} z-50`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {toastData.title}
          </h3>
          <p className={`mt-1 text-sm ${textColor} opacity-90`}>
            {toastData.message}
          </p>
          {toastData.actions && toastData.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {toastData.actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    action.action()
                    if (onAction) onAction(action.label)
                  }}
                  className={`text-xs font-medium px-2 py-1 rounded ${action.primary
                    ? `bg-${toastData.type === 'error' ? 'red' : toastData.type === 'warning' ? 'yellow' : 'blue'}-600 text-white hover:bg-${toastData.type === 'error' ? 'red' : toastData.type === 'warning' ? 'yellow' : 'blue'}-700`
                    : `${textColor} hover:bg-white hover:bg-opacity-20`
                    } transition-colors`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className={`ml-3 flex-shrink-0 ${iconColor} hover:opacity-70 transition-opacity`}
          aria-label="Close notification"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Error Modal Component
interface ErrorModalProps {
  error: AuthError
  isOpen: boolean
  onClose: () => void
  onRetry?: () => void
  onAction?: (action: string) => void
}

export function ErrorModal({ error, isOpen, onClose, onRetry, onAction }: ErrorModalProps) {
  const [modalData, setModalData] = useState<ErrorModalData>()

  useEffect(() => {
    if (isOpen) {
      const data = createErrorModal(error, onClose, onRetry)
      setModalData(data)
    }
  }, [error, isOpen, onClose, onRetry])

  if (!isOpen || !modalData) return null

  const severityColors = {
    LOW: 'text-yellow-600 bg-yellow-100',
    MEDIUM: 'text-orange-600 bg-orange-100',
    HIGH: 'text-red-600 bg-red-100',
    CRITICAL: 'text-red-700 bg-red-200'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            {/* Icon */}
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${severityColors[modalData.severity]}`}>
              <span className="text-2xl">{modalData.icon}</span>
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {modalData.title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {modalData.userMessage}
                </p>
              </div>

              {/* Help text */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  {modalData.helpText}
                </p>
              </div>

              {/* Recovery steps */}
              {modalData.recoverySteps.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    What you can do:
                  </h4>
                  <div className="space-y-2">
                    {modalData.recoverySteps.map((step) => (
                      <div key={step.id} className="flex items-start text-left">
                        <span className="flex-shrink-0 text-lg mr-2">
                          {step.icon}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {step.description}
                          </p>
                          {step.delayText && (
                            <p className="text-xs text-orange-600 mt-1">
                              Wait {step.delayText} before trying
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            {modalData.recoverySteps.length > 0 && (
              <Button
                onClick={() => {
                  const primaryStep = modalData.recoverySteps.find(s => s.primary) || modalData.recoverySteps[0]
                  if (onAction) onAction(primaryStep.action)
                  if (primaryStep.action === 'RETRY' && onRetry) onRetry()
                }}
                className="w-full sm:col-start-2"
              >
                {modalData.recoverySteps.find(s => s.primary)?.label || 'Try Again'}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              className="mt-3 w-full sm:mt-0 sm:col-start-1"
            >
              Close
            </Button>
          </div>

          {/* Support info */}
          {modalData.supportInfo && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Need more help?{' '}
                <a
                  href={modalData.supportInfo.contactUrl}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Contact Support
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Inline Error Component
interface InlineErrorProps {
  error: AuthError
  onAction?: (action: string) => void
  className?: string
}

export function InlineError({ error, onAction, className = '' }: InlineErrorProps) {
  const [errorData, setErrorData] = useState<InlineErrorData>()

  useEffect(() => {
    const data = createInlineError(error)
    setErrorData(data)
  }, [error])

  if (!errorData) return null

  const bgColor = errorData.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
  const textColor = errorData.type === 'error' ? 'text-red-800' : 'text-yellow-800'
  const iconColor = errorData.type === 'error' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className={`${bgColor} border rounded-md p-3 ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm ${textColor}`}>
            {errorData.message}
          </p>
          {errorData.recoveryAction && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  errorData.recoveryAction!.action()
                  if (onAction) onAction(errorData.recoveryAction!.label)
                }}
                className={`text-sm font-medium ${textColor} hover:opacity-80 transition-opacity`}
              >
                {errorData.recoveryAction.label} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: AuthError
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: AuthError) => React.ReactNode
  onError?: (error: AuthError) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert generic error to AuthError
    const authError = (error as any).authError || {
      code: 'INTERNAL_SERVER_ERROR',
      category: 'SYSTEM',
      severity: 'CRITICAL',
      message: error.message,
      userMessage: 'Something went wrong. Please try refreshing the page.',
      recoverySteps: [
        {
          action: 'REFRESH_PAGE',
          label: 'Refresh Page',
          description: 'Reload the page and try again'
        }
      ],
      retryable: true,
      timestamp: new Date()
    }

    return {
      hasError: true,
      error: authError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error)
    }

    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error)
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {this.state.error.userMessage}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Error List Component (for displaying multiple errors)
interface ErrorListProps {
  errors: AuthError[]
  onDismiss?: (index: number) => void
  onAction?: (action: string, errorIndex: number) => void
  className?: string
}

export function ErrorList({ errors, onDismiss, onAction, className = '' }: ErrorListProps) {
  if (errors.length === 0) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {errors.map((error, index) => (
        <div key={`${error.code}-${index}`} className="relative">
          <InlineError
            error={error}
            onAction={(action) => onAction?.(action, index)}
          />
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(index)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}