import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface RequestFormData {
  collegeName: string;
  country: string;
  domain: string;
  verificationType: 'email' | 'database';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  additionalInfo: string;
}

const RequestCollegePage: React.FC = () => {
  const [formData, setFormData] = useState<RequestFormData>({
    collegeName: '',
    country: '',
    domain: '',
    verificationType: 'email',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    additionalInfo: ''
  });
  const [errors, setErrors] = useState<Partial<RequestFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RequestFormData> = {};

    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (formData.verificationType === 'email' && !formData.domain.trim()) {
      newErrors.domain = 'Domain is required for email verification';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/domains/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const result = await response.json();
        setErrors({ contactEmail: result.error?.message || 'Failed to submit request' });
      }
    } catch (error) {
      setErrors({ contactEmail: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Head>
          <title>Request Submitted - Ascend</title>
        </Head>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Request Submitted!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Thank you for your college addition request. We'll review it and get back to you within 2-3 business days.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/signup"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Request College Addition - Ascend</title>
        <meta name="description" content="Request to add your college to Ascend" />
      </Head>
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Request College Addition
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Don't see your college in our list? Request to add it here.
          </p>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* College Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">College Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700">
                      College/University Name *
                    </label>
                    <input
                      type="text"
                      id="collegeName"
                      value={formData.collegeName}
                      onChange={(e) => handleInputChange('collegeName', e.target.value)}
                      className={`mt-1 block w-full border ${
                        errors.collegeName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Enter the full official name of your college"
                    />
                    {errors.collegeName && (
                      <p className="mt-2 text-sm text-red-600">{errors.collegeName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`mt-1 block w-full border ${
                        errors.country ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., United States, India, Canada"
                    />
                    {errors.country && (
                      <p className="mt-2 text-sm text-red-600">{errors.country}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Method *
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="email-verification"
                          name="verificationType"
                          type="radio"
                          checked={formData.verificationType === 'email'}
                          onChange={() => handleInputChange('verificationType', 'email')}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <label htmlFor="email-verification" className="ml-3 block text-sm font-medium text-gray-700">
                          Email Verification
                          <p className="text-gray-500 text-xs">College provides email addresses to students</p>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="database-verification"
                          name="verificationType"
                          type="radio"
                          checked={formData.verificationType === 'database'}
                          onChange={() => handleInputChange('verificationType', 'database')}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <label htmlFor="database-verification" className="ml-3 block text-sm font-medium text-gray-700">
                          Database Verification
                          <p className="text-gray-500 text-xs">College doesn't provide email addresses</p>
                        </label>
                      </div>
                    </div>
                  </div>

                  {formData.verificationType === 'email' && (
                    <div className="sm:col-span-2">
                      <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                        Email Domain *
                      </label>
                      <input
                        type="text"
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => handleInputChange('domain', e.target.value)}
                        className={`mt-1 block w-full border ${
                          errors.domain ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        placeholder="e.g., student.college.edu, college.ac.in"
                      />
                      {errors.domain && (
                        <p className="mt-2 text-sm text-red-600">{errors.domain}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        The email domain that your college uses for student email addresses
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      className={`mt-1 block w-full border ${
                        errors.contactName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Your full name"
                    />
                    {errors.contactName && (
                      <p className="mt-2 text-sm text-red-600">{errors.contactName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className={`mt-1 block w-full border ${
                        errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="your.email@example.com"
                    />
                    {errors.contactEmail && (
                      <p className="mt-2 text-sm text-red-600">{errors.contactEmail}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      id="additionalInfo"
                      rows={4}
                      value={formData.additionalInfo}
                      onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Any additional information about your college or special requirements..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/auth/college-selection"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCollegePage;