/**
 * Security Monitoring Service
 * 
 * This service handles security monitoring, threat detection, and incident response
 * including rate limiting, suspicious activity detection, and automated alerts.
 */

import { supabase } from './supabase';
import { encryptionService } from './encryption.service';

interface SecurityEvent {
  userId?: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

type SecurityEventType = 
  | 'failed_login'
  | 'multiple_failed_logins'
  | 'suspicious_location'
  | 'rate_limit_exceeded'
  | 'account_lockout'
  | 'password_reset_abuse'
  | 'verification_abuse'
  | 'data_access_anomaly'
  | 'privilege_escalation'
  | 'bulk_data_access'
  | 'unauthorized_api_access'
  | 'session_hijacking'
  | 'brute_force_attack';

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

interface SecurityAlert {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  message: string;
  details: any;
  createdAt: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

class SecurityMonitoringService {
  private rateLimitStore = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();
  
  // Rate limiting configurations
  private rateLimits: Record<string, RateLimitConfig> = {
    login: { windowMs: 15 * 60 * 1000, maxAttempts: 5, blockDurationMs: 60 * 60 * 1000 }, // 5 attempts per 15 min, block for 1 hour
    verification: { windowMs: 60 * 60 * 1000, maxAttempts: 3, blockDurationMs: 60 * 60 * 1000 }, // 3 attempts per hour, block for 1 hour
    passwordReset: { windowMs: 60 * 60 * 1000, maxAttempts: 3, blockDurationMs: 2 * 60 * 60 * 1000 }, // 3 attempts per hour, block for 2 hours
    dataExport: { windowMs: 24 * 60 * 60 * 1000, maxAttempts: 2, blockDurationMs: 24 * 60 * 60 * 1000 }, // 2 attempts per day, block for 24 hours
    apiAccess: { windowMs: 60 * 1000, maxAttempts: 100, blockDurationMs: 5 * 60 * 1000 } // 100 requests per minute, block for 5 minutes
  };

  /**
   * Check rate limit for a specific action
   */
  checkRateLimit(
    identifier: string, 
    action: string, 
    ipAddress?: string
  ): { allowed: boolean; remainingAttempts: number; resetTime: number; blockedUntil?: number } {
    const config = this.rateLimits[action];
    if (!config) {
      return { allowed: true, remainingAttempts: Infinity, resetTime: 0 };
    }

    const key = `${action}:${identifier}:${ipAddress || 'unknown'}`;
    const now = Date.now();
    const current = this.rateLimitStore.get(key);

    // Check if currently blocked
    if (current?.blockedUntil && now < current.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: current.resetTime,
        blockedUntil: current.blockedUntil
      };
    }

    // Reset window if expired
    if (!current || now > current.resetTime) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      };
    }

    // Increment count
    current.count++;
    
    // Check if limit exceeded
    if (current.count > config.maxAttempts) {
      current.blockedUntil = now + config.blockDurationMs;
      this.rateLimitStore.set(key, current);
      
      // Log security event
      this.logSecurityEvent({
        userId: identifier.startsWith('user:') ? identifier.replace('user:', '') : undefined,
        eventType: 'rate_limit_exceeded',
        severity: 'medium',
        details: {
          action,
          attempts: current.count,
          identifier,
          ipAddress
        },
        ipAddress,
        timestamp: new Date()
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: current.resetTime,
        blockedUntil: current.blockedUntil
      };
    }

    this.rateLimitStore.set(key, current);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Encrypt sensitive details
      const encryptedDetails = encryptionService.encryptPersonalData(event.details);
      
      await supabase
        .from('security_events')
        .insert({
          user_id: event.userId,
          event_type: event.eventType,
          severity: event.severity,
          details: encryptedDetails,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          created_at: event.timestamp.toISOString()
        });

      // Check if this event should trigger an alert
      await this.checkForSecurityAlerts(event);
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error as this shouldn't break the main operation
    }
  }

  /**
   * Check for patterns that should trigger security alerts
   */
  private async checkForSecurityAlerts(event: SecurityEvent): Promise<void> {
    try {
      // Check for multiple failed logins from same user
      if (event.eventType === 'failed_login' && event.userId) {
        const recentFailures = await this.getRecentSecurityEvents(
          event.userId,
          'failed_login',
          15 * 60 * 1000 // Last 15 minutes
        );

        if (recentFailures.length >= 3) {
          await this.createSecurityAlert({
            eventType: 'multiple_failed_logins',
            severity: 'high',
            userId: event.userId,
            message: `Multiple failed login attempts detected for user ${event.userId}`,
            details: {
              failureCount: recentFailures.length,
              timeWindow: '15 minutes',
              ipAddresses: Array.from(new Set(recentFailures.map(e => e.ip_address))),
              lastAttempt: event.timestamp
            }
          });
        }
      }

      // Check for suspicious location changes
      if (event.eventType === 'failed_login' && event.userId && event.ipAddress) {
        await this.checkSuspiciousLocation(event.userId, event.ipAddress);
      }

      // Check for brute force attacks from same IP
      if (['failed_login', 'verification_abuse'].includes(event.eventType) && event.ipAddress) {
        const recentAttacks = await this.getRecentSecurityEventsByIP(
          event.ipAddress,
          ['failed_login', 'verification_abuse'],
          60 * 60 * 1000 // Last hour
        );

        if (recentAttacks.length >= 10) {
          await this.createSecurityAlert({
            eventType: 'brute_force_attack',
            severity: 'critical',
            message: `Brute force attack detected from IP ${event.ipAddress}`,
            details: {
              ipAddress: event.ipAddress,
              attackCount: recentAttacks.length,
              timeWindow: '1 hour',
              targetedUsers: Array.from(new Set(recentAttacks.map(e => e.user_id).filter(Boolean)))
            }
          });
        }
      }

      // Check for privilege escalation attempts
      if (event.eventType === 'privilege_escalation') {
        await this.createSecurityAlert({
          eventType: 'privilege_escalation',
          severity: 'critical',
          userId: event.userId,
          message: `Privilege escalation attempt detected`,
          details: event.details
        });
      }

    } catch (error) {
      console.error('Failed to check for security alerts:', error);
    }
  }

  /**
   * Get recent security events for a user
   */
  private async getRecentSecurityEvents(
    userId: string,
    eventType: SecurityEventType,
    timeWindowMs: number
  ): Promise<any[]> {
    const since = new Date(Date.now() - timeWindowMs);
    
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch recent security events:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get recent security events by IP address
   */
  private async getRecentSecurityEventsByIP(
    ipAddress: string,
    eventTypes: SecurityEventType[],
    timeWindowMs: number
  ): Promise<any[]> {
    const since = new Date(Date.now() - timeWindowMs);
    
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('ip_address', ipAddress)
      .in('event_type', eventTypes)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch recent security events by IP:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check for suspicious location changes
   */
  private async checkSuspiciousLocation(userId: string, ipAddress: string): Promise<void> {
    try {
      // Get user's recent successful logins
      const recentLogins = await supabase
        .from('user_sessions')
        .select('ip_address, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentLogins.error || !recentLogins.data?.length) {
        return;
      }

      // Check if this IP is significantly different from recent IPs
      const recentIPs = recentLogins.data.map(login => login.ip_address);
      const uniqueRecentIPs = Array.from(new Set(recentIPs));

      // If this is a completely new IP and user has been active recently
      if (!uniqueRecentIPs.includes(ipAddress) && uniqueRecentIPs.length > 0) {
        await this.createSecurityAlert({
          eventType: 'suspicious_location',
          severity: 'medium',
          userId,
          message: `Login attempt from new location detected`,
          details: {
            newIP: ipAddress,
            recentIPs: uniqueRecentIPs,
            timeWindow: '7 days'
          }
        });
      }
    } catch (error) {
      console.error('Failed to check suspicious location:', error);
    }
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<void> {
    try {
      const encryptedDetails = encryptionService.encryptPersonalData(alert.details);
      
      await supabase
        .from('security_alerts')
        .insert({
          event_type: alert.eventType,
          severity: alert.severity,
          user_id: alert.userId,
          message: alert.message,
          details: encryptedDetails,
          acknowledged: false,
          created_at: new Date().toISOString()
        });

      // Send immediate notification for critical alerts
      if (alert.severity === 'critical') {
        await this.sendCriticalAlert(alert);
      }
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  /**
   * Send critical security alert notification
   */
  private async sendCriticalAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<void> {
    try {
      // In a real implementation, this would send notifications via:
      // - Email to security team
      // - Slack/Discord webhook
      // - SMS for critical incidents
      // - PagerDuty or similar incident management system
      
      console.error('CRITICAL SECURITY ALERT:', {
        type: alert.eventType,
        message: alert.message,
        userId: alert.userId,
        timestamp: new Date().toISOString()
      });

      // Log the alert notification
      await this.logSecurityEvent({
        eventType: 'unauthorized_api_access', // Using as generic alert type
        severity: 'critical',
        details: {
          alertType: alert.eventType,
          alertMessage: alert.message,
          notificationSent: true
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  /**
   * Detect data access anomalies
   */
  async detectDataAccessAnomaly(
    userId: string,
    accessedDataType: string,
    accessCount: number,
    timeWindowMs: number = 60 * 60 * 1000 // 1 hour
  ): Promise<void> {
    try {
      // Define normal access patterns
      const normalAccessLimits: Record<string, number> = {
        profiles: 50,
        posts: 100,
        comments: 200,
        projects: 30,
        communities: 20
      };

      const limit = normalAccessLimits[accessedDataType] || 10;

      if (accessCount > limit) {
        await this.logSecurityEvent({
          userId,
          eventType: 'data_access_anomaly',
          severity: accessCount > limit * 2 ? 'high' : 'medium',
          details: {
            dataType: accessedDataType,
            accessCount,
            normalLimit: limit,
            timeWindow: timeWindowMs,
            anomalyRatio: accessCount / limit
          },
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to detect data access anomaly:', error);
    }
  }

  /**
   * Monitor bulk data access
   */
  async monitorBulkDataAccess(
    userId: string,
    operation: string,
    recordCount: number,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Define bulk access thresholds
      const bulkThresholds: Record<string, number> = {
        user_export: 1, // Only 1 export per day is normal
        profile_search: 100,
        post_search: 200,
        data_download: 5
      };

      const threshold = bulkThresholds[operation] || 50;

      if (recordCount > threshold) {
        await this.logSecurityEvent({
          userId,
          eventType: 'bulk_data_access',
          severity: recordCount > threshold * 3 ? 'critical' : 'high',
          details: {
            operation,
            recordCount,
            threshold,
            excessRatio: recordCount / threshold
          },
          ipAddress,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to monitor bulk data access:', error);
    }
  }

  /**
   * Get security alerts for admin dashboard
   */
  async getSecurityAlerts(
    severity?: SecuritySeverity,
    limit: number = 50
  ): Promise<SecurityAlert[]> {
    try {
      let query = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch security alerts:', error);
        return [];
      }

      // Decrypt details for each alert
      return (data || []).map(alert => ({
        ...alert,
        details: encryptionService.decryptPersonalData(alert.details)
      }));
    } catch (error) {
      console.error('Failed to get security alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge security alert
   */
  async acknowledgeAlert(alertId: string, adminUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: adminUserId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        console.error('Failed to acknowledge alert:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      return false;
    }
  }

  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(timeWindowMs: number = 24 * 60 * 60 * 1000): Promise<any> {
    try {
      const since = new Date(Date.now() - timeWindowMs);

      const [events, alerts] = await Promise.all([
        supabase
          .from('security_events')
          .select('event_type, severity, created_at')
          .gte('created_at', since.toISOString()),
        supabase
          .from('security_alerts')
          .select('severity, acknowledged, created_at')
          .gte('created_at', since.toISOString())
      ]);

      const eventData = events.data || [];
      const alertData = alerts.data || [];

      return {
        totalEvents: eventData.length,
        eventsBySeverity: this.groupBySeverity(eventData),
        eventsByType: this.groupByType(eventData),
        totalAlerts: alertData.length,
        unacknowledgedAlerts: alertData.filter(a => !a.acknowledged).length,
        alertsBySeverity: this.groupBySeverity(alertData),
        timeWindow: timeWindowMs
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalEvents: 0,
        eventsBySeverity: {},
        eventsByType: {},
        totalAlerts: 0,
        unacknowledgedAlerts: 0,
        alertsBySeverity: {},
        timeWindow: timeWindowMs
      };
    }
  }

  private groupBySeverity(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByType(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const type = item.event_type || item.eventType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, value] of Array.from(this.rateLimitStore.entries())) {
      if (now > value.resetTime && (!value.blockedUntil || now > value.blockedUntil)) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}

export const securityMonitoringService = new SecurityMonitoringService();

// Clean up rate limit store every 5 minutes
setInterval(() => {
  securityMonitoringService.cleanupRateLimitStore();
}, 5 * 60 * 1000);