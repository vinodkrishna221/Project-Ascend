/**
 * Send Verification Email API Endpoint
 * 
 * POST /api/v1/auth/send-verification
 * Sends a verification code to the user's email address
 * 
 * Requirements: 1.2, 1.3, 1.5, 1.6 - Email verification code system
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { validateRequestBody } from '../../../../lib/validation';
import { EmailVerificationCodeService, EmailSendingService } from '../../../../lib/email-verification.service';
import { DomainValidationService } from '../../../../lib/domain-validation.service';
import { verificationRateLimit } from '../../../../lib/rate-limit.middleware';
import { securityMonitoringService } from '../../../../lib/security-monitoring.service';
import { trackAuthAttempt } from '../../../../lib/metrics.middleware';

const domainValidationService = new DomainValidationService();

interface SendVerificationRequest {
  email: string;
}

const sendVerificationSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    }
  },
  required: ['email'],
  additionalProperties: false
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });
  }

  const startTime = Date.now();
  let email = '';
  let ipAddress = '';
  let userAgent = '';

  try {
    // Validate request body
    const validation = validateRequestBody(req.body, sendVerificationSchema);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.errors
        }
      });
    }

    const { email: rawEmail }: SendVerificationRequest = req.body;
    email = rawEmail;
    const normalizedEmail = email.toLowerCase().trim();
    ipAddress = getClientIP(req);
    userAgent = req.headers['user-agent'] || '';

    // Check rate limiting
    const rateLimitCheck = await EmailVerificationCodeService.canRequestNewCode(normalizedEmail);
    if (!rateLimitCheck.canRequest) {
      // Log rate limit event
      await securityMonitoringService.logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'medium',
        details: {
          action: 'send_verification',
          email: normalizedEmail,
          waitTime: rateLimitCheck.waitTime,
          ipAddress,
          userAgent
        },
        ipAddress,
        timestamp: new Date()
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.error,
          details: {
            waitTime: rateLimitCheck.waitTime,
            retryAfter: rateLimitCheck.waitTime
          }
        }
      });
    }

    // Validate email domain
    const domainValidation = await DomainValidationService.validateDomain(normalizedEmail);
    if (!domainValidation.isValid) {
      // Track failed domain validation
      await trackAuthAttempt(
        'email_verification',
        'email',
        false,
        Date.now() - startTime,
        undefined,
        domainValidation.college?.id,
        'INVALID_EMAIL_DOMAIN',
        domainValidation.reason || 'Email domain is not from a recognized college',
        ipAddress,
        userAgent
      );

      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL_DOMAIN',
          message: domainValidation.reason || 'Email domain is not from a recognized college',
          details: {
            domain: normalizedEmail.split('@')[1],
            requiresManualReview: domainValidation.requiresManualReview
          }
        }
      });
    }

    // Generate verification code
    const verificationCode = EmailVerificationCodeService.generateVerificationCode();

    // Store verification code in database
    const storeResult = await EmailVerificationCodeService.storeVerificationCode(
      normalizedEmail,
      verificationCode,
      ipAddress,
      userAgent
    );

    if (!storeResult.success) {
      console.error('Failed to store verification code:', storeResult.error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_STORE_ERROR',
          message: 'Failed to generate verification code. Please try again.'
        }
      });
    }

    // Send verification email
    const emailResult = await EmailSendingService.sendVerificationCode(
      normalizedEmail,
      verificationCode,
      domainValidation.college?.college_name || 'Unknown College'
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      
      // Track failed email sending
      await trackAuthAttempt(
        'email_verification',
        'email',
        false,
        Date.now() - startTime,
        undefined,
        domainValidation.college?.id,
        'EMAIL_SEND_FAILED',
        'Failed to send verification email',
        ipAddress,
        userAgent
      );
      
      // Log email sending failure
      await securityMonitoringService.logSecurityEvent({
        eventType: 'verification_abuse',
        severity: 'low',
        details: {
          action: 'email_send_failed',
          email: normalizedEmail,
          error: emailResult.error,
          ipAddress,
          userAgent
        },
        ipAddress,
        timestamp: new Date()
      });

      return res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send verification email. Please try again.'
        }
      });
    }

    // Track successful verification code sending
    await trackAuthAttempt(
      'email_verification',
      'email',
      true,
      Date.now() - startTime,
      undefined,
      domainValidation.college?.id,
      undefined,
      undefined,
      ipAddress,
      userAgent
    );

    // Log successful verification code generation
    await securityMonitoringService.logSecurityEvent({
      eventType: 'verification_abuse',
      severity: 'low',
      details: {
        action: 'verification_code_sent',
        email: normalizedEmail,
        messageId: emailResult.messageId,
        ipAddress,
        userAgent
      },
      ipAddress,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        email: normalizedEmail,
        expiresInMinutes: 15,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Send verification API error:', error);
    
    // Track internal server error
    await trackAuthAttempt(
      'email_verification',
      'email',
      false,
      Date.now() - startTime,
      undefined,
      undefined,
      'INTERNAL_SERVER_ERROR',
      error instanceof Error ? error.message : 'Internal server error',
      ipAddress,
      userAgent
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
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

// Apply rate limiting middleware
const rateLimitedHandler = (req: NextApiRequest, res: NextApiResponse) => {
  return verificationRateLimit(req, res, () => handler(req, res));
};

export default rateLimitedHandler;