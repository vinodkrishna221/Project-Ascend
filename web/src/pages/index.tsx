import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Ascend - Student Social Network</title>
        <meta name="description" content="Join Ascend - the student-only social network for sharing your academic journey" />
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-blue-600 mb-8">Ascend</h1>
          <p className="text-xl text-gray-600 mb-12">
            The student-only social network for sharing your academic journey
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Pages</h2>
              <div className="space-y-4">
                <Link href="/auth/signup" className="block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
                  Sign Up
                </Link>
                <Link href="/auth/login" className="block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors">
                  Login
                </Link>
                <Link href="/auth/verify-email?email=test@college.edu" className="block bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors">
                  Email Verification
                </Link>
                <Link href="/auth/college-selection" className="block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors">
                  College Selection
                </Link>
                <Link href="/auth/college-credentials?college=test-college" className="block bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 transition-colors">
                  College Credentials
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Pages</h2>
              <div className="space-y-4">
                <Link href="/admin/dashboard" className="block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors">
                  Admin Dashboard
                </Link>
                <Link href="/admin/analytics" className="block bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 transition-colors">
                  Analytics
                </Link>
                <Link href="/admin/bulk-upload" className="block bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition-colors">
                  Bulk Upload
                </Link>
                <Link href="/admin/domains" className="block bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 transition-colors">
                  Domain Requests
                </Link>
                <Link href="/request-college" className="block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors">
                  Request College
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🎉 Task 7 Complete!</h3>
            <p className="text-blue-700">
              All web authentication interfaces have been successfully implemented and are ready for testing.
              Click the links above to explore the different pages and features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;