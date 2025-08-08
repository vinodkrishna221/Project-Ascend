'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { emailVerificationSchema, type EmailVerificationFormData } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailVerificationFormData>({
    resolver: zodResolver(emailVerificationSchema),
  })

  const onSubmit = async (data: EmailVerificationFormData) => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Implement password reset functionality
      // This would call Supabase auth.resetPasswordForEmail()
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you a password reset link"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              If an account with that email exists, we've sent you a password reset link.
            </p>
            <p className="text-sm text-gray-500">
              Check your email and follow the instructions to reset your password.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-primary-600 hover:text-primary-500"
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <FormField
          label="Email Address"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="your.name@college.edu"
          helperText="Enter the email address associated with your account"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Send Reset Link
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}