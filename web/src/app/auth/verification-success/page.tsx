'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'

export default function VerificationSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <AuthLayout
      title="Verification Successful!"
      subtitle="Welcome to the Ascend student community"
      showBackToHome={false}
    >
      <div className="text-center space-y-6">
        {/* Success Animation */}
        <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            🎉 You're all set!
          </h3>
          <p className="text-gray-600">
            Your student status has been verified successfully. You now have full access to the Ascend platform.
          </p>
        </div>

        <div className="bg-primary-50 rounded-lg p-4">
          <h4 className="font-medium text-primary-900 mb-2">What's next?</h4>
          <ul className="text-sm text-primary-800 text-left space-y-1">
            <li>✓ Complete your profile with skills and interests</li>
            <li>✓ Join communities that match your field of study</li>
            <li>✓ Share your first win or project update</li>
            <li>✓ Connect with your college guild</li>
            <li>✓ Start building meaningful connections</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          
          <p className="text-xs text-gray-500">
            Redirecting automatically in 5 seconds...
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            Need help getting started?{' '}
            <a href="mailto:support@ascend.com" className="text-primary-600 hover:text-primary-500">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}