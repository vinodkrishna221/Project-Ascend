'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'

interface DashboardStats {
  totalColleges: number
  totalStudents: number
  verificationsPending: number
  verificationsToday: number
  domainRequests: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalColleges: 0,
    totalStudents: 0,
    verificationsPending: 0,
    verificationsToday: 0,
    domainRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      // This would call our API to get dashboard statistics
      // For now, using mock data
      setStats({
        totalColleges: 150,
        totalStudents: 2500,
        verificationsPending: 45,
        verificationsToday: 23,
        domainRequests: 8,
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Colleges',
      value: stats.totalColleges,
      icon: 'academic-cap',
      color: 'bg-primary-500',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: 'users',
      color: 'bg-success-500',
    },
    {
      title: 'Pending Verifications',
      value: stats.verificationsPending,
      icon: 'clock',
      color: 'bg-warning-500',
    },
    {
      title: 'Verifications Today',
      value: stats.verificationsToday,
      icon: 'check-circle',
      color: 'bg-success-500',
    },
    {
      title: 'Domain Requests',
      value: stats.domainRequests,
      icon: 'inbox',
      color: 'bg-secondary-500',
    },
  ]

  const getIcon = (iconName: string) => {
    const icons = {
      'academic-cap': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      ),
      users: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      ),
      clock: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      'check-circle': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      inbox: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      ),
    }
    return icons[iconName as keyof typeof icons] || icons.users
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getIcon(stat.icon)}
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => window.location.href = '/admin/colleges'}
                className="justify-center"
              >
                Manage College Domains
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/admin/students/bulk-upload'}
                className="justify-center"
              >
                Bulk Upload Students
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/domain-requests'}
                className="justify-center"
              >
                Review Domain Requests
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/analytics'}
                className="justify-center"
              >
                View Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-success-100 rounded-full p-2">
                    <svg className="h-4 w-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      New college domain added: iitdelhi.ac.in
                    </p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="bg-primary-100 rounded-full p-2">
                    <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Bulk upload completed: 150 students added to BITS Pilani
                    </p>
                    <p className="text-sm text-gray-500">4 hours ago</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="bg-warning-100 rounded-full p-2">
                    <svg className="h-4 w-4 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Domain request pending review: newcollege.edu.in
                    </p>
                    <p className="text-sm text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}