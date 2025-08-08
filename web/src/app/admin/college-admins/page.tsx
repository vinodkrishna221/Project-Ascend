'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'

interface CollegeAdmin {
  id: string
  college_id: string
  college_name: string
  admin_email: string
  admin_name: string
  permissions: {
    can_add_students: boolean
    can_remove_students: boolean
    can_view_analytics: boolean
  }
  is_active: boolean
  created_at: string
  last_login?: string
}

interface College {
  id: string
  college_name: string
  provides_email: boolean
}

export default function CollegeAdminsPage() {
  const [admins, setAdmins] = useState<CollegeAdmin[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<CollegeAdmin | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration - in real implementation, fetch from API
      const mockAdmins: CollegeAdmin[] = [
        {
          id: '1',
          college_id: 'college-1',
          college_name: 'IIT Delhi',
          admin_email: 'admin@iitd.ac.in',
          admin_name: 'Dr. Rajesh Kumar',
          permissions: {
            can_add_students: true,
            can_remove_students: true,
            can_view_analytics: true,
          },
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          last_login: '2024-01-20T14:30:00Z',
        },
        {
          id: '2',
          college_id: 'college-2',
          college_name: 'BITS Pilani',
          admin_email: 'registrar@pilani.bits-pilani.ac.in',
          admin_name: 'Prof. Meera Sharma',
          permissions: {
            can_add_students: true,
            can_remove_students: false,
            can_view_analytics: true,
          },
          is_active: false,
          created_at: '2024-01-10T09:00:00Z',
        },
      ]

      const mockColleges: College[] = [
        { id: 'college-1', college_name: 'IIT Delhi', provides_email: true },
        { id: 'college-2', college_name: 'BITS Pilani', provides_email: true },
        { id: 'college-3', college_name: 'NIT Trichy', provides_email: false },
      ]

      setAdmins(mockAdmins)
      setColleges(mockColleges)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (admin: CollegeAdmin) => {
    try {
      // TODO: Implement API call to toggle admin status
      console.log('Toggling status for admin:', admin.id)
      
      setAdmins(prev => prev.map(a => 
        a.id === admin.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (error) {
      console.error('Failed to toggle admin status:', error)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-success-100 text-success-800' 
      : 'bg-gray-100 text-gray-800'
  }

  return (
    <AdminLayout title="College Administrators">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">College Administrator Management</h2>
            <p className="text-gray-600">Manage college administrators for future self-service transition</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add College Admin
          </Button>
        </div>

        {/* Future Transition Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-primary-900">
                Future College Admin Transition
              </h3>
              <div className="mt-2 text-sm text-primary-800">
                <p className="mb-2">
                  This interface is being prepared for the future transition where colleges will manage their own student data.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Phase 1 (Current):</strong> Ascend manages all college data centrally</li>
                  <li><strong>Phase 2 (Future):</strong> Colleges get admin access to manage their own student databases</li>
                  <li><strong>Phase 3 (Long-term):</strong> Full self-service college administration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-primary-600">
              {admins.length}
            </div>
            <div className="text-sm text-gray-600">Total Admins</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-success-600">
              {admins.filter(a => a.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Admins</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-secondary-600">
              {colleges.filter(c => !c.provides_email).length}
            </div>
            <div className="text-sm text-gray-600">Database Colleges</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-warning-600">
              {admins.filter(a => !a.last_login).length}
            </div>
            <div className="text-sm text-gray-600">Never Logged In</div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">College Administrators</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading administrators...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {admin.admin_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {admin.admin_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.college_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.can_add_students && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                              Add Students
                            </span>
                          )}
                          {admin.permissions.can_remove_students && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 text-warning-800">
                              Remove Students
                            </span>
                          )}
                          {admin.permissions.can_view_analytics && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-secondary-100 text-secondary-800">
                              View Analytics
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(admin.is_active)}`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.last_login 
                          ? new Date(admin.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAdmin(admin)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(admin)}
                            className={admin.is_active ? 'text-error-600 border-error-300' : 'text-success-600 border-success-300'}
                          >
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {admins.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No college administrators found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transition Roadmap */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">College Admin Transition Roadmap</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Phase 1: Centralized Management (Current)</h4>
                <p className="text-sm text-gray-600">Ascend team manages all college data and student verification processes.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Phase 2: Gradual Transition (Planned)</h4>
                <p className="text-sm text-gray-600">College administrators get access to manage their own student databases with Ascend oversight.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Phase 3: Full Self-Service (Future)</h4>
                <p className="text-sm text-gray-600">Colleges have complete control over their student verification processes and data management.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}