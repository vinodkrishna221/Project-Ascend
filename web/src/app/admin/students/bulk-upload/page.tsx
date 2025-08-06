'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'

import { Select } from '@/components/ui/Select'
import { AuthService, type CollegeDomain } from '@/lib/auth'

interface UploadResult {
  success: boolean
  processed: number
  errors: string[]
  duplicates: number
}

export default function BulkUploadPage() {
  const [colleges, setColleges] = useState<CollegeDomain[]>([])
  const [selectedCollege, setSelectedCollege] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadColleges()
  }, [])

  const loadColleges = async () => {
    try {
      const data = await AuthService.getColleges()
      setColleges(data.filter(c => !c.provides_email)) // Only show database verification colleges
    } catch (error) {
      console.error('Failed to load colleges:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedCollege || !file) {
      setError('Please select a college and upload a CSV file')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('college_id', selectedCollege)

      const response = await fetch('/api/admin/students/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed')
      }

      setResult(data.result)
      
      // Clear form
      setFile(null)
      setSelectedCollege('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `student_name,branch,year,roll_number,verification_password
John Doe,Computer Science,2024,21CS001,password123
Jane Smith,Mechanical Engineering,2023,20ME045,password456
Mike Johnson,Electrical Engineering,2024,21EE078,password789`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_upload_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const collegeOptions = [
    { value: '', label: 'Select College' },
    ...colleges.map(college => ({
      value: college.id,
      label: college.college_name,
    })),
  ]

  return (
    <AdminLayout title="Bulk Student Upload">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Instructions */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-primary-900 mb-4">
            Upload Student Data for Database Verification
          </h2>
          <div className="space-y-3 text-sm text-primary-800">
            <p>
              This tool allows you to bulk upload student data for colleges that use database verification 
              (colleges that don't provide email addresses to students).
            </p>
            <div>
              <p className="font-medium mb-2">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>student_name:</strong> Full name as registered in college records</li>
                <li><strong>branch:</strong> Department or branch name</li>
                <li><strong>year:</strong> Current academic year (e.g., 2024)</li>
                <li><strong>roll_number:</strong> Student roll number (optional but recommended)</li>
                <li><strong>verification_password:</strong> Unique password for student verification</li>
              </ul>
            </div>
            <p className="text-primary-700">
              <strong>Important:</strong> Passwords will be automatically hashed for security. 
              Make sure each password is unique within the college.
            </p>
          </div>
        </div>

        {/* Enhanced Upload Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Student Data</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select College"
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                options={collegeOptions}
                helperText="Only colleges with database verification are shown"
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  College Statistics
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    {selectedCollege ? (
                      <>
                        <div className="font-medium text-gray-900 mb-2">
                          {colleges.find(c => c.id === selectedCollege)?.college_name}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-gray-500">Current Students</div>
                            <div className="font-medium text-gray-900">Loading...</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Last Upload</div>
                            <div className="font-medium text-gray-900">Never</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Active Records</div>
                            <div className="font-medium text-gray-900">-</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Verification Rate</div>
                            <div className="font-medium text-gray-900">-</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-2">
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div>Select a college to see statistics</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CSV File Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600 hover:text-primary-500">
                        Click to upload
                      </span>
                      {' '}or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">CSV files only, up to 10MB</p>
                  </div>
                </label>
              </div>
              
              {file && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-primary-900">{file.name}</p>
                        <p className="text-xs text-primary-700">
                          {(file.size / 1024).toFixed(1)} KB • {file.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-error-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={handleUpload}
                loading={loading}
                disabled={!selectedCollege || !file}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Upload Student Data'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setSelectedCollege('')
                  setError(null)
                  setResult(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={loading}
              >
                Clear Form
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-success-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-success-600">{result.processed}</div>
                <div className="text-sm text-success-800">Students Processed</div>
              </div>
              <div className="bg-warning-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-warning-600">{result.duplicates}</div>
                <div className="text-sm text-warning-800">Duplicates Skipped</div>
              </div>
              <div className="bg-error-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-error-600">{result.errors.length}</div>
                <div className="text-sm text-error-800">Errors</div>
              </div>
            </div>

            {result.success ? (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
                ✅ Upload completed successfully! {result.processed} students added to the database.
              </div>
            ) : (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
                ❌ Upload completed with errors. Please review the error list below.
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="text-sm text-gray-700 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-error-500 mr-2">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sample Data Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sample CSV Format</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    student_name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    roll_number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    verification_password
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">John Doe</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Computer Science</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">21CS001</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">password123</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jane Smith</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mechanical Engineering</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">20ME045</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">password456</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}