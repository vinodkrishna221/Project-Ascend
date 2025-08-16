/**
 * Privacy Service - GDPR Compliance and Data Privacy Management
 * 
 * This service handles all privacy-related operations including:
 * - GDPR data subject rights (access, rectification, erasure, portability)
 * - Consent management
 * - Privacy settings
 * - Data export and deletion
 * - Audit logging
 */

import { supabase } from './supabase';
import { Database } from './database.types';

// Define types for privacy features (these would be added to database schema)
type ConsentCategory = 'essential_functionality' | 'analytics_and_performance' | 'marketing_communications' | 'research_participation' | 'recruiter_visibility';

interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: 'public' | 'students_only' | 'communities_only';
  allow_messages: boolean;
  allow_collaboration_requests: boolean;
  allow_skill_endorsements: boolean;
  allow_recruiter_contact: boolean;
  analytics_participation: boolean;
  research_participation: boolean;
  feature_improvement: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_communications: boolean;
  created_at: string;
  updated_at: string;
}

interface UserConsent {
  id: string;
  user_id: string;
  consent_type: ConsentCategory;
  granted: boolean;
  granted_at: string | null;
  withdrawn_at: string | null;
  legal_basis: string;
  version: number;
  created_at: string;
}

interface DataExportRequest {
  id: string;
  user_id: string;
  request_type: 'export' | 'deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  expires_at?: string;
  error_message?: string;
  requested_at: string;
  completed_at?: string;
}

export interface ConsentRequest {
  consentType: ConsentCategory;
  granted: boolean;
  legalBasis: string;
}

export interface PrivacySettingsUpdate {
  profileVisibility?: 'public' | 'students_only' | 'communities_only';
  allowMessages?: boolean;
  allowCollaborationRequests?: boolean;
  allowSkillEndorsements?: boolean;
  allowRecruiterContact?: boolean;
  analyticsParticipation?: boolean;
  researchParticipation?: boolean;
  featureImprovement?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingCommunications?: boolean;
}

export interface DataExportOptions {
  format: 'json' | 'csv';
  includeContent?: boolean;
  includeInteractions?: boolean;
  includeAnalytics?: boolean;
}

export interface GDPRDataExport {
  profile: any;
  posts: any[];
  comments: any[];
  interactions: any[];
  projects: any[];
  consents: UserConsent[];
  privacySettings: PrivacySettings;
  auditLog: any[];
  exportMetadata: {
    exportedAt: string;
    requestedBy: string;
    dataVersion: string;
    legalBasis: string;
  };
}

class PrivacyService {
  /**
   * Get user's current privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching privacy settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Privacy settings fetch error:', error);
      return null;
    }
  }

  /**
   * Update user's privacy settings
   */
  async updatePrivacySettings(
    userId: string, 
    settings: PrivacySettingsUpdate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Log the privacy settings change
      await this.logDataAccess(
        userId,
        userId,
        'update_privacy_settings',
        'privacy_settings',
        'User updated their privacy preferences'
      );

      const { error } = await supabase
        .from('privacy_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating privacy settings:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Privacy settings update error:', error);
      return { success: false, error: 'Failed to update privacy settings' };
    }
  }

  /**
   * Get user's consent history
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user consents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('User consents fetch error:', error);
      return [];
    }
  }

  /**
   * Update user consent for a specific category
   */
  async updateConsent(
    userId: string, 
    consentRequest: ConsentRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Log the consent change
      await this.logDataAccess(
        userId,
        userId,
        consentRequest.granted ? 'grant_consent' : 'withdraw_consent',
        'user_consents',
        `User ${consentRequest.granted ? 'granted' : 'withdrew'} consent for ${consentRequest.consentType}`
      );

      const { error } = await supabase
        .from('user_consents')
        .insert({
          user_id: userId,
          consent_type: consentRequest.consentType,
          granted: consentRequest.granted,
          granted_at: consentRequest.granted ? new Date().toISOString() : null,
          withdrawn_at: !consentRequest.granted ? new Date().toISOString() : null,
          legal_basis: consentRequest.legalBasis,
          version: 1
        });

      if (error) {
        console.error('Error updating consent:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Consent update error:', error);
      return { success: false, error: 'Failed to update consent' };
    }
  }

  /**
   * Request data export (GDPR Article 15 - Right of Access)
   */
  async requestDataExport(
    userId: string, 
    options: DataExportOptions = { format: 'json' }
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      // Create export request
      const { data: exportRequest, error: requestError } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: userId,
          request_type: 'export',
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating export request:', requestError);
        return { success: false, error: requestError.message };
      }

      // Log the data export request
      await this.logDataAccess(
        userId,
        userId,
        'request_data_export',
        'data_export_requests',
        `User requested data export in ${options.format} format`
      );

      // Process the export asynchronously
      this.processDataExport(exportRequest.id, userId, options);

      return { success: true, requestId: exportRequest.id };
    } catch (error) {
      console.error('Data export request error:', error);
      return { success: false, error: 'Failed to request data export' };
    }
  }

  /**
   * Process data export request
   */
  private async processDataExport(
    requestId: string, 
    userId: string, 
    options: DataExportOptions
  ): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Collect all user data
      const exportData = await this.collectUserData(userId, options);

      // Generate export file (in a real implementation, this would be stored in cloud storage)
      const exportJson = JSON.stringify(exportData, null, 2);
      const fileName = `user_data_export_${userId}_${Date.now()}.json`;
      
      // In a real implementation, upload to secure storage and get URL
      const fileUrl = `https://secure-exports.ascend.com/${fileName}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

      // Update request with completion
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          file_url: fileUrl,
          expires_at: expiresAt.toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Log completion
      await this.logDataAccess(
        userId,
        userId,
        'complete_data_export',
        'data_export_requests',
        'Data export completed and made available for download'
      );

    } catch (error) {
      console.error('Data export processing error:', error);
      
      // Update request with error
      await supabase
        .from('data_export_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string, options: DataExportOptions): Promise<GDPRDataExport> {
    const [
      profile,
      posts,
      comments,
      interactions,
      projects,
      consents,
      privacySettings,
      auditLog
    ] = await Promise.all([
      // Profile data
      supabase.from('profiles').select('*').eq('id', userId).single(),
      
      // Posts (if requested)
      options.includeContent ? 
        supabase.from('posts').select('*').eq('user_id', userId) : 
        { data: [] },
      
      // Comments (if requested)
      options.includeContent ? 
        supabase.from('comments').select('*').eq('user_id', userId) : 
        { data: [] },
      
      // Interactions (if requested)
      options.includeInteractions ? 
        supabase.from('post_interactions').select('*').eq('user_id', userId) : 
        { data: [] },
      
      // Projects
      supabase.from('projects').select('*').eq('created_by', userId),
      
      // Consents
      supabase.from('user_consents').select('*').eq('user_id', userId),
      
      // Privacy settings
      supabase.from('privacy_settings').select('*').eq('user_id', userId).single(),
      
      // Audit log (if analytics requested)
      options.includeAnalytics ? 
        supabase.from('data_access_audit').select('*').eq('user_id', userId) : 
        { data: [] }
    ]);

    return {
      profile: profile.data,
      posts: posts.data || [],
      comments: comments.data || [],
      interactions: interactions.data || [],
      projects: projects.data || [],
      consents: consents.data || [],
      privacySettings: privacySettings.data,
      auditLog: auditLog.data || [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        requestedBy: userId,
        dataVersion: '1.0',
        legalBasis: 'GDPR Article 15 - Right of Access'
      }
    };
  }

  /**
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   */
  async requestAccountDeletion(
    userId: string, 
    reason?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      // Create deletion request
      const { data: deletionRequest, error: requestError } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: userId,
          request_type: 'deletion',
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating deletion request:', requestError);
        return { success: false, error: requestError.message };
      }

      // Log the deletion request
      await this.logDataAccess(
        userId,
        userId,
        'request_account_deletion',
        'data_export_requests',
        `User requested account deletion. Reason: ${reason || 'Not specified'}`
      );

      // Process deletion with 30-day grace period
      this.processAccountDeletion(deletionRequest.id, userId);

      return { success: true, requestId: deletionRequest.id };
    } catch (error) {
      console.error('Account deletion request error:', error);
      return { success: false, error: 'Failed to request account deletion' };
    }
  }

  /**
   * Process account deletion with grace period
   */
  private async processAccountDeletion(requestId: string, userId: string): Promise<void> {
    try {
      // Soft delete the account (mark as deleted but keep data for 30 days)
      await supabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          email: null, // Remove PII immediately
          name: 'Deleted User',
          bio: null,
          avatar_url: null
        })
        .eq('id', userId);

      // Update deletion request
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Log completion
      await this.logDataAccess(
        userId,
        userId,
        'complete_account_deletion',
        'profiles',
        'Account soft-deleted with 30-day grace period'
      );

    } catch (error) {
      console.error('Account deletion processing error:', error);
      
      await supabase
        .from('data_export_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);
    }
  }

  /**
   * Get user's data export requests
   */
  async getDataExportRequests(userId: string): Promise<DataExportRequest[]> {
    try {
      const { data, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching export requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Export requests fetch error:', error);
      return [];
    }
  }

  /**
   * Log data access for audit trail
   */
  async logDataAccess(
    userId: string,
    accessedUserId: string,
    action: string,
    dataType: string,
    purpose: string,
    legalBasis: string = 'Legitimate interest'
  ): Promise<void> {
    try {
      await supabase
        .from('data_access_audit')
        .insert({
          user_id: userId,
          accessed_user_id: accessedUserId,
          action,
          data_type: dataType,
          purpose,
          legal_basis: legalBasis
        });
    } catch (error) {
      console.error('Error logging data access:', error);
      // Don't throw error as this shouldn't break the main operation
    }
  }

  /**
   * Check if user has given consent for a specific category
   */
  async hasConsent(userId: string, consentType: ConsentCategory): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('granted')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Default to false if no consent record found
        return false;
      }

      return data.granted;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Get data retention information
   */
  async getDataRetentionInfo(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('is_active', true)
        .order('data_type');

      if (error) {
        console.error('Error fetching retention policies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Retention policies fetch error:', error);
      return [];
    }
  }
}

export const privacyService = new PrivacyService();