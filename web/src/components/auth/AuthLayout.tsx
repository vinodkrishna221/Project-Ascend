'use client'

import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackToHome?: boolean
}

export function AuthLayout({ children, title, subtitle, showBackToHome = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Ascend
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {children}
        </div>
        
        {showBackToHome && (
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}