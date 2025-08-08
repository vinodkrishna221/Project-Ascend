'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

interface DomainRequest {
  id: string
  college_name: string
  college_domain?: string
  country: string
  provides_email: boolean
  requester_name: string
  requester_email: string
  additional_info?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export default function DomainRequestsPage() {
  const [requests, setRequests] = useState<DomainRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState<DomainRequest | null>(null)

  useEffect(() => {
    loadRequests()
  }, [filterStatus])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/domain-requests?status=${filterStatus}`)
      const result = await response.json()
      
      if (result.success) {
        setRequests(result.data)
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: DomainRequest) => {
    try {
      const response = await fetch(`/api/admin/domain-requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve request')
      }

      alert('Request approved! College has been added to the system.')
      loadRequests()
    } catch (error) {
      console.error('Failed to approve request:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve request')
    }
  }

  const handleReject = async (request: DomainRequest, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/domain-requests/${request.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reject request')
      }

      alert('Request rejected.')
      loadRequests()
    } catch (error) {
      console.error('Failed to reject request:', error)
      alert(error instanceof Error ? error.message : 'Failed to reject request')
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-warning-100 text-warning-800',
      approved: 'bg-success-100 text-success-800',
      rejected: 'bg-error-100 text-error-800',
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  return (
    <AdminLayout title="Domain Requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select
              label=""
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={statusOptions}
              className="w-48"
            />
          </div>
          <div className="text-sm text-gray-600">
            {requests.length} requests
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-warning-600">
              {requests.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-success-600">
              {requests.filter(r => r.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-error-600">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Domain Requests ({filterStatus})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading requests...</p>
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
                      Domain/Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.college_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.country}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {request.college_domain || 'N/A'}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.provides_email 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-primary-100 text-primary-800'
                          }`}>
                            {request.provides_email ? 'Email' : 'Database'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.requester_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.requester_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            View
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request)}
                                className="bg-success-600 hover:bg-success-700"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(request)}
                                className="text-error-600 border-error-300 hover:bg-error-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {requests.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No {filterStatus} requests found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">College Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.college_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.country}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Domain</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.college_domain || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.provides_email ? 'Email Verification' : 'Database Verification'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requester Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.requester_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requester Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.requester_email}</p>
                </div>
              </div>

              {selectedRequest.additional_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedRequest.additional_info}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
              {selectedRequest.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      handleApprove(selectedRequest)
                      setSelectedRequest(null)
                    }}
                    className="bg-success-600 hover:bg-success-700"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedRequest)
                      setSelectedRequest(null)
                    }}
                    className="text-error-600 border-error-300 hover:bg-error-50"
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}