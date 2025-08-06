'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Select } from '@/components/ui/Select'

interface AnalyticsData {
  totalVerifications: number
  successfulVerifications: number
  failedVerifications: number
  emailVerifications: number
  databaseVerifications: number
  verificationsByCollege: Array<{
    college_name: string
    total: number
    successful: number
    success_rate: number
  }>
  verificationsByDay: Array<{
    date: string
    total: number
    successful: number
  }>
  topColleges: Array<{
    college_name: string
    student_count: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration
      const mockData: AnalyticsData = {
        totalVerifications: 1250,
        successfulVerifications: 1180,
        failedVerifications: 70,
        emailVerifications: 850,
        databaseVerifications: 330,
        verificationsByCollege: [
          { college_name: 'IIT Delhi', total: 150, successful: 145, success_rate: 96.7 },
          { college_name: 'BITS Pilani', total: 120, successful: 118, success_rate: 98.3 },
          { college_name: 'NIT Trichy', total: 100, successful: 95, success_rate: 95.0 },
        ],
        verificationsByDay: [
          { date: '2024-01-01', total: 45, successful: 42 },
          { date: '2024-01-02', total: 52, successful: 50 },
          { date: '2024-01-03', total: 38, successful: 36 },
        ],
        topColleges: [
          { college_name: 'IIT Delhi', student_count: 2500 },
          { college_name: 'BITS Pilani', student_count: 2200 },
          { college_name: 'NIT Trichy', student_count: 1800 },
        ],
      }
      
      setAnalytics(mockData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' },
  ]

  if (loading || !analytics) {
    return (
      <AdminLayout title="Verification Analytics">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </div>
      </AdminLayout>
    )
  }

  const overallSuccessRate = ((analytics.successfulVerifications / analytics.totalVerifications) * 100).toFixed(1)

  return (
    <AdminLayout title="Verification Analytics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Analytics</h2>
            <p className="text-gray-600">Track verification success rates and user patterns</p>
          </div>
          <Select
            label=""
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={timeRangeOptions}
            className="w-48"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-primary-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.totalVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +12% from last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-success-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{overallSuccessRate}%</p>
                <p className="text-xs text-success-600 mt-1">
                  +2.1% improvement
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.emailVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((analytics.emailVerifications / analytics.totalVerifications) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Database Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.databaseVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((analytics.databaseVerifications / analytics.totalVerifications) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-error-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.failedVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-error-600 mt-1">
                  {((analytics.failedVerifications / analytics.totalVerifications) * 100).toFixed(1)}% failure rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-indigo-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(analytics.totalVerifications / 30)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  verifications/day
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification Success by College */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Verification Success by College</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.verificationsByCollege.slice(0, 5).map((college, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {college.college_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-success-600 h-2 rounded-full" 
                              style={{ width: `${college.success_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{college.success_rate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {college.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Colleges by Student Count */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Colleges by Students</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topColleges.map((college, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-yellow-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {college.college_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {college.student_count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Verification Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Verification Trends</h3>
            <div className="flex space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Total Attempts</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Successful</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between space-x-2">
            {analytics.verificationsByDay.slice(-7).map((day, index) => {
              const maxValue = Math.max(...analytics.verificationsByDay.map(d => d.total))
              const totalHeight = (day.total / maxValue) * 100
              const successHeight = (day.successful / maxValue) * 100
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end h-48 space-y-1">
                    <div 
                      className="bg-primary-200 rounded-t"
                      style={{ height: `${totalHeight - successHeight}%` }}
                    ></div>
                    <div 
                      className="bg-success-500 rounded-b"
                      style={{ height: `${successHeight}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    <div>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="font-medium">{day.successful}/{day.total}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Enhanced Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Methods</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email Verification</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.emailVerifications / analytics.totalVerifications) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {((analytics.emailVerifications / analytics.totalVerifications) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database Verification</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(analytics.databaseVerifications / analytics.totalVerifications) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {((analytics.databaseVerifications / analytics.totalVerifications) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Preferred Method</div>
              <div className="text-lg font-semibold text-gray-900">
                {analytics.emailVerifications > analytics.databaseVerifications ? 'Email' : 'Database'} Verification
              </div>
              <div className="text-xs text-gray-500">
                {analytics.emailVerifications > analytics.databaseVerifications 
                  ? `${(((analytics.emailVerifications - analytics.databaseVerifications) / analytics.totalVerifications) * 100).toFixed(1)}% more popular`
                  : `${(((analytics.databaseVerifications - analytics.emailVerifications) / analytics.totalVerifications) * 100).toFixed(1)}% more popular`
                }
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overall Success Rate</span>
                <div className="flex items-center">
                  <span className={`text-lg font-bold ${
                    parseFloat(overallSuccessRate) >= 95 ? 'text-success-600' :
                    parseFloat(overallSuccessRate) >= 90 ? 'text-warning-600' : 'text-error-600'
                  }`}>
                    {overallSuccessRate}%
                  </span>
                  <div className={`ml-2 w-2 h-2 rounded-full ${
                    parseFloat(overallSuccessRate) >= 95 ? 'bg-success-500' :
                    parseFloat(overallSuccessRate) >= 90 ? 'bg-warning-500' : 'bg-error-500'
                  }`}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Daily Verifications</span>
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(analytics.totalVerifications / 30)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Day Performance</span>
                <span className="text-lg font-bold text-gray-900">
                  {Math.max(...analytics.verificationsByDay.map(d => d.total))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="text-lg font-bold text-success-600">99.9%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">College Admin Transition</h3>
            <div className="space-y-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-900">MVP Phase</span>
                  <span className="text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full">Current</span>
                </div>
                <div className="text-xs text-primary-700">
                  Ascend manages all college data directly for rapid deployment and validation
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Transition Phase</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Planned</span>
                </div>
                <div className="text-xs text-gray-600">
                  Gradual handover to college administrators with training and support
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Readiness Indicators</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>System Stability</span>
                    <span className="text-success-600 font-medium">✓ Ready</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>College Interest</span>
                    <span className="text-warning-600 font-medium">⚠ Assessing</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Admin Training</span>
                    <span className="text-gray-500 font-medium">○ Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Future-Ready Interface Structure */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Future College Admin Features</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Coming Soon</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 opacity-75">
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="ml-3 font-medium text-gray-900">College Admin Dashboard</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Dedicated interface for college administrators to manage their student database independently
              </p>
              <div className="text-xs text-gray-500">
                Features: Student management, verification analytics, bulk operations
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 opacity-75">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="ml-3 font-medium text-gray-900">Self-Service Verification</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Allow colleges to set up and manage their own verification processes with minimal Ascend intervention
              </p>
              <div className="text-xs text-gray-500">
                Features: Custom verification flows, automated student onboarding
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 opacity-75">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="ml-3 font-medium text-gray-900">Advanced Analytics</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Provide colleges with detailed insights into their student engagement and verification patterns
              </p>
              <div className="text-xs text-gray-500">
                Features: Custom reports, trend analysis, student success metrics
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Transition Strategy</h4>
                <div className="mt-2 text-sm text-blue-800">
                  <p>
                    The transition to college-managed systems will be gradual and voluntary. Colleges will maintain 
                    full control over their data while benefiting from Ascend's infrastructure and support. This approach 
                    ensures system reliability while building sustainable partnerships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}