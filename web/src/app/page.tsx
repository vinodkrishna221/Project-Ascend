import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Ascend
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A dedicated social network for students to share their academic journey, 
            showcase projects, and build meaningful connections with peers across colleges.
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/signup" 
              className="btn-primary inline-block"
            >
              Get Started
            </Link>
            <Link 
              href="/auth/login" 
              className="btn-secondary inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}