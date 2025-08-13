import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';

interface DashboardData {
  platform_health: 'excellent' | 'good' | 'needs_attention' | 'critical';
  kpis: {
    overall_success_rate: number;
    avg_response_time: number;
    onboarding_completion_rate: number;
    system_uptime: number;
    active_alerts_count: number;
    critical_alerts_count: number;
    user_satisfaction_score: number;
    total_verification_attempts: number;
  };
  insights: Array<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    action: string;
  }>;
  metrics: {
    authentication: {
      success_rates: {
        email_verification: { success_rate: number; avg_response_time_ms: number };
        database_verification: { success_rate: number; avg_response_time_ms: number };
        overall: { success_rate: number; avg_response_time_ms: number };
      };
      verification_patterns: {
        total_attempts: number;
        email_success_rate: number;
        database_success_rate: number;
        peak_hours: number[];
        suspicious_patterns: {
          multiple_attempts_same_ip: number;
          unusual_user_agents: number;
        };
      };
    };
    performance: {
      api_summary: Array<{
        endpoint: string;
        total_requests: number;
        avg_response_time_ms: number;
        error_rate: number;
      }>;
      system_health: {
        overall_status: 'healthy' | 'warning' | 'critical';
        metrics: { [key: string]: any };
      };
      avg_response_time: number;
    };
    user_experience: {
      onboarding_funnel: {
        overall_completion_rate: number;
        avg_total_time_minutes: number;
        steps: { [key: string]: any };
      };
      satisfaction_score: number;
      completion_rate: number;
    };
    alerts: {
      active_count: number;
      critical_count: number;
      recent_alerts: Array<{
        id: string;
        alert_name: string;
        severity: 'warning' | 'critical';
        message: string;
        created_at: string;
      }>;
    };
  };
}

const MonitoringDashboard: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState(24);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/analytics/dashboard?timeWindow=${timeWindow}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeWindow]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs_attention': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Monitoring Dashboard - Ascend Admin</title>
        <meta name="description" content="Real-time monitoring and analytics dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Real-time system health and performance metrics
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={1}>Last Hour</option>
                  <option value={24}>Last 24 Hours</option>
                  <option value={168}>Last Week</option>
                </select>
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {dashboardData && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Platform Health Status */}
            <div className="mb-8">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(dashboardData.platform_health)}`}>
                <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                Platform Status: {dashboardData.platform_health.charAt(0).toUpperCase() + dashboardData.platform_health.slice(1)}
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 font-semibold">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Success Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dashboardData.kpis.overall_success_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">⚡</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.round(dashboardData.kpis.avg_response_time)}ms
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Onboarding Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dashboardData.kpis.onboarding_completion_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      dashboardData.kpis.critical_alerts_count > 0 ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <span className={`font-semibold ${
                        dashboardData.kpis.critical_alerts_count > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {dashboardData.kpis.critical_alerts_count > 0 ? '⚠️' : '✅'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dashboardData.kpis.active_alerts_count}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {dashboardData.insights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h2>
                <div className="space-y-4">
                  {dashboardData.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
                    >
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm mt-1">{insight.message}</p>
                      <p className="text-sm mt-2 font-medium">Action: {insight.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Authentication Metrics */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Email Verification</span>
                      <span className="text-sm font-medium">
                        {dashboardData.metrics.authentication.success_rates.email_verification.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${dashboardData.metrics.authentication.success_rates.email_verification.success_rate}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database Verification</span>
                      <span className="text-sm font-medium">
                        {dashboardData.metrics.authentication.success_rates.database_verification.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${dashboardData.metrics.authentication.success_rates.database_verification.success_rate}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Total Attempts: {dashboardData.metrics.authentication.verification_patterns.total_attempts}
                    </p>
                    <p className="text-sm text-gray-600">
                      Suspicious IPs: {dashboardData.metrics.authentication.verification_patterns.suspicious_patterns.multiple_attempts_same_ip}
                    </p>
                  </div>
                </div>
              </div>

              {/* API Performance */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Performance</h3>
                <div className="space-y-3">
                  {dashboardData.metrics.performance.api_summary.slice(0, 5).map((api, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{api.endpoint}</p>
                        <p className="text-xs text-gray-500">{api.total_requests} requests</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{Math.round(api.avg_response_time_ms)}ms</p>
                        <p className="text-xs text-gray-500">{api.error_rate.toFixed(1)}% errors</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h3>
                {dashboardData.metrics.alerts.recent_alerts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.metrics.alerts.recent_alerts.map((alert) => (
                      <div key={alert.id} className="border-l-4 border-yellow-400 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{alert.alert_name}</p>
                            <p className="text-xs text-gray-500">{alert.message}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent alerts</p>
                )}
              </div>

              {/* User Experience */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Experience</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Onboarding Completion</span>
                      <span className="text-sm font-medium">
                        {dashboardData.metrics.user_experience.completion_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${dashboardData.metrics.user_experience.completion_rate}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Satisfaction Score: {dashboardData.metrics.user_experience.satisfaction_score.toFixed(1)}/5.0
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg Completion Time: {dashboardData.metrics.user_experience.onboarding_funnel.avg_total_time_minutes.toFixed(1)} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MonitoringDashboard;