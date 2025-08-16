import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authService } from '../../lib/auth.service';

interface CredentialsFormData {
  studentName: string;
  branch: string;
  year: number;
  rollNumber: string;
  verificationPassword: string;
}

interface College {
  id: string;
  name: string;
  country: string;
}

const CollegeCredentialsPage: React.FC = () => {
  const router = useRouter();
  const { college: collegeId } = router.query;
  const [college, setCollege] = useState<College | null>(null);
  const [formData, setFormData] = useState<CredentialsFormData>({
    studentName: '',
    branch: '',
    year: new Date().getFullYear(),
    rollNumber: '',
    verificationPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollege, setIsLoadingCollege] = useState(true);

  const loadCollege = useCallback(async () => {
    try {
      const result = await authService.getColleges();
      if (result.success) {
        const foundCollege = result.data?.find((c: College) => c.id === collegeId);
        if (foundCollege) {
          setCollege(foundCollege);
        } else {
          setErrors({ general: 'College not found' });
        }
      } else {
        setErrors({ general: 'Failed to load college information' });
      }
    } catch (error) {
      setErrors({ general: 'Failed to load college information' });
    } finally {
      setIsLoadingCollege(false);
    }
  }, [collegeId]);

  // Load college information
  useEffect(() => {
    if (collegeId) {
      loadCollege();
    }
  }, [collegeId, loadCollege]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }

    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch/Department is required';
    }

    if (!formData.year || formData.year < 2020 || formData.year > new Date().getFullYear() + 4) {
      newErrors.year = 'Please enter a valid year';
    }

    if (!formData.verificationPassword.trim()) {
      newErrors.verificationPassword = 'Verification password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm() || !college) return;

    setIsLoading(true);
    try {
      const result = await authService.verifyCollegeCredentials({
        collegeId: college.id,
        studentName: formData.studentName,
        branch: formData.branch,
        year: formData.year,
        rollNumber: formData.rollNumber || undefined,
        verificationPassword: formData.verificationPassword
      });

      if (result.success) {
        // Redirect to success page or dashboard
        router.push('/auth/verification-success');
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : (result.error as any)?.message || 'Verification failed';
        const errorCode = typeof result.error === 'object' ? (result.error as any)?.code : undefined;
        
        if (errorCode === 'STUDENT_NOT_FOUND') {
          setErrors({ 
            general: 'Student not found in college database. Please check your details and try again.' 
          });
        } else if (errorCode === 'INVALID_PASSWORD') {
          setErrors({ 
            verificationPassword: 'Invalid verification password. Please check and try again.' 
          });
        } else if (errorCode === 'CREDENTIALS_ALREADY_USED') {
          setErrors({ 
            general: 'These credentials have already been used to create an account.' 
          });
        } else {
          setErrors({ 
            general: errorMessage
          });
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CredentialsFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    if (errors.general) {
      const newErrors = { ...errors };
      delete newErrors.general;
      setErrors(newErrors);
    }
  };

  if (isLoadingCollege) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading college information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">College Not Found</h2>
            <p className="text-gray-600 mb-6">The selected college could not be found.</p>
            <Link
              href="/auth/college-selection"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Return to College Selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Verify College Credentials - Ascend</title>
        <meta name="description" content="Verify your college credentials to join Ascend" />
      </Head>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Credentials
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your details to verify with
          </p>
          <p className="text-sm font-medium text-gray-900">{college.name}</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{errors.general}</span>
            </div>
          )}

          {/* Information Notice */}
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  Enter the details exactly as provided by your college administration.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Student Name */}
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                Full Name (as per college records)
              </label>
              <div className="mt-1">
                <input
                  id="studentName"
                  name="studentName"
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.studentName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your full name"
                />
                {errors.studentName && (
                  <p className="mt-2 text-sm text-red-600">{errors.studentName}</p>
                )}
              </div>
            </div>

            {/* Branch/Department */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                Branch/Department
              </label>
              <div className="mt-1">
                <input
                  id="branch"
                  name="branch"
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.branch ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="e.g., Computer Science, Mechanical Engineering"
                />
                {errors.branch && (
                  <p className="mt-2 text-sm text-red-600">{errors.branch}</p>
                )}
              </div>
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year of Study/Graduation
              </label>
              <div className="mt-1">
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="2020"
                  max={new Date().getFullYear() + 4}
                  required
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.year ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder={new Date().getFullYear().toString()}
                />
                {errors.year && (
                  <p className="mt-2 text-sm text-red-600">{errors.year}</p>
                )}
              </div>
            </div>

            {/* Roll Number (Optional) */}
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700">
                Roll Number/Student ID <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="mt-1">
                <input
                  id="rollNumber"
                  name="rollNumber"
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your roll number if available"
                />
              </div>
            </div>

            {/* Verification Password */}
            <div>
              <label htmlFor="verificationPassword" className="block text-sm font-medium text-gray-700">
                Verification Password
              </label>
              <div className="mt-1">
                <input
                  id="verificationPassword"
                  name="verificationPassword"
                  type="password"
                  required
                  value={formData.verificationPassword}
                  onChange={(e) => handleInputChange('verificationPassword', e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.verificationPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter the password provided by your college"
                />
                {errors.verificationPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.verificationPassword}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  This is the unique password provided by your college administration
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying Credentials...
                  </div>
                ) : (
                  'Verify Credentials'
                )}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don&apos;t have your verification password?{' '}
              <Link href="/help/verification-password" className="text-blue-600 hover:text-blue-500">
                Contact your college administration
              </Link>
            </p>
          </div>

          {/* Back to College Selection */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/college-selection"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to College Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeCredentialsPage;