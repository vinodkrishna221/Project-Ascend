// Production Security Middleware for Ascend Authentication System

import { NextRequest, NextResponse } from 'next/server';

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'"
  ].join('; '),
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '),
};

// Rate limiting configurations
const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.',
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many verification emails sent, please try again later.',
  },
  collegeVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many college verification attempts, please try again later.',
  },
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(request);
  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.message,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
          ...securityHeaders,
        },
      }
    );
  }

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  return response;
}

function applyRateLimit(request: NextRequest): {
  allowed: boolean;
  message?: string;
  retryAfter?: number;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const ip = getClientIP(request);
  const pathname = request.nextUrl.pathname;

  // Determine rate limit config based on path
  let config = rateLimitConfigs.api; // default
  
  if (pathname.startsWith('/api/v1/auth/')) {
    config = rateLimitConfigs.auth;
  } else if (pathname.includes('/verify-email')) {
    config = rateLimitConfigs.emailVerification;
  } else if (pathname.includes('/verify-college-credentials')) {
    config = rateLimitConfigs.collegeVerification;
  }

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupRateLimitStore();
  }

  // Check if request is allowed
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      message: config.message,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return request.ip || 'unknown';
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};