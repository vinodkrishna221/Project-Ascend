/**
 * Rate Limiting Middleware
 * 
 * This middleware implements rate limiting for API endpoints to prevent abuse
 * and protect against brute force attacks and spam.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { securityMonitoringService } from './security-monitoring.service';

interface RateLimitOptions {
  action: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextApiRequest) => string;
  onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
}

/**
 * Rate limiting middleware factory
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    try {
      // Generate rate limit key
      const key = options.keyGenerator ? 
        options.keyGenerator(req) : 
        generateDefaultKey(req);

      // Get client IP
      const ipAddress = getClientIP(req);

      // Check rate limit
      const rateLimitResult = securityMonitoringService.checkRateLimit(
        key,
        options.action,
        ipAddress
      );

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', getRateLimitConfig(options.action).maxAttempts);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remainingAttempts);
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

      if (rateLimitResult.blockedUntil) {
        res.setHeader('X-RateLimit-Blocked-Until', new Date(rateLimitResult.blockedUntil).toISOString());
      }

      // Check if rate limit exceeded
      if (!rateLimitResult.allowed) {
        if (options.onLimitReached) {
          options.onLimitReached(req, res);
        } else {
          return res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              details: {
                retryAfter: rateLimitResult.blockedUntil ? 
                  Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000) : 
                  Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
                resetTime: new Date(rateLimitResult.resetTime).toISOString()
              }
            }
          });
        }
        return;
      }

      // Continue to next middleware/handler
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Don't block requests if rate limiting fails
      next();
    }
  };
}

/**
 * Generate default rate limit key
 */
function generateDefaultKey(req: NextApiRequest): string {
  const user = (req as any).user;
  const ipAddress = getClientIP(req);
  
  // Use user ID if authenticated, otherwise use IP
  return user?.id ? `user:${user.id}` : `ip:${ipAddress}`;
}

/**
 * Get client IP address
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const remoteAddress = req.socket.remoteAddress;

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return remoteAddress || 'unknown';
}

/**
 * Get rate limit configuration for action
 */
function getRateLimitConfig(action: string) {
  const configs: Record<string, { maxAttempts: number; windowMs: number }> = {
    login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
    verification: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
    passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
    dataExport: { maxAttempts: 2, windowMs: 24 * 60 * 60 * 1000 },
    apiAccess: { maxAttempts: 100, windowMs: 60 * 1000 }
  };
  
  return configs[action] || { maxAttempts: 10, windowMs: 60 * 1000 };
}

/**
 * Specific rate limiters for common use cases
 */

// Login rate limiter
export const loginRateLimit = rateLimitMiddleware({
  action: 'login',
  keyGenerator: (req) => {
    const email = req.body?.email;
    const ipAddress = getClientIP(req);
    return email ? `email:${email}` : `ip:${ipAddress}`;
  },
  onLimitReached: (req, res) => {
    const ipAddress = getClientIP(req);
    
    // Log security event
    securityMonitoringService.logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'medium',
      details: {
        action: 'login',
        email: req.body?.email,
        ipAddress,
        userAgent: req.headers['user-agent']
      },
      ipAddress,
      timestamp: new Date()
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts. Please wait before trying again.',
        details: {
          lockoutDuration: '1 hour',
          securityNote: 'This is a security measure to protect your account.'
        }
      }
    });
  }
});

// Email verification rate limiter
export const verificationRateLimit = rateLimitMiddleware({
  action: 'verification',
  keyGenerator: (req) => {
    const email = req.body?.email;
    const ipAddress = getClientIP(req);
    return email ? `email:${email}` : `ip:${ipAddress}`;
  },
  onLimitReached: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
        message: 'Too many verification attempts. Please wait before requesting another code.',
        details: {
          lockoutDuration: '1 hour',
          supportNote: 'If you continue to have issues, please contact support.'
        }
      }
    });
  }
});

// Password reset rate limiter
export const passwordResetRateLimit = rateLimitMiddleware({
  action: 'passwordReset',
  keyGenerator: (req) => {
    const email = req.body?.email;
    const ipAddress = getClientIP(req);
    return email ? `email:${email}` : `ip:${ipAddress}`;
  },
  onLimitReached: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        message: 'Too many password reset requests. Please wait before trying again.',
        details: {
          lockoutDuration: '2 hours',
          securityNote: 'This helps protect your account from unauthorized access attempts.'
        }
      }
    });
  }
});

// Data export rate limiter
export const dataExportRateLimit = rateLimitMiddleware({
  action: 'dataExport',
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id ? `user:${user.id}` : `ip:${getClientIP(req)}`;
  },
  onLimitReached: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'DATA_EXPORT_RATE_LIMIT_EXCEEDED',
        message: 'You can only request data exports twice per day.',
        details: {
          lockoutDuration: '24 hours',
          note: 'This limit helps us manage system resources and protect your data.'
        }
      }
    });
  }
});

// General API rate limiter
export const apiRateLimit = rateLimitMiddleware({
  action: 'apiAccess',
  keyGenerator: (req) => {
    const user = (req as any).user;
    const ipAddress = getClientIP(req);
    return user?.id ? `user:${user.id}` : `ip:${ipAddress}`;
  },
  onLimitReached: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'Too many API requests. Please slow down.',
        details: {
          lockoutDuration: '5 minutes',
          limit: '100 requests per minute'
        }
      }
    });
  }
});

/**
 * Middleware composer to apply multiple middlewares
 */
export function composeMiddleware(...middlewares: Array<(req: NextApiRequest, res: NextApiResponse, next: () => void) => void>) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => void) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      let index = 0;

      const next = async () => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          await middleware(req, res, next);
        } else {
          await handler(req, res);
        }
      };

      await next();
    };
  };
}

/**
 * Enhanced middleware that combines authentication and rate limiting
 */
export function secureEndpoint(options: {
  requireAuth?: boolean;
  rateLimitAction?: string;
  rateLimitOptions?: Partial<RateLimitOptions>;
}) {
  const middlewares = [];

  // Add rate limiting if specified
  if (options.rateLimitAction) {
    middlewares.push(rateLimitMiddleware({
      action: options.rateLimitAction,
      ...options.rateLimitOptions
    }));
  }

  // Add authentication if required
  if (options.requireAuth) {
    const { authMiddleware } = require('./auth.middleware');
    middlewares.push(authMiddleware);
  }

  return composeMiddleware(...middlewares);
}