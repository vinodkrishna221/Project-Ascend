'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { AuthService, type CollegeDomain } from '@/lib/auth'

export default function CollegeSelectionPage() {
  const router = useRouter()
  const [colleges, setColleges] = useState<CollegeDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [verificationFilter, setVerificationFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    loadColleges()
  }, [])

  const loadColleges = async () => {
    try {
      setLoading(true)
      const data = await AuthService.getColleges()
      setColleges(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load colleges')
    } finally {
      setLoading(false)
    }
  }

  // Advanced filtering and sorting
  const filteredColleges = colleges
    .filter(college => {
      const matchesSearch = college.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           college.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (college.domain && college.domain.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCountry = !countryFilter || college.country === countryFilter
      
      const matchesVerification = !verificationFilter || 
                                 (verificationFilter === 'email' && college.provides_email) ||
                                 (verificationFilter === 'database' && !college.provides_email)
      
      return matchesSearch && matchesCountry && matchesVerification
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.college_name.localeCompare(b.college_name)
        case 'country':
          return a.country.localeCompare(b.country)
        case 'verification':
          return (a.provides_email ? 'email' : 'database').localeCompare(
            b.provides_email ? 'email' : 'database'
          )
        default:
          return 0
      }
    })

  const emailColleges = filteredColleges.filter(college => college.provides_email)
  const databaseColleges = filteredColleges.filter(college => !college.provides_email)
  
  // Get unique countries for filter
  const countries = Array.from(new Set(colleges.map(c => c.country))).sort()

  const handleCollegeSelect = (college: CollegeDomain) => {
    if (college.provides_email) {
      // Redirect to signup with college info
      router.push(`/auth/signup?college_id=${college.id}`)
    } else {
      // Redirect to college database verification
      router.push(`/auth/college-verification?college_id=${college.id}`)
    }
  }

  return (
    <AuthLayout
      title="Select your college"
      subtitle="Choose your college to get started with verification"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Enhanced Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by college name, country, or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 pr-4 w-full"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showAdvancedFilters 
                    ? 'bg-primary-50 text-primary-700 border-primary-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
              
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-lg border-l border-gray-300 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Country"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Countries' },
                    ...countries.map(country => ({ value: country, label: country }))
                  ]}
                  className="text-sm"
                />
                
                <Select
                  label="Verification Type"
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'email', label: 'Email Verification' },
                    { value: 'database', label: 'Database Verification' }
                  ]}
                  className="text-sm"
                />
                
                <Select
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'name', label: 'College Name' },
                    { value: 'country', label: 'Country' },
                    { value: 'verification', label: 'Verification Type' }
                  ]}
                  className="text-sm"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {filteredColleges.length} of {colleges.length} colleges shown
                </div>
                
                {(searchTerm || countryFilter || verificationFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setCountryFilter('')
                      setVerificationFilter('')
                    }}
                    className="text-primary-600 hover:text-primary-500 font-medium text-sm"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Search Results Summary */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                Found {filteredColleges.length} colleges
                {searchTerm && ` matching "${searchTerm}"`}
                {countryFilter && ` in ${countryFilter}`}
                {verificationFilter && ` with ${verificationFilter} verification`}
              </span>
              
              {filteredColleges.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    {emailColleges.length} Email
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    {databaseColleges.length} Database
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading colleges...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Combined College Display */}
            {filteredColleges.length > 0 ? (
              <div>
                {viewMode === 'list' ? (
                  <div className="space-y-6">
                    {emailColleges.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Email Verification ({emailColleges.length})
                          </h3>
                          <div className="flex items-center text-success-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            Instant verification
                          </div>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {emailColleges.map((college) => (
                            <button
                              key={college.id}
                              onClick={() => handleCollegeSelect(college)}
                              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{college.college_name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm text-gray-500">{college.country}</p>
                                    {college.domain && (
                                      <p className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                        @{college.domain}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center text-success-600">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                  </svg>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {databaseColleges.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Database Verification ({databaseColleges.length})
                          </h3>
                          <div className="flex items-center text-primary-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                            Student credentials required
                          </div>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {databaseColleges.map((college) => (
                            <button
                              key={college.id}
                              onClick={() => handleCollegeSelect(college)}
                              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{college.college_name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm text-gray-500">{college.country}</p>
                                    <p className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      Verify with student credentials
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center text-primary-600">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredColleges.map((college) => (
                      <button
                        key={college.id}
                        onClick={() => handleCollegeSelect(college)}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 line-clamp-2">{college.college_name}</p>
                              <p className="text-sm text-gray-500 mt-1">{college.country}</p>
                            </div>
                            <div className={`flex items-center p-2 rounded-full ${
                              college.provides_email ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'
                            }`}>
                              {college.provides_email ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {college.domain && (
                              <p className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block">
                                @{college.domain}
                              </p>
                            )}
                            <div className={`text-xs px-2 py-1 rounded inline-block ${
                              college.provides_email 
                                ? 'bg-success-50 text-success-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {college.provides_email ? 'Email verification' : 'Student credentials required'}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No colleges found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || countryFilter || verificationFilter 
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'No colleges are currently available.'}
                </p>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/auth/request-college')}
                  >
                    Request to Add College
                  </Button>
                  {(searchTerm || countryFilter || verificationFilter) && (
                    <div>
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setCountryFilter('')
                          setVerificationFilter('')
                        }}
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Can't find your college?{' '}
            <button
              onClick={() => router.push('/auth/request-college')}
              className="text-primary-600 hover:text-primary-500"
            >
              Request to add it
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}