'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AuthService, signupSchema, type SignupFormData } from '@/lib/auth'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      setError(null)

      // First validate if it's a college email
      const domainValidation = await AuthService.validateEmailDomain(data.email)
      
      if (!domainValidation) {
        setError('Please use your college email address. If your college is not supported, you can request to add it.')
        return
      }

      if (!domainValidation.provides_email) {
        // Redirect to college database verification
        router.push(`/auth/college-verification?college_id=${domainValidation.id}&email=${encodeURIComponent(data.email)}`)
        return
      }

      // Proceed with email verification
      await AuthService.signUp(data)
      
      // Redirect to email verification
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'student', label: 'Current Student' },
    { value: 'aspirant', label: 'College Aspirant' },
  ]

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the verified student community and start sharing your journey"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-error-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
                {error.includes('college email') && (
                  <div className="mt-2">
                    <Link 
                      href="/auth/request-college" 
                      className="text-sm text-error-600 hover:text-error-500 underline"
                    >
                      Request to add your college →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* College Email Focus Section */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary-800">
                Student-Only Community
              </h3>
              <div className="mt-2 text-sm text-primary-700">
                <p>
                  We verify all students using their official college email addresses to maintain 
                  a trusted, student-only environment for authentic sharing and collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>

        <FormField
          label="Full Name"
          type="text"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter your full name"
        />

        <div className="space-y-2">
          <FormField
            label="College Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="your.name@college.edu"
            helperText="Use your official college email address for instant verification"
            onBlur={async (e) => {
              // Real-time domain validation feedback
              const email = e.target.value
              if (email && email.includes('@')) {
                try {
                  const domain = email.split('@')[1]
                  const validation = await AuthService.validateEmailDomain(email)
                  if (!validation) {
                    // Show helpful message for unsupported domains
                    console.log('Domain not supported, user can request addition')
                  }
                } catch (error) {
                  // Handle validation error silently
                  console.log('Domain validation error:', error)
                }
              }
            }}
          />
          <div className="text-xs text-gray-500">
            <p>✓ Supported domains: .edu, .ac.in, .edu.in, and 500+ verified college domains</p>
            <p>✓ Don't have college email? We support database verification for select colleges</p>
          </div>
        </div>

        <Select
          label="I am a"
          {...register('role')}
          error={errors.role?.message}
          options={roleOptions}
          helperText="Students get full access, aspirants can browse communities and ask questions"
        />

        <FormField
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Create a strong password"
          helperText="At least 8 characters with letters and numbers"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          {loading ? 'Creating Account...' : 'Create Account & Verify Email'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>🔒 Secure</span>
            <span>📧 Verified</span>
            <span>👥 Student-Only</span>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}