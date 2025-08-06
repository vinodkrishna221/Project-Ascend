'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { AuthService, verificationCodeSchema, type VerificationCodeFormData } from '@/lib/auth'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationCodeFormData>({
    resolver: zodResolver(verificationCodeSchema),
  })

  useEffect(() => {
    if (!email) {
      router.push('/auth/signup')
      return
    }

    // Start countdown timer
    setTimeLeft(60)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const onSubmit = async (data: VerificationCodeFormData) => {
    if (!email) return

    try {
      setLoading(true)
      setError(null)

      await AuthService.verifyEmailCode(email, data.code)
      
      setSuccess('Email verified successfully! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email || timeLeft > 0) return

    try {
      setResendLoading(true)
      setError(null)

      await AuthService.sendEmailVerification(email)
      
      setSuccess('Verification code sent! Check your email.')
      setTimeLeft(60)
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a verification code to ${email}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="text-center">
          <div className="bg-primary-50 rounded-lg p-6 mb-6">
            <div className="text-primary-600 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Check your college email
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              We sent a 6-digit verification code to:
            </p>
            <p className="text-sm font-medium text-primary-600 bg-white px-3 py-1 rounded-md inline-block">
              {email}
            </p>
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>• Check your inbox and spam folder</p>
              <p>• Code expires in 15 minutes</p>
              <p>• Enter all 6 digits without spaces</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <FormField
            label="Verification Code"
            type="text"
            {...register('code')}
            error={errors.code?.message}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-widest font-mono"
            helperText="Enter the 6-digit code from your email"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            onInput={(e) => {
              // Auto-format and validate numeric input
              const target = e.target as HTMLInputElement
              target.value = target.value.replace(/[^0-9]/g, '').slice(0, 6)
            }}
          />
          <div className="flex justify-center">
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              Format: 123456 (no spaces or dashes)
            </div>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Verify Email
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-500">
              Resend available in {timeLeft} seconds
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              loading={resendLoading}
              className="text-sm"
            >
              Resend Code
            </Button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:support@ascend.com" className="text-primary-600 hover:text-primary-500">
              support@ascend.com
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}