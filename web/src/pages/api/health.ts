import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    auth: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    storage: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
  uptime: number;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheck>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'unhealthy', error: 'Method not allowed' },
        auth: { status: 'unhealthy', error: 'Method not allowed' },
        storage: { status: 'unhealthy', error: 'Method not allowed' }
      },
      uptime: Date.now() - startTime
    });
  }

  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'healthy' },
      auth: { status: 'healthy' },
      storage: { status: 'healthy' }
    },
    uptime: Date.now() - startTime
  };

  // Initialize Supabase client for health checks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database.status = 'unhealthy';
    healthCheck.checks.database.error = 'Supabase configuration missing';
    healthCheck.checks.auth.status = 'unhealthy';
    healthCheck.checks.auth.error = 'Supabase configuration missing';
    healthCheck.checks.storage.status = 'unhealthy';
    healthCheck.checks.storage.error = 'Supabase configuration missing';
    
    return res.status(503).json(healthCheck);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    const dbResponseTime = Date.now() - dbStart;
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK for health check
      healthCheck.checks.database.status = 'unhealthy';
      healthCheck.checks.database.error = dbError.message;
      healthCheck.status = 'unhealthy';
    } else {
      healthCheck.checks.database.responseTime = dbResponseTime;
    }
  } catch (error) {
    healthCheck.checks.database.status = 'unhealthy';
    healthCheck.checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
    healthCheck.status = 'unhealthy';
  }

  // Check auth service
  try {
    const authStart = Date.now();
    const { error: authError } = await supabase.auth.getSession();
    const authResponseTime = Date.now() - authStart;
    
    if (authError) {
      healthCheck.checks.auth.status = 'unhealthy';
      healthCheck.checks.auth.error = authError.message;
      healthCheck.status = 'unhealthy';
    } else {
      healthCheck.checks.auth.responseTime = authResponseTime;
    }
  } catch (error) {
    healthCheck.checks.auth.status = 'unhealthy';
    healthCheck.checks.auth.error = error instanceof Error ? error.message : 'Unknown auth error';
    healthCheck.status = 'unhealthy';
  }

  // Check storage service
  try {
    const storageStart = Date.now();
    const { error: storageError } = await supabase.storage.listBuckets();
    const storageResponseTime = Date.now() - storageStart;
    
    if (storageError) {
      healthCheck.checks.storage.status = 'unhealthy';
      healthCheck.checks.storage.error = storageError.message;
      healthCheck.status = 'unhealthy';
    } else {
      healthCheck.checks.storage.responseTime = storageResponseTime;
    }
  } catch (error) {
    healthCheck.checks.storage.status = 'unhealthy';
    healthCheck.checks.storage.error = error instanceof Error ? error.message : 'Unknown storage error';
    healthCheck.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json(healthCheck);
}