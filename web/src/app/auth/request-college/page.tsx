'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const domainRequestSchema = z.object({
  college_name: z.string().min(2, 'College name must be at least 2 characters'),
  college_domain: z.string().optional(),
  country: z.string().min(1, 'Please select a country'),
  provides_email: z.enum(['yes', 'no'], {
    required_error: 'Please specify if your college provides email addresses',
  }),
  requester_name: z.string().min(2, 'Your name must be at least 2 characters'),
  requester_email: z.string().email('Please enter a valid email address'),
  additional_info: z.string().optional(),
})

type DomainRequestFormData = z.infer<typeof domainRequestSchema>

export default function RequestCollegePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DomainRequestFormData>({
    resolver: zodResolver(domainRequestSchema),
  })

  const providesEmail = watch('provides_email')

  const onSubmit = async (data: DomainRequestFormData) => {
    try {
      setLoading(true)
      setError(null)

      // Submit domain request
      const response = await fetch('/api/admin/domain-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit request')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  const countryOptions = [
    { value: '', label: 'Select Country' },
    { value: 'India', label: 'India' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Other', label: 'Other' },
  ]

  const emailOptions = [
    { value: 'yes', label: 'Yes, students get email addresses' },
    { value: 'no', label: 'No, students don\'t get email addresses' },
  ]

  if (success) {
    return (
      <AuthLayout
        title="Request Submitted!"
        subtitle="We'll review your college addition request"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Thank you for your request! Our team will review the college information and add it to our system.
            </p>
            <p className="text-sm text-gray-500">
              We'll notify you via email once your college has been added and you can complete your registration.
            </p>
          </div>

          <div className="bg-primary-50 rounded-lg p-4">
            <h4 className="font-medium text-primary-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-primary-800 text-left space-y-1">
              <li>• Our team will verify the college information</li>
              <li>• We'll set up the appropriate verification method</li>
              <li>• You'll receive an email when it's ready (usually 2-3 business days)</li>
              <li>• You can then complete your registration</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth/signup')}
              className="w-full"
            >
              Back to Signup
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Questions about your request?{' '}
              <a href="mailto:support@ascend.com" className="text-primary-600 hover:text-primary-500">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Request College Addition"
      subtitle="Help us add your college to Ascend"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary-800">
                Help us expand our network
              </h3>
              <div className="mt-2 text-sm text-primary-700">
                <p>
                  We're constantly adding new colleges to Ascend. Please provide accurate information 
                  about your college so we can set up the appropriate verification method.
                </p>
                <div className="mt-3 text-xs text-primary-600">
                  <div className="flex items-center gap-4">
                    <span>📧 Email verification: 2-3 days</span>
                    <span>🗄️ Database verification: 3-5 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">College Information</h3>
          
          <FormField
            label="College Name"
            type="text"
            {...register('college_name')}
            error={errors.college_name?.message}
            placeholder="e.g., Indian Institute of Technology Delhi"
            helperText="Enter the full official name of your college"
          />

          <Select
            label="Country"
            {...register('country')}
            error={errors.country?.message}
            options={countryOptions}
            helperText="Select the country where your college is located"
          />

          <Select
            label="Does your college provide email addresses to students?"
            {...register('provides_email')}
            error={errors.provides_email?.message}
            options={emailOptions}
            helperText="This helps us determine the verification method"
          />

          {providesEmail === 'yes' && (
            <FormField
              label="College Email Domain"
              type="text"
              {...register('college_domain')}
              error={errors.college_domain?.message}
              placeholder="e.g., iitd.ac.in"
              helperText="Enter the domain part of student email addresses (without @)"
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Your Information</h3>
          
          <FormField
            label="Your Name"
            type="text"
            {...register('requester_name')}
            error={errors.requester_name?.message}
            placeholder="Enter your full name"
            helperText="We may contact you for additional verification"
          />

          <FormField
            label="Your Email Address"
            type="email"
            {...register('requester_email')}
            error={errors.requester_email?.message}
            placeholder="your.email@example.com"
            helperText="We'll notify you when your college is added"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Additional Information (Optional)
            </label>
            <textarea
              {...register('additional_info')}
              rows={3}
              className="input-field"
              placeholder="Any additional information about your college that might help us verify it..."
            />
            <p className="text-sm text-gray-500">
              Include any relevant details like college website, alternate domains, or verification processes
            </p>
          </div>
        </div>

        {/* Preview Section */}
        {watch('college_name') && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{watch('college_name')}</p>
                  <p className="text-sm text-gray-500">{watch('country') || 'Country not selected'}</p>
                  {watch('provides_email') === 'yes' && watch('college_domain') && (
                    <p className="text-xs text-primary-600">@{watch('college_domain')}</p>
                  )}
                  {watch('provides_email') === 'no' && (
                    <p className="text-xs text-gray-600">Verify with student credentials</p>
                  )}
                </div>
                <div className={`flex items-center ${
                  watch('provides_email') === 'yes' ? 'text-success-600' : 'text-primary-600'
                }`}>
                  {watch('provides_email') === 'yes' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="ml-1 text-xs">
                    {watch('provides_email') === 'yes' ? 'Email' : 'Database'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This is how your college will appear in the selection list once approved.
            </p>
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Submit Request
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Found your college in our list?{' '}
            <Link href="/auth/college-selection" className="text-primary-600 hover:text-primary-500 font-medium">
              Go back to selection
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}