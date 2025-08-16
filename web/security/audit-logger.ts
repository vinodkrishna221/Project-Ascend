// Production Audit Logging System for Ascend Authentication System

import { createClient } from '@supabase/supabase-js';
import { SecurityEventType, sensitiveDataPatterns } from './security-config';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  eventType: SecurityEventType;
  action: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceFingerprint?: string;
}

export interface ComplianceLogEntry {
  id?: string;
  timestamp: string;
  userId?: string;
  dataType: 'personal' | 'sensitive' | 'authentication' | 'communication';
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'anonymize';
  purpose: string;
  legalBasis?: string;
  retentionPeriod?: number;
  consentId?: string;
  details?: Record<string, any>;
}

class AuditLogger {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing for audit logging');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      details: this.sanitizeData(entry.details || {}),
    };

    try {
      // Log to database
      if (this.supabase) {
        await this.supabase
          .from('audit_logs')
          .insert(auditEntry);
      }

      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔒 Security Event:', JSON.stringify(auditEntry, null, 2));
      }

      // Send real-time alerts for high-risk events
      if (auditEntry.riskLevel === 'high' || auditEntry.riskLevel === 'critical') {
        await this.sendSecurityAlert(auditEntry);
      }

      // Log to external monitoring service
      await this.logToExternalService(auditEntry);

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Fallback to file logging or external service
      await this.fallbackLogging(auditEntry);
    }
  }

  /**
   * Log a compliance event for GDPR/privacy regulations
   */
  async logComplianceEvent(entry: Omit<ComplianceLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const complianceEntry: ComplianceLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      details: this.sanitizeData(entry.details || {}),
    };

    try {
      // Log to database
      if (this.supabase) {
        await this.supabase
          .from('compliance_logs')
          .insert(complianceEntry);
      }

      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📋 Compliance Event:', JSON.stringify(complianceEntry, null, 2));
      }

      // Log to external compliance monitoring
      await this.logComplianceToExternalService(complianceEntry);

    } catch (error) {
      console.error('Failed to log compliance event:', error);
      await this.fallbackLogging(complianceEntry);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    eventType: SecurityEventType,
    userId: string | null,
    success: boolean,
    details: Record<string, any> = {},
    request?: {
      ip?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    const riskLevel = this.calculateRiskLevel(eventType, success, details);

    await this.logSecurityEvent({
      userId: userId || undefined,
      sessionId: request?.sessionId,
      eventType,
      action: this.getActionFromEventType(eventType),
      resource: 'authentication',
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      success,
      details,
      riskLevel,
    });
  }

  /**
   * Log data access events for compliance
   */
  async logDataAccess(
    userId: string,
    dataType: ComplianceLogEntry['dataType'],
    action: ComplianceLogEntry['action'],
    purpose: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logComplianceEvent({
      userId,
      dataType,
      action,
      purpose,
      legalBasis: this.getLegalBasis(dataType, action),
      retentionPeriod: this.getRetentionPeriod(dataType),
      details,
    });
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    const dataString = JSON.stringify(sanitized);
    
    // Remove sensitive patterns
    let sanitizedString = dataString;
    sensitiveDataPatterns.forEach(pattern => {
      sanitizedString = sanitizedString.replace(pattern, '[REDACTED]');
    });

    try {
      return JSON.parse(sanitizedString);
    } catch {
      return { error: 'Failed to sanitize data' };
    }
  }

  /**
   * Calculate risk level based on event type and context
   */
  private calculateRiskLevel(
    eventType: SecurityEventType,
    success: boolean,
    details: Record<string, any>
  ): AuditLogEntry['riskLevel'] {
    // Critical events
    if ([
      SecurityEventType.DATA_BREACH_ATTEMPT,
      SecurityEventType.MALICIOUS_REQUEST,
      SecurityEventType.UNAUTHORIZED_ACCESS
    ].includes(eventType)) {
      return 'critical';
    }

    // High risk events
    if ([
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventType.ACCOUNT_LOCKOUT
    ].includes(eventType)) {
      return 'high';
    }

    // Medium risk events
    if ([
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.AUTHENTICATION_FAILURE
    ].includes(eventType) && !success) {
      return 'medium';
    }

    // Check for repeated failures
    if (details.attemptCount && details.attemptCount > 3) {
      return 'high';
    }

    return 'low';
  }

  /**
   * Get action description from event type
   */
  private getActionFromEventType(eventType: SecurityEventType): string {
    const actionMap: Record<SecurityEventType, string> = {
      [SecurityEventType.AUTHENTICATION_FAILURE]: 'login_attempt',
      [SecurityEventType.AUTHENTICATION_SUCCESS]: 'login_success',
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'rate_limit_hit',
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'suspicious_behavior',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 'unauthorized_access',
      [SecurityEventType.DATA_BREACH_ATTEMPT]: 'data_breach_attempt',
      [SecurityEventType.MALICIOUS_REQUEST]: 'malicious_request',
      [SecurityEventType.ACCOUNT_LOCKOUT]: 'account_locked',
      [SecurityEventType.PASSWORD_RESET]: 'password_reset',
      [SecurityEventType.EMAIL_VERIFICATION]: 'email_verification',
      [SecurityEventType.COLLEGE_VERIFICATION]: 'college_verification',
      [SecurityEventType.ADMIN_ACTION]: 'admin_action',
    };

    return actionMap[eventType] || 'unknown_action';
  }

  /**
   * Get legal basis for data processing
   */
  private getLegalBasis(dataType: ComplianceLogEntry['dataType'], action: ComplianceLogEntry['action']): string {
    if (dataType === 'authentication') {
      return 'Legitimate interest - User authentication and security';
    }
    
    if (dataType === 'personal' && action === 'create') {
      return 'Consent - User registration';
    }
    
    if (dataType === 'communication') {
      return 'Legitimate interest - Service communication';
    }
    
    return 'Legitimate interest - Service provision';
  }

  /**
   * Get data retention period in days
   */
  private getRetentionPeriod(dataType: ComplianceLogEntry['dataType']): number {
    const retentionPeriods: Record<ComplianceLogEntry['dataType'], number> = {
      personal: 2555, // 7 years
      sensitive: 1095, // 3 years
      authentication: 365, // 1 year
      communication: 730, // 2 years
    };

    return retentionPeriods[dataType] || 365;
  }

  /**
   * Send security alerts for high-risk events
   */
  private async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    try {
      // Send to Slack/Discord webhook
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Security Alert: ${entry.eventType}`,
            attachments: [{
              color: entry.riskLevel === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Event Type', value: entry.eventType, short: true },
                { title: 'Risk Level', value: entry.riskLevel.toUpperCase(), short: true },
                { title: 'User ID', value: entry.userId || 'Unknown', short: true },
                { title: 'IP Address', value: entry.ipAddress || 'Unknown', short: true },
                { title: 'Timestamp', value: entry.timestamp, short: false },
              ]
            }]
          })
        });
      }

      // Send to email if configured
      if (process.env.SECURITY_EMAIL_WEBHOOK) {
        await this.sendSecurityEmail(entry);
      }

    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Send security alert via email
   */
  private async sendSecurityEmail(entry: AuditLogEntry): Promise<void> {
    // Implementation would depend on your email service
    // This is a placeholder for email notification
    console.log('Security email alert would be sent for:', entry.eventType);
  }

  /**
   * Log to external monitoring service (e.g., Sentry, DataDog)
   */
  private async logToExternalService(entry: AuditLogEntry): Promise<void> {
    try {
      // Example: Send to Sentry
      if (process.env.SENTRY_DSN && entry.riskLevel !== 'low') {
        // Sentry integration would go here
        console.log('Would log to Sentry:', entry.eventType);
      }

      // Example: Send to DataDog
      if (process.env.DATADOG_API_KEY) {
        // DataDog integration would go here
        console.log('Would log to DataDog:', entry.eventType);
      }

    } catch (error) {
      console.error('Failed to log to external service:', error);
    }
  }

  /**
   * Log compliance events to external service
   */
  private async logComplianceToExternalService(entry: ComplianceLogEntry): Promise<void> {
    try {
      // Log to compliance monitoring service
      if (process.env.COMPLIANCE_WEBHOOK_URL) {
        await fetch(process.env.COMPLIANCE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
      }

    } catch (error) {
      console.error('Failed to log compliance event to external service:', error);
    }
  }

  /**
   * Fallback logging when primary methods fail
   */
  private async fallbackLogging(entry: AuditLogEntry | ComplianceLogEntry): Promise<void> {
    try {
      // Log to file system as last resort
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
      
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });
      
      // Append to log file
      await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
      
    } catch (error) {
      console.error('Fallback logging failed:', error);
    }
  }

  /**
   * Get audit logs for compliance reporting
   */
  async getAuditLogs(
    filters: {
      userId?: string;
      eventType?: SecurityEventType;
      startDate?: string;
      endDate?: string;
      riskLevel?: AuditLogEntry['riskLevel'];
    },
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    if (!this.supabase) {
      return [];
    }

    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (filters.userId) {
        query = query.eq('userId', filters.userId);
      }

      if (filters.eventType) {
        query = query.eq('eventType', filters.eventType);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      if (filters.riskLevel) {
        query = query.eq('riskLevel', filters.riskLevel);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
export default auditLogger;