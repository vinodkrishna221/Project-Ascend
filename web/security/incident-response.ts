// Security Incident Response System for Ascend Authentication System

import { auditLogger } from './audit-logger';
import { SecurityEventType } from './security-config';
import { complianceMonitor } from './compliance-monitor';

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum IncidentType {
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  ACCOUNT_COMPROMISE = 'account_compromise',
  MALWARE_DETECTION = 'malware_detection',
  DDOS_ATTACK = 'ddos_attack',
  INSIDER_THREAT = 'insider_threat',
  SYSTEM_COMPROMISE = 'system_compromise',
  PRIVACY_VIOLATION = 'privacy_violation'
}

export interface SecurityIncident {
  id?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  detectedAt: string;
  detectedBy: 'automated' | 'manual' | 'external';
  affectedUsers?: string[];
  affectedSystems?: string[];
  containmentActions?: string[];
  resolutionActions?: string[];
  lessonsLearned?: string[];
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  evidence?: Record<string, any>;
  communicationLog?: Array<{
    timestamp: string;
    type: 'internal' | 'external' | 'regulatory';
    message: string;
    sentBy: string;
  }>;
}

export interface IncidentResponse {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  communication: string[];
  legal: string[];
}

class IncidentResponseSystem {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const { createClient } = require('@supabase/supabase-js');
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('Supabase configuration missing for incident response');
      this.supabase = null;
    }
  }

  /**
   * Create a new security incident
   */
  async createIncident(incident: Omit<SecurityIncident, 'id' | 'detectedAt' | 'status'>): Promise<string> {
    const newIncident: SecurityIncident = {
      ...incident,
      detectedAt: new Date().toISOString(),
      status: IncidentStatus.DETECTED,
    };

    try {
      // Store incident in database
      let incidentId: string;
      
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('security_incidents')
          .insert(newIncident)
          .select()
          .single();

        if (error) throw error;
        incidentId = data.id;
      } else {
        incidentId = `incident_${Date.now()}`;
      }

      // Log the incident creation
      await auditLogger.logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        action: 'incident_created',
        resource: 'security_incident',
        success: true,
        riskLevel: this.mapSeverityToRiskLevel(incident.severity),
        details: {
          incidentId,
          incidentType: incident.type,
          severity: incident.severity,
        },
      });

      // Trigger immediate response based on severity
      await this.triggerImmediateResponse(incidentId, newIncident);

      return incidentId;

    } catch (error) {
      console.error('Failed to create security incident:', error);
      throw error;
    }
  }

  /**
   * Update incident status and actions
   */
  async updateIncident(
    incidentId: string, 
    updates: Partial<SecurityIncident>
  ): Promise<void> {
    try {
      if (this.supabase) {
        const { error } = await this.supabase
          .from('security_incidents')
          .update({
            ...updates,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', incidentId);

        if (error) throw error;
      }

      // Log the incident update
      await auditLogger.logSecurityEvent({
        eventType: SecurityEventType.ADMIN_ACTION,
        action: 'incident_updated',
        resource: 'security_incident',
        success: true,
        riskLevel: 'medium',
        details: {
          incidentId,
          updates: Object.keys(updates),
        },
      });

      // Send notifications for status changes
      if (updates.status) {
        await this.notifyStatusChange(incidentId, updates.status);
      }

    } catch (error) {
      console.error('Failed to update security incident:', error);
      throw error;
    }
  }

  /**
   * Trigger immediate response based on incident severity
   */
  private async triggerImmediateResponse(incidentId: string, incident: SecurityIncident): Promise<void> {
    const response = this.getIncidentResponse(incident.type, incident.severity);

    // Execute immediate actions
    for (const action of response.immediate) {
      await this.executeResponseAction(incidentId, action, 'immediate');
    }

    // Send notifications
    await this.sendIncidentNotifications(incident);

    // For critical incidents, trigger emergency procedures
    if (incident.severity === IncidentSeverity.CRITICAL) {
      await this.triggerEmergencyProcedures(incidentId, incident);
    }
  }

  /**
   * Get predefined incident response plan
   */
  private getIncidentResponse(type: IncidentType, severity: IncidentSeverity): IncidentResponse {
    const baseResponse: IncidentResponse = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      communication: [],
      legal: [],
    };

    switch (type) {
      case IncidentType.DATA_BREACH:
        return {
          immediate: [
            'Isolate affected systems',
            'Preserve evidence',
            'Assess scope of breach',
            'Notify incident response team',
          ],
          shortTerm: [
            'Contain the breach',
            'Assess data compromised',
            'Notify affected users',
            'Implement additional security measures',
          ],
          longTerm: [
            'Conduct forensic analysis',
            'Review and update security policies',
            'Implement preventive measures',
            'Monitor for further incidents',
          ],
          communication: [
            'Notify management within 1 hour',
            'Prepare user communication',
            'Coordinate with legal team',
          ],
          legal: [
            'Assess regulatory notification requirements',
            'Prepare GDPR breach notification (if applicable)',
            'Document all actions taken',
          ],
        };

      case IncidentType.UNAUTHORIZED_ACCESS:
        return {
          immediate: [
            'Revoke compromised credentials',
            'Lock affected accounts',
            'Review access logs',
            'Change system passwords',
          ],
          shortTerm: [
            'Investigate access patterns',
            'Assess data accessed',
            'Implement additional authentication',
            'Monitor for suspicious activity',
          ],
          longTerm: [
            'Review access control policies',
            'Implement MFA if not present',
            'Conduct security awareness training',
            'Regular access reviews',
          ],
          communication: [
            'Notify security team immediately',
            'Inform affected users',
            'Update management',
          ],
          legal: [
            'Document unauthorized access',
            'Assess legal implications',
            'Consider law enforcement involvement',
          ],
        };

      case IncidentType.ACCOUNT_COMPROMISE:
        return {
          immediate: [
            'Lock compromised accounts',
            'Reset passwords',
            'Revoke active sessions',
            'Review recent account activity',
          ],
          shortTerm: [
            'Investigate compromise method',
            'Scan for malware',
            'Notify affected users',
            'Implement account recovery process',
          ],
          longTerm: [
            'Review authentication mechanisms',
            'Implement additional security measures',
            'Monitor for reoccurrence',
            'Update security policies',
          ],
          communication: [
            'Notify affected users immediately',
            'Provide recovery instructions',
            'Update security team',
          ],
          legal: [
            'Document compromise details',
            'Assess privacy implications',
            'Consider regulatory notifications',
          ],
        };

      default:
        return baseResponse;
    }
  }

  /**
   * Execute a specific response action
   */
  private async executeResponseAction(
    incidentId: string, 
    action: string, 
    phase: 'immediate' | 'short_term' | 'long_term'
  ): Promise<void> {
    try {
      console.log(`Executing ${phase} action for incident ${incidentId}: ${action}`);

      // Log the action execution
      await auditLogger.logSecurityEvent({
        eventType: SecurityEventType.ADMIN_ACTION,
        action: 'incident_response_action',
        resource: 'security_incident',
        success: true,
        riskLevel: 'medium',
        details: {
          incidentId,
          action,
          phase,
        },
      });

      // Implement specific actions based on the action type
      switch (action) {
        case 'Lock affected accounts':
          await this.lockAffectedAccounts(incidentId);
          break;
        case 'Revoke active sessions':
          await this.revokeActiveSessions(incidentId);
          break;
        case 'Notify affected users':
          await this.notifyAffectedUsers(incidentId);
          break;
        // Add more specific action implementations as needed
      }

    } catch (error) {
      console.error(`Failed to execute response action: ${action}`, error);
      
      // Log the failure
      await auditLogger.logSecurityEvent({
        eventType: SecurityEventType.ADMIN_ACTION,
        action: 'incident_response_action_failed',
        resource: 'security_incident',
        success: false,
        riskLevel: 'high',
        details: {
          incidentId,
          action,
          phase,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Lock accounts affected by an incident
   */
  private async lockAffectedAccounts(incidentId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Get incident details to find affected users
      const { data: incident } = await this.supabase
        .from('security_incidents')
        .select('affectedUsers')
        .eq('id', incidentId)
        .single();

      if (incident?.affectedUsers) {
        // Lock the affected user accounts
        await this.supabase
          .from('profiles')
          .update({ 
            account_locked: true,
            locked_at: new Date().toISOString(),
            lock_reason: `Security incident: ${incidentId}`,
          })
          .in('id', incident.affectedUsers);

        console.log(`Locked ${incident.affectedUsers.length} affected accounts`);
      }

    } catch (error) {
      console.error('Failed to lock affected accounts:', error);
      throw error;
    }
  }

  /**
   * Revoke active sessions for affected users
   */
  private async revokeActiveSessions(incidentId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Get incident details to find affected users
      const { data: incident } = await this.supabase
        .from('security_incidents')
        .select('affectedUsers')
        .eq('id', incidentId)
        .single();

      if (incident?.affectedUsers) {
        // Revoke all active sessions for affected users
        await this.supabase
          .from('user_sessions')
          .update({ 
            is_active: false,
            revoked_at: new Date().toISOString(),
            revocation_reason: `Security incident: ${incidentId}`,
          })
          .in('user_id', incident.affectedUsers)
          .eq('is_active', true);

        console.log(`Revoked active sessions for ${incident.affectedUsers.length} affected users`);
      }

    } catch (error) {
      console.error('Failed to revoke active sessions:', error);
      throw error;
    }
  }

  /**
   * Notify affected users about the incident
   */
  private async notifyAffectedUsers(incidentId: string): Promise<void> {
    // This would integrate with your notification system
    console.log(`Would notify affected users about incident: ${incidentId}`);
    
    // Implementation would depend on your notification service
    // Could send emails, push notifications, or in-app notifications
  }

  /**
   * Send incident notifications to the response team
   */
  private async sendIncidentNotifications(incident: SecurityIncident): Promise<void> {
    try {
      const message = {
        title: `🚨 Security Incident: ${incident.title}`,
        severity: incident.severity.toUpperCase(),
        type: incident.type,
        description: incident.description,
        detectedAt: incident.detectedAt,
        affectedUsers: incident.affectedUsers?.length || 0,
        affectedSystems: incident.affectedSystems?.length || 0,
      };

      // Send to Slack/Discord webhook
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message.title,
            attachments: [{
              color: this.getSeverityColor(incident.severity),
              fields: [
                { title: 'Severity', value: message.severity, short: true },
                { title: 'Type', value: incident.type, short: true },
                { title: 'Affected Users', value: message.affectedUsers.toString(), short: true },
                { title: 'Detected At', value: message.detectedAt, short: true },
                { title: 'Description', value: message.description, short: false },
              ]
            }]
          })
        });
      }

      // Send email notifications for high/critical incidents
      if (incident.severity === IncidentSeverity.HIGH || incident.severity === IncidentSeverity.CRITICAL) {
        await this.sendEmailNotification(incident);
      }

    } catch (error) {
      console.error('Failed to send incident notifications:', error);
    }
  }

  /**
   * Trigger emergency procedures for critical incidents
   */
  private async triggerEmergencyProcedures(incidentId: string, incident: SecurityIncident): Promise<void> {
    console.log(`🚨 CRITICAL INCIDENT: ${incidentId} - Triggering emergency procedures`);

    try {
      // Immediate escalation for critical incidents
      await this.escalateToManagement(incident);
      
      // Consider system shutdown if necessary
      if (incident.type === IncidentType.SYSTEM_COMPROMISE) {
        await this.considerSystemShutdown(incidentId);
      }

      // Prepare for regulatory notifications
      if (incident.type === IncidentType.DATA_BREACH) {
        await this.prepareRegulatoryNotifications(incidentId);
      }

    } catch (error) {
      console.error('Failed to trigger emergency procedures:', error);
    }
  }

  /**
   * Escalate incident to management
   */
  private async escalateToManagement(incident: SecurityIncident): Promise<void> {
    // Send immediate notification to management
    console.log('Escalating to management:', incident.title);
    
    // This would integrate with your management notification system
    // Could include phone calls, SMS, or priority email alerts
  }

  /**
   * Consider system shutdown for severe incidents
   */
  private async considerSystemShutdown(incidentId: string): Promise<void> {
    console.log(`Considering system shutdown for incident: ${incidentId}`);
    
    // This would implement logic to determine if system shutdown is necessary
    // and execute shutdown procedures if required
  }

  /**
   * Prepare regulatory notifications for data breaches
   */
  private async prepareRegulatoryNotifications(incidentId: string): Promise<void> {
    console.log(`Preparing regulatory notifications for incident: ${incidentId}`);
    
    // This would prepare notifications for:
    // - GDPR authorities (within 72 hours)
    // - Other relevant regulatory bodies
    // - Affected data subjects
  }

  /**
   * Send email notification for incidents
   */
  private async sendEmailNotification(incident: SecurityIncident): Promise<void> {
    // Implementation would depend on your email service
    console.log('Would send email notification for incident:', incident.title);
  }

  /**
   * Notify about status changes
   */
  private async notifyStatusChange(incidentId: string, newStatus: IncidentStatus): Promise<void> {
    console.log(`Incident ${incidentId} status changed to: ${newStatus}`);
    
    // Send notification about status change
    if (process.env.SECURITY_WEBHOOK_URL) {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📊 Incident ${incidentId} status updated to: ${newStatus.toUpperCase()}`
        })
      });
    }
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: IncidentSeverity): string {
    switch (severity) {
      case IncidentSeverity.CRITICAL: return 'danger';
      case IncidentSeverity.HIGH: return 'warning';
      case IncidentSeverity.MEDIUM: return 'good';
      case IncidentSeverity.LOW: return '#36a64f';
      default: return '#36a64f';
    }
  }

  /**
   * Map severity to risk level
   */
  private mapSeverityToRiskLevel(severity: IncidentSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case IncidentSeverity.LOW: return 'low';
      case IncidentSeverity.MEDIUM: return 'medium';
      case IncidentSeverity.HIGH: return 'high';
      case IncidentSeverity.CRITICAL: return 'critical';
      default: return 'medium';
    }
  }

  /**
   * Get all incidents with filtering
   */
  async getIncidents(filters: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    type?: IncidentType;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<SecurityIncident[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('security_incidents')
        .select('*')
        .order('detectedAt', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.startDate) {
        query = query.gte('detectedAt', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('detectedAt', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Failed to get incidents:', error);
      return [];
    }
  }
}

// Export singleton instance
export const incidentResponse = new IncidentResponseSystem();
export default incidentResponse;