'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { AuthService, collegeCredentialsSchema, type CollegeCredentialsFormData, type CollegeDomain } from '@/lib/auth'

export default function CollegeVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const collegeId = searchParams.get('college_id')
  
  const [college, setCollege] = useState<CollegeDomain | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CollegeCredentialsFormData>({
    resolver: zodResolver(collegeCredentialsSchema),
  })

  useEffect(() => {
    if (!collegeId) {
      router.push('/auth/college-selection')
      return
    }

    setValue('college_id', collegeId)
    loadCollegeInfo()
  }, [collegeId, router, setValue])

  const loadCollegeInfo = async () => {
    if (!collegeId) return

    try {
      const colleges = await AuthService.getColleges()
      const collegeInfo = colleges.find(c => c.id === collegeId)
      setCollege(collegeInfo || null)
    } catch (err) {
      setError('Failed to load college information')
    }
  }

  const onSubmit = async (data: CollegeCredentialsFormData) => {
    try {
      setLoading(true)
      setError(null)

      await AuthService.verifyCollegeCredentials(data)
      
      // Redirect to success page or dashboard
      router.push('/auth/verification-success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (!collegeId || !college) {
    return (
      <AuthLayout title="Loading..." subtitle="Please wait while we load college information">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </AuthLayout>
    )
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }))

  return (
    <AuthLayout
      title="Verify your student status"
      subtitle={`Enter your credentials for ${college.college_name}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary-800">
                Database Verification for {college.college_name}
              </h3>
              <div className="mt-2 text-sm text-primary-700 space-y-2">
                <p>
                  {college.college_name} doesn't provide email addresses to students. 
                  We verify students using credentials provided by your college administration.
                </p>
                <div className="bg-white rounded-md p-3 mt-3">
                  <p className="font-medium text-primary-800 mb-1">What you'll need:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Your full name (as registered in college records)</li>
                    <li>• Your branch/department name</li>
                    <li>• Current academic year</li>
                    <li>• Verification password (provided by college)</li>
                    <li>• Roll number (if available)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FormField
          label="Full Name"
          type="text"
          {...register('student_name')}
          error={errors.student_name?.message}
          placeholder="Enter your full name as registered"
          helperText="Use the exact name as it appears in college records"
        />

        <FormField
          label="Branch/Department"
          type="text"
          {...register('branch')}
          error={errors.branch?.message}
          placeholder="e.g., Computer Science, Mechanical Engineering"
          helperText="Enter your branch or department name"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Year of Study"
            type="number"
            {...register('year', { valueAsNumber: true })}
            error={errors.year?.message}
            placeholder="2024"
            min={2020}
            max={2030}
            helperText="Current academic year"
          />

          <FormField
            label="Roll Number (Optional)"
            type="text"
            {...register('roll_number')}
            error={errors.roll_number?.message}
            placeholder="e.g., 21CS001"
            helperText="If available"
          />
        </div>

        <FormField
          label="Verification Password"
          type="password"
          {...register('verification_password')}
          error={errors.verification_password?.message}
          placeholder="Enter verification password"
          helperText="Password provided by your college for student verification"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Verify Student Status
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Don't have your verification credentials?
          </p>
          <p className="text-xs text-gray-500">
            Contact your college administration or{' '}
            <a href="mailto:support@ascend.com" className="text-primary-600 hover:text-primary-500">
              reach out to our support team
            </a>
          </p>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/auth/college-selection')}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            ← Choose a different college
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}