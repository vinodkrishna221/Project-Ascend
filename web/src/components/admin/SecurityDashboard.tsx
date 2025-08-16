// Security Dashboard Component for Ascend Authentication System

import React, { useState, useEffect } from 'react';

interface SecurityMetrics {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  recentAuditEvents: number;
  gdprRequests: number;
  complianceViolations: number;
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  riskLevel: string;
  success: boolean;
  details: any;
}

export const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalIncidents: 0,
    activeIncidents: 0,
    criticalIncidents: 0,
    recentAuditEvents: 0,
    gdprRequests: 0,
    complianceViolations: 0,
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load security metrics via API endpoints
      const [metricsResponse, eventsResponse] = await Promise.all([
        fetch('/api/admin/security-metrics'),
        fetch('/api/admin/security-events'),
      ]);

      if (metricsResponse.ok && eventsResponse.ok) {
        const metricsData = await metricsResponse.json();
        const eventsData = await eventsResponse.json();

        setMetrics(metricsData);
        setRecentEvents(eventsData.events || []);
      } else {
        // Fallback to mock data for development
        setMetrics({
          totalIncidents: 5,
          activeIncidents: 2,
          criticalIncidents: 1,
          recentAuditEvents: 15,
          gdprRequests: 3,
          complianceViolations: 0,
        });

        setRecentEvents([
          {
            id: '1',
            timestamp: new Date().toISOString(),
            eventType: 'authentication_success',
            riskLevel: 'low',
            success: true,
            details: { action: 'user_login' },
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            eventType: 'authentication_failure',
            riskLevel: 'medium',
            success: false,
            details: { action: 'failed_login', attempts: 3 },
          },
        ]);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
      
      // Fallback to mock data
      setMetrics({
        totalIncidents: 0,
        activeIncidents: 0,
        criticalIncidents: 0,
        recentAuditEvents: 0,
        gdprRequests: 0,
        complianceViolations: 0,
      });
      setRecentEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSuccessColor = (success: boolean): string => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  if (loading && recentEvents.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <button
          onClick={loadSecurityData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.activeIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.criticalIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Events (24h)</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.recentAuditEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">🔒</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">GDPR Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.gdprRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚖️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance Issues</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.complianceViolations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Security Events</h2>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.eventType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(event.riskLevel)}`}>
                      {event.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getSuccessColor(event.success)}`}>
                      {event.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {JSON.stringify(event.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {recentEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent security events found.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Run Compliance Check
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Export Audit Logs
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Generate Security Report
          </button>
        </div>
      </div>
    </div>
  );
};