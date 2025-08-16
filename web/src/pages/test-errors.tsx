/**
 * Test page for error handling components
 * Remove this file after testing
 */

import React, { useState } from 'react'
import { ErrorToast, ErrorModal, InlineError } from '@/components/errors/ErrorDisplay'
import { createAuthError, ErrorCode } from '@/lib/errors'
import { Button } from '@/components/ui/Button'

export default function TestErrorsPage() {
  const [showToast, setShowToast] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showInline, setShowInline] = useState(false)

  // Create test errors
  const emailError = createAuthError(ErrorCode.EMAIL_SEND_FAILED)
  const networkError = createAuthError(ErrorCode.NETWORK_ERROR)
  const collegeError = createAuthError(ErrorCode.COLLEGE_CREDENTIALS_INVALID)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Error Handling Test Page</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Error Components</h2>
          
          <div className="flex space-x-4">
            <Button onClick={() => setShowToast(true)}>
              Show Error Toast
            </Button>
            <Button onClick={() => setShowModal(true)}>
              Show Error Modal
            </Button>
            <Button onClick={() => setShowInline(!showInline)}>
              Toggle Inline Error
            </Button>
          </div>
        </div>

        {/* Inline Error Example */}
        {showInline && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inline Errors</h3>
            <InlineError error={emailError} />
            <InlineError error={networkError} />
            <InlineError error={collegeError} />
          </div>
        )}

        {/* Toast Error */}
        {showToast && (
          <ErrorToast
            error={emailError}
            onClose={() => setShowToast(false)}
            onAction={(action) => console.log('Toast action:', action)}
          />
        )}

        {/* Modal Error */}
        <ErrorModal
          error={networkError}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRetry={() => {
            console.log('Retry clicked')
            setShowModal(false)
          }}
          onAction={(action) => console.log('Modal action:', action)}
        />
      </div>
    </div>
  )
}