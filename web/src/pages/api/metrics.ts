import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Simple metrics collector
class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(name: string, value: number = 1) {
    this.counters.set(name, (this.counters.get(name) || 0) + value);
  }

  gauge(name: string, value: number) {
    this.metrics.set(name, value);
  }

  histogram(name: string, value: number) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(value);
  }

  getPrometheusFormat(): string {
    let output = '';

    // Counters
    for (const [name, value] of this.counters) {
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${value}\n`;
    }

    // Gauges
    for (const [name, value] of this.metrics) {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n`;
    }

    // Histograms (simplified)
    for (const [name, values] of this.histograms) {
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const p50 = sorted[Math.floor(count * 0.5)];
        const p95 = sorted[Math.floor(count * 0.95)];
        const p99 = sorted[Math.floor(count * 0.99)];

        output += `# TYPE ${name} histogram\n`;
        output += `${name}_count ${count}\n`;
        output += `${name}_sum ${sum}\n`;
        output += `${name}_bucket{le="0.5"} ${p50}\n`;
        output += `${name}_bucket{le="0.95"} ${p95}\n`;
        output += `${name}_bucket{le="0.99"} ${p99}\n`;
        output += `${name}_bucket{le="+Inf"} ${count}\n`;
      }
    }

    return output;
  }
}

const metrics = new MetricsCollector();
const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    // Basic application metrics
    metrics.gauge('ascend_auth_uptime_seconds', (Date.now() - startTime) / 1000);
    metrics.gauge('ascend_auth_memory_usage_bytes', process.memoryUsage().heapUsed);
    metrics.gauge('ascend_auth_memory_total_bytes', process.memoryUsage().heapTotal);

    // Environment info
    metrics.gauge('ascend_auth_nodejs_version_info', 1);

    // Supabase connection metrics
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Database metrics
      try {
        const dbStart = Date.now();
        const { count: profileCount, error: profileError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        const dbResponseTime = Date.now() - dbStart;
        metrics.histogram('ascend_auth_db_query_duration_seconds', dbResponseTime / 1000);

        if (!profileError && profileCount !== null) {
          metrics.gauge('ascend_auth_total_users', profileCount);
        }

        // Check for recent signups (last 24 hours)
        const { count: recentSignups } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (recentSignups !== null) {
          metrics.gauge('ascend_auth_signups_24h', recentSignups);
        }

        // Check verification status distribution
        const { data: verificationStats } = await supabase
          .from('profiles')
          .select('verification_status')
          .not('verification_status', 'is', null);

        if (verificationStats) {
          const statusCounts = verificationStats.reduce((acc, profile) => {
            acc[profile.verification_status] = (acc[profile.verification_status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          for (const [status, count] of Object.entries(statusCounts)) {
            metrics.gauge(`ascend_auth_users_by_status{status="${status}"}`, count);
          }
        }

        metrics.gauge('ascend_auth_database_healthy', 1);
      } catch (error) {
        metrics.gauge('ascend_auth_database_healthy', 0);
        metrics.increment('ascend_auth_database_errors_total');
      }

      // Auth service metrics
      try {
        const authStart = Date.now();
        await supabase.auth.getSession();
        const authResponseTime = Date.now() - authStart;
        metrics.histogram('ascend_auth_service_duration_seconds', authResponseTime / 1000);
        metrics.gauge('ascend_auth_service_healthy', 1);
      } catch (error) {
        metrics.gauge('ascend_auth_service_healthy', 0);
        metrics.increment('ascend_auth_service_errors_total');
      }

      // Storage service metrics
      try {
        const storageStart = Date.now();
        await supabase.storage.listBuckets();
        const storageResponseTime = Date.now() - storageStart;
        metrics.histogram('ascend_auth_storage_duration_seconds', storageResponseTime / 1000);
        metrics.gauge('ascend_auth_storage_healthy', 1);
      } catch (error) {
        metrics.gauge('ascend_auth_storage_healthy', 0);
        metrics.increment('ascend_auth_storage_errors_total');
      }
    } else {
      metrics.gauge('ascend_auth_database_healthy', 0);
      metrics.gauge('ascend_auth_service_healthy', 0);
      metrics.gauge('ascend_auth_storage_healthy', 0);
    }

    // Authentication-specific metrics (these would be incremented by actual auth endpoints)
    metrics.gauge('ascend_auth_email_verifications_pending', 0); // Placeholder
    metrics.gauge('ascend_auth_college_verifications_pending', 0); // Placeholder

    // Generate Prometheus format output
    const prometheusOutput = metrics.getPrometheusFormat();

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(prometheusOutput);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    res.status(500).send('# Error generating metrics\n');
  }
}