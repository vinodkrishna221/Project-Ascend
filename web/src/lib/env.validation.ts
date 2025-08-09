/**
 * Environment variables validation
 * This file validates that all required environment variables are present
 */

interface RequiredEnvVars {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
}

interface OptionalEnvVars {
  NODE_ENV?: string;
  SENDGRID_API_KEY?: string;
  FROM_EMAIL?: string;
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironmentVariables(): void {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters long for security');
  }

  // Log environment status in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
    
    const optionalMissing: string[] = [];
    if (!process.env.SENDGRID_API_KEY) optionalMissing.push('SENDGRID_API_KEY');
    if (!process.env.FROM_EMAIL) optionalMissing.push('FROM_EMAIL');
    
    if (optionalMissing.length > 0) {
      console.log(`ℹ️  Optional environment variables not set: ${optionalMissing.join(', ')}`);
      console.log('   Email functionality will use development mode');
    }
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    hasEmailService: !!(process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    jwtSecret: process.env.JWT_SECRET!
  };
}