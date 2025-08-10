import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authService } from '../../lib/auth.service';

interface VerificationFormData {
  code: string;
}

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const { email } = router.query;
  const [formData, setFormData] = useState<VerificationFormData>({ code: '' });
  const [errors, setErrors] = useState<{ code?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateForm = (): boolean => {
    const newErrors: { code?: string } = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Verification code is required';
    } else if (formData.code.length !== 6) {
      newErrors.code = 'Verification code must be 6 digits';
    } else if (!/^\d{6}$/.test(formData.code)) {
      newErrors.code = 'Verification code must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.verifyEmail({
        email: email as string,
        code: formData.code
      });

      if (result.success) {
        // Redirect to college selection or dashboard based on verification method
        if ((result as any).data?.needsCollegeSelection) {
          router.push('/auth/college-selection');
        } else {
          router.push('/dashboard');
        }
      } else {
        setAttempts(prev => prev + 1);
        
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Verification failed';
        const errorCode = typeof result.error === 'object' ? (result.error as any)?.code : undefined;
        
        if (errorCode === 'INVALID_CODE') {
          setErrors({ code: 'Invalid verification code. Please try again.' });
        } else if (errorCode === 'CODE_EXPIRED') {
          setErrors({ general: 'Verification code has expired. Please request a new one.' });
        } else if (errorCode === 'TOO_MANY_ATTEMPTS') {
          setErrors({ general: 'Too many failed attempts. Please request a new verification code.' });
        } else {
          setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return;

    setIsResending(true);
    setErrors({});
    
    try {
      const result = await authService.resendVerificationCode(email as string);
      
      if (result.success) {
        setResendCooldown(60); // 60 second cooldown
        setAttempts(0); // Reset attempts counter
        setFormData({ code: '' }); // Clear the code input
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to resend code';
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      setErrors({ general: 'Failed to resend verification code' });
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (value: string) => {
    // Only allow numeric input and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setFormData({ code: numericValue });
    
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (formData.code.length === 6 && !isLoading) {
      handleSubmit(new Event('submit') as any);
    }
  }, [formData.code]);

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h2>
            <p className="text-gray-600 mb-6">No email address provided for verification.</p>
            <Link
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Return to Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Verify Your Email - Ascend</title>
        <meta name="description" content="Verify your college email to join Ascend" />
      </Head>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="text-sm font-medium text-gray-900">{email}</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{errors.general}</span>
            </div>
          )}

          {attempts >= maxAttempts && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">
                Maximum attempts reached. Please request a new verification code.
              </span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Verification Code Input */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={formData.code}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl font-mono tracking-widest`}
                  placeholder="000000"
                  disabled={attempts >= maxAttempts}
                />
                {errors.code && (
                  <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || attempts >= maxAttempts || formData.code.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>
          </form>

          {/* Resend Code Section */}
          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  'Sending...'
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Check your spam folder or{' '}
              <Link href="/help/verification" className="text-blue-600 hover:text-blue-500">
                get help
              </Link>
            </p>
          </div>

          {/* Back to Sign Up */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/signup"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;