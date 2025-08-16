// GDPR and Privacy Compliance Monitoring for Ascend Authentication System

import { createClient } from '@supabase/supabase-js';
import { auditLogger } from './audit-logger';

export interface GDPRRequest {
  id?: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: string;
  completionDate?: string;
  requestDetails?: Record<string, any>;
  responseData?: Record<string, any>;
  rejectionReason?: string;
}

export interface ConsentRecord {
  id?: string;
  userId: string;
  consentType: 'essential' | 'analytics' | 'marketing' | 'research' | 'recruitment';
  granted: boolean;
  grantedAt?: string;
  withdrawnAt?: string;
  version: string;
  legalBasis: string;
  purpose: string;
  dataCategories: string[];
  retentionPeriod: number; // in days
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  deletionMethod: 'soft' | 'hard' | 'anonymize';
  legalBasis: string;
  exceptions: string[];
}

export interface PrivacyImpactAssessment {
  id?: string;
  feature: string;
  dataTypes: string[];
  processingPurpose: string;
  legalBasis: string;
  riskLevel: 'low' | 'medium' | 'high';
  mitigationMeasures: string[];
  reviewDate: string;
  approvedBy: string;
  status: 'draft' | 'approved' | 'requires_review';
}

class ComplianceMonitor {
  private supabase;
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing for compliance monitoring');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Handle GDPR data subject requests
   */
  async handleGDPRRequest(request: Omit<GDPRRequest, 'id' | 'requestDate' | 'status'>): Promise<string> {
    const gdprRequest: GDPRRequest = {
      ...request,
      requestDate: new Date().toISOString(),
      status: 'pending',
    };

    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('gdpr_requests')
          .insert(gdprRequest)
          .select()
          .single();

        if (error) throw error;

        // Log the GDPR request
        await auditLogger.logComplianceEvent({
          userId: request.userId,
          dataType: 'personal',
          action: 'read',
          purpose: `GDPR ${request.requestType} request`,
          legalBasis: 'Legal obligation - GDPR compliance',
          details: { requestType: request.requestType },
        });

        // Process the request based on type
        await this.processGDPRRequest(data.id, request.requestType, request.userId);

        return data.id;
      }

      throw new Error('Database not available');

    } catch (error) {
      console.error('Failed to handle GDPR request:', error);
      throw error;
    }
  }

  /**
   * Process different types of GDPR requests
   */
  private async processGDPRRequest(requestId: string, requestType: GDPRRequest['requestType'], userId: string): Promise<void> {
    try {
      switch (requestType) {
        case 'access':
          await this.processDataAccessRequest(requestId, userId);
          break;
        case 'erasure':
          await this.processDataErasureRequest(requestId, userId);
          break;
        case 'portability':
          await this.processDataPortabilityRequest(requestId, userId);
          break;
        case 'rectification':
          await this.processDataRectificationRequest(requestId, userId);
          break;
        default:
          console.log(`GDPR request type ${requestType} requires manual processing`);
      }
    } catch (error) {
      console.error(`Failed to process GDPR request ${requestType}:`, error);
      
      // Update request status to failed
      if (this.supabase) {
        await this.supabase
          .from('gdpr_requests')
          .update({ 
            status: 'rejected',
            rejectionReason: error instanceof Error ? error.message : 'Processing failed',
            completionDate: new Date().toISOString()
          })
          .eq('id', requestId);
      }
    }
  }

  /**
   * Process data access request (Article 15)
   */
  private async processDataAccessRequest(requestId: string, userId: string): Promise<void> {
    if (!this.supabase) return;

    // Collect all user data
    const userData = await this.collectUserData(userId);

    // Update request with response data
    await this.supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        responseData: userData,
        completionDate: new Date().toISOString()
      })
      .eq('id', requestId);

    // Log data access
    await auditLogger.logComplianceEvent({
      userId,
      dataType: 'personal',
      action: 'export',
      purpose: 'GDPR data access request fulfillment',
      legalBasis: 'Legal obligation - GDPR Article 15',
    });
  }

  /**
   * Process data erasure request (Article 17 - Right to be forgotten)
   */
  private async processDataErasureRequest(requestId: string, userId: string): Promise<void> {
    if (!this.supabase) return;

    // Check if erasure is legally possible
    const canErase = await this.checkErasureLegality(userId);
    
    if (!canErase.allowed) {
      await this.supabase
        .from('gdpr_requests')
        .update({
          status: 'rejected',
          rejectionReason: canErase.reason,
          completionDate: new Date().toISOString()
        })
        .eq('id', requestId);
      return;
    }

    // Perform data erasure
    await this.eraseUserData(userId);

    // Update request status
    await this.supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        completionDate: new Date().toISOString()
      })
      .eq('id', requestId);

    // Log data erasure
    await auditLogger.logComplianceEvent({
      userId,
      dataType: 'personal',
      action: 'delete',
      purpose: 'GDPR data erasure request fulfillment',
      legalBasis: 'Legal obligation - GDPR Article 17',
    });
  }

  /**
   * Process data portability request (Article 20)
   */
  private async processDataPortabilityRequest(requestId: string, userId: string): Promise<void> {
    if (!this.supabase) return;

    // Collect portable user data in structured format
    const portableData = await this.collectPortableUserData(userId);

    // Update request with portable data
    await this.supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        responseData: portableData,
        completionDate: new Date().toISOString()
      })
      .eq('id', requestId);

    // Log data portability
    await auditLogger.logComplianceEvent({
      userId,
      dataType: 'personal',
      action: 'export',
      purpose: 'GDPR data portability request fulfillment',
      legalBasis: 'Legal obligation - GDPR Article 20',
    });
  }

  /**
   * Process data rectification request (Article 16)
   */
  private async processDataRectificationRequest(requestId: string, _userId: string): Promise<void> {
    // This requires manual review as it involves correcting specific data
    if (!this.supabase) return;

    await this.supabase
      .from('gdpr_requests')
      .update({
        status: 'in_progress',
        requestDetails: { note: 'Requires manual review for data correction' }
      })
      .eq('id', requestId);
  }

  /**
   * Manage user consent records
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id' | 'grantedAt' | 'withdrawnAt'>): Promise<void> {
    const consentRecord: ConsentRecord = {
      ...consent,
      grantedAt: consent.granted ? new Date().toISOString() : undefined,
      withdrawnAt: !consent.granted ? new Date().toISOString() : undefined,
    };

    try {
      if (this.supabase) {
        await this.supabase
          .from('consent_records')
          .upsert(consentRecord, { onConflict: 'userId,consentType' });
      }

      // Log consent action
      await auditLogger.logComplianceEvent({
        userId: consent.userId,
        dataType: 'personal',
        action: consent.granted ? 'create' : 'update',
        purpose: `Consent ${consent.granted ? 'granted' : 'withdrawn'} for ${consent.consentType}`,
        legalBasis: 'Consent - GDPR Article 6(1)(a)',
        consentId: `${consent.userId}-${consent.consentType}`,
      });

    } catch (error) {
      console.error('Failed to record consent:', error);
      throw error;
    }
  }

  /**
   * Check if user has given consent for specific purpose
   */
  async hasConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { data, error } = await this.supabase
        .from('consent_records')
        .select('granted, withdrawnAt')
        .eq('userId', userId)
        .eq('consentType', consentType)
        .single();

      if (error || !data) return false;

      return data.granted && !data.withdrawnAt;

    } catch (error) {
      console.error('Failed to check consent:', error);
      return false;
    }
  }

  /**
   * Collect all user data for GDPR requests
   */
  private async collectUserData(userId: string): Promise<Record<string, any>> {
    if (!this.supabase) return {};

    try {
      const userData: Record<string, any> = {};

      // Profile data
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        userData.profile = profile;
      }

      // Posts data
      const { data: posts } = await this.supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId);

      if (posts) {
        userData.posts = posts;
      }

      // Community memberships
      const { data: memberships } = await this.supabase
        .from('community_members')
        .select('*, communities(name)')
        .eq('user_id', userId);

      if (memberships) {
        userData.community_memberships = memberships;
      }

      // Consent records
      const { data: consents } = await this.supabase
        .from('consent_records')
        .select('*')
        .eq('userId', userId);

      if (consents) {
        userData.consent_records = consents;
      }

      return userData;

    } catch (error) {
      console.error('Failed to collect user data:', error);
      return {};
    }
  }

  /**
   * Collect portable user data in structured format
   */
  private async collectPortableUserData(userId: string): Promise<Record<string, any>> {
    const allData = await this.collectUserData(userId);
    
    // Return only data that the user provided (not system-generated)
    return {
      profile: {
        name: allData.profile?.name,
        bio: allData.profile?.bio,
        skills: allData.profile?.skills,
        graduation_year: allData.profile?.graduation_year,
      },
      posts: allData.posts?.map((post: any) => ({
        title: post.title,
        content: post.content,
        type: post.type,
        created_at: post.created_at,
      })),
      preferences: allData.consent_records,
    };
  }

  /**
   * Check if data erasure is legally allowed
   */
  private async checkErasureLegality(_userId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check for legal obligations that prevent erasure
    
    // Example: Check if user has ongoing legal obligations
    // This would be customized based on your specific legal requirements
    
    return { allowed: true };
  }

  /**
   * Erase user data (soft delete with anonymization)
   */
  private async eraseUserData(userId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Anonymize profile data
      await this.supabase
        .from('profiles')
        .update({
          name: 'Deleted User',
          email: null,
          bio: null,
          avatar_url: null,
          skills: [],
          deleted_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Anonymize posts (keep for community value but remove personal identifiers)
      await this.supabase
        .from('posts')
        .update({
          anonymous: true,
          user_id: null, // Remove user association
        })
        .eq('user_id', userId);

      // Remove community memberships
      await this.supabase
        .from('community_members')
        .delete()
        .eq('user_id', userId);

      // Keep audit logs for legal compliance but mark user as deleted
      await this.supabase
        .from('audit_logs')
        .update({ userId: null })
        .eq('userId', userId);

    } catch (error) {
      console.error('Failed to erase user data:', error);
      throw error;
    }
  }

  /**
   * Run automated compliance checks
   */
  async runComplianceChecks(): Promise<{
    dataRetentionViolations: any[];
    consentViolations: any[];
    accessLogAnomalies: any[];
  }> {
    const results: {
      dataRetentionViolations: any[];
      consentViolations: any[];
      accessLogAnomalies: any[];
    } = {
      dataRetentionViolations: [],
      consentViolations: [],
      accessLogAnomalies: [],
    };

    try {
      // Check data retention violations
      results.dataRetentionViolations = await this.checkDataRetentionViolations();
      
      // Check consent violations
      results.consentViolations = await this.checkConsentViolations();
      
      // Check access log anomalies
      results.accessLogAnomalies = await this.checkAccessLogAnomalies();

    } catch (error) {
      console.error('Failed to run compliance checks:', error);
    }

    return results;
  }

  /**
   * Check for data retention policy violations
   */
  private async checkDataRetentionViolations(): Promise<any[]> {
    if (!this.supabase) return [];

    try {
      // Check for profiles that should be deleted based on retention policy
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() - 7); // 7 years retention

      const { data: violations } = await this.supabase
        .from('profiles')
        .select('id, email, created_at')
        .lt('created_at', retentionDate.toISOString())
        .is('deleted_at', null);

      return violations || [];

    } catch (error) {
      console.error('Failed to check data retention violations:', error);
      return [];
    }
  }

  /**
   * Check for consent violations
   */
  private async checkConsentViolations(): Promise<any[]> {
    if (!this.supabase) return [];

    try {
      // Check for users without required consents
      const { data: usersWithoutConsent } = await this.supabase
        .from('profiles')
        .select(`
          id, 
          email,
          consent_records!inner(consentType, granted)
        `)
        .eq('consent_records.consentType', 'essential')
        .eq('consent_records.granted', false);

      return usersWithoutConsent || [];

    } catch (error) {
      console.error('Failed to check consent violations:', error);
      return [];
    }
  }

  /**
   * Check for access log anomalies
   */
  private async checkAccessLogAnomalies(): Promise<any[]> {
    if (!this.supabase) return [];

    try {
      // Check for unusual access patterns in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: anomalies } = await this.supabase
        .from('audit_logs')
        .select('userId, ipAddress, eventType, count(*)')
        .gte('timestamp', yesterday.toISOString())
        .eq('riskLevel', 'high');

      return anomalies || [];

    } catch (error) {
      console.error('Failed to check access log anomalies:', error);
      return [];
    }
  }
}

// Export singleton instance
export const complianceMonitor = new ComplianceMonitor();
export default complianceMonitor;