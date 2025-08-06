'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { AuthService, type CollegeDomain } from '@/lib/auth'

export default function CollegeManagementPage() {
  const [colleges, setColleges] = useState<CollegeDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadColleges()
  }, [])

  const loadColleges = async () => {
    try {
      setLoading(true)
      const data = await AuthService.getColleges()
      setColleges(data)
    } catch (error) {
      console.error('Failed to load colleges:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredColleges = colleges.filter(college => {
    const matchesSearch = college.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (college.domain && college.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'email' && college.provides_email) ||
                         (filterType === 'database' && !college.provides_email) ||
                         (filterType === 'inactive' && !college.is_active)
    
    return matchesSearch && matchesFilter
  })

  const filterOptions = [
    { value: 'all', label: 'All Colleges' },
    { value: 'email', label: 'Email Verification' },
    { value: 'database', label: 'Database Verification' },
    { value: 'inactive', label: 'Inactive' },
  ]

  return (
    <AdminLayout title="College Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <FormField
              label=""
              type="text"
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select
              label=""
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={filterOptions}
              className="w-48"
            />
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            Add College Domain
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{colleges.length}</div>
            <div className="text-sm text-gray-600">Total Colleges</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-success-600">
              {colleges.filter(c => c.provides_email).length}
            </div>
            <div className="text-sm text-gray-600">Email Verification</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-primary-600">
              {colleges.filter(c => !c.provides_email).length}
            </div>
            <div className="text-sm text-gray-600">Database Verification</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-warning-600">
              {colleges.filter(c => !c.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
        </div>

        {/* Colleges Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Colleges ({filteredColleges.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading colleges...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredColleges.map((college) => (
                    <tr key={college.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {college.college_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {college.domain || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          college.provides_email 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {college.provides_email ? 'Email' : 'Database'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          college.is_active 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-error-100 text-error-800'
                        }`}>
                          {college.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {college.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Edit college */}}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* View students */}}
                          >
                            Students
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredColleges.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No colleges found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add College Modal would go here */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add College Domain</h3>
            <p className="text-sm text-gray-600 mb-4">
              This feature will be implemented in the next phase.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddForm(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}