import { supabase, supabaseAdmin } from './supabase'
import {
  CollegeDomain,
  CollegeDomainInsert,
  CollegeDomainUpdate,
  DomainValidationResult,
  DomainVerificationType
} from './auth.types'

/**
 * Email Domain Validation Service
 * Handles validation of college email domains and domain management
 */
export class DomainValidationService {
  /**
   * Validate if email domain is from an approved college
   */
  static async validateDomain(email: string): Promise<DomainValidationResult> {
    try {
      const domain = email.split('@')[1]?.toLowerCase()
      
      if (!domain) {
        return {
          isValid: false,
          requiresManualReview: false,
          reason: 'Invalid email format'
        }
      }

      const { data: collegeDomain, error } = await supabase
        .from('college_domains')
        .select('*')
        .eq('domain', domain)
        .eq('is_active', true)
        .single()

      if (error || !collegeDomain) {
        // Check if this is a known domain that's inactive
        const { data: inactiveDomain } = await supabase
          .from('college_domains')
          .select('*')
          .eq('domain', domain)
          .eq('is_active', false)
          .single()

        if (inactiveDomain) {
          return {
            isValid: false,
            requiresManualReview: false,
            reason: 'This college domain is currently inactive. Please contact support.'
          }
        }

        return {
          isValid: false,
          requiresManualReview: true,
          reason: 'Domain not found in approved college list. You can request domain addition.'
        }
      }

      // Check if domain provides email (some colleges don't provide student emails)
      if (!collegeDomain.provides_email) {
        return {
          isValid: false,
          requiresManualReview: false,
          reason: 'This college does not provide student email addresses. Please use college database verification.'
        }
      }

      return {
        isValid: true,
        college: collegeDomain,
        requiresManualReview: collegeDomain.manual_review_required
      }
    } catch (error) {
      console.error('Domain validation error:', error)
      return {
        isValid: false,
        requiresManualReview: false,
        reason: 'Domain validation service temporarily unavailable'
      }
    }
  }

  /**
   * Get all active college domains
   */
  static async getActiveCollegeDomains(): Promise<CollegeDomain[]> {
    try {
      const { data: domains, error } = await supabase
        .from('college_domains')
        .select('*')
        .eq('is_active', true)
        .order('college_name')

      if (error) {
        console.error('Get active college domains error:', error)
        return []
      }

      return domains || []
    } catch (error) {
      console.error('Get active college domains error:', error)
      return []
    }
  }

  /**
   * Get college domains that provide email addresses
   */
  static async getEmailProvidingDomains(): Promise<CollegeDomain[]> {
    try {
      const { data: domains, error } = await supabase
        .from('college_domains')
        .select('*')
        .eq('is_active', true)
        .eq('provides_email', true)
        .order('college_name')

      if (error) {
        console.error('Get email providing domains error:', error)
        return []
      }

      return domains || []
    } catch (error) {
      console.error('Get email providing domains error:', error)
      return []
    }
  }

  /**
   * Get college domains that require database verification
   */
  static async getDatabaseOnlyColleges(): Promise<CollegeDomain[]> {
    try {
      const { data: domains, error } = await supabase
        .from('college_domains')
        .select('*')
        .eq('is_active', true)
        .eq('provides_email', false)
        .order('college_name')

      if (error) {
        console.error('Get database only colleges error:', error)
        return []
      }

      return domains || []
    } catch (error) {
      console.error('Get database only colleges error:', error)
      return []
    }
  }

  /**
   * Search college domains by name or domain
   */
  static async searchCollegeDomains(query: string): Promise<CollegeDomain[]> {
    try {
      const { data: domains, error } = await supabase
        .from('college_domains')
        .select('*')
        .eq('is_active', true)
        .or(`college_name.ilike.%${query}%,domain.ilike.%${query}%`)
        .order('college_name')
        .limit(20)

      if (error) {
        console.error('Search college domains error:', error)
        return []
      }

      return domains || []
    } catch (error) {
      console.error('Search college domains error:', error)
      return []
    }
  }

  /**
   * Get college domain by ID
   */
  static async getCollegeDomainById(id: string): Promise<CollegeDomain | null> {
    try {
      const { data: domain, error } = await supabase
        .from('college_domains')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Get college domain by ID error:', error)
        return null
      }

      return domain
    } catch (error) {
      console.error('Get college domain by ID error:', error)
      return null
    }
  }

  /**
   * Add new college domain (Admin only)
   */
  static async addCollegeDomain(domainData: CollegeDomainInsert): Promise<{ success: boolean; domain?: CollegeDomain; error?: string }> {
    try {
      // Validate domain format if provided
      if (domainData.domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
        if (!domainRegex.test(domainData.domain)) {
          return {
            success: false,
            error: 'Invalid domain format'
          }
        }

        // Check if domain already exists
        const { data: existingDomain } = await supabase
          .from('college_domains')
          .select('id')
          .eq('domain', domainData.domain.toLowerCase())
          .single()

        if (existingDomain) {
          return {
            success: false,
            error: 'Domain already exists'
          }
        }
      }

      // Check if college name already exists
      const { data: existingCollege } = await supabase
        .from('college_domains')
        .select('id')
        .eq('college_name', domainData.college_name)
        .single()

      if (existingCollege) {
        return {
          success: false,
          error: 'College already exists'
        }
      }

      const { data: domain, error } = await supabaseAdmin
        .from('college_domains')
        .insert({
          ...domainData,
          domain: domainData.domain?.toLowerCase() || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Add college domain error:', error)
        return {
          success: false,
          error: 'Failed to add college domain'
        }
      }

      return {
        success: true,
        domain
      }
    } catch (error) {
      console.error('Add college domain error:', error)
      return {
        success: false,
        error: 'Failed to add college domain'
      }
    }
  }

  /**
   * Update college domain (Admin only)
   */
  static async updateCollegeDomain(id: string, updates: CollegeDomainUpdate): Promise<{ success: boolean; domain?: CollegeDomain; error?: string }> {
    try {
      // Validate domain format if being updated
      if (updates.domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
        if (!domainRegex.test(updates.domain)) {
          return {
            success: false,
            error: 'Invalid domain format'
          }
        }

        // Check if domain already exists (excluding current record)
        const { data: existingDomain } = await supabase
          .from('college_domains')
          .select('id')
          .eq('domain', updates.domain.toLowerCase())
          .neq('id', id)
          .single()

        if (existingDomain) {
          return {
            success: false,
            error: 'Domain already exists'
          }
        }
      }

      const { data: domain, error } = await supabaseAdmin
        .from('college_domains')
        .update({
          ...updates,
          domain: updates.domain?.toLowerCase() || updates.domain,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update college domain error:', error)
        return {
          success: false,
          error: 'Failed to update college domain'
        }
      }

      return {
        success: true,
        domain
      }
    } catch (error) {
      console.error('Update college domain error:', error)
      return {
        success: false,
        error: 'Failed to update college domain'
      }
    }
  }

  /**
   * Deactivate college domain (Admin only)
   */
  static async deactivateCollegeDomain(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('college_domains')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Deactivate college domain error:', error)
        return {
          success: false,
          error: 'Failed to deactivate college domain'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Deactivate college domain error:', error)
      return {
        success: false,
        error: 'Failed to deactivate college domain'
      }
    }
  }

  /**
   * Activate college domain (Admin only)
   */
  static async activateCollegeDomain(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('college_domains')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Activate college domain error:', error)
        return {
          success: false,
          error: 'Failed to activate college domain'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Activate college domain error:', error)
      return {
        success: false,
        error: 'Failed to activate college domain'
      }
    }
  }

  /**
   * Mark domain as verified (Admin only)
   */
  static async markDomainAsVerified(id: string, verifiedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('college_domains')
        .update({
          verification_type: 'automatic' as DomainVerificationType,
          manual_review_required: false,
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Mark domain as verified error:', error)
        return {
          success: false,
          error: 'Failed to mark domain as verified'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Mark domain as verified error:', error)
      return {
        success: false,
        error: 'Failed to mark domain as verified'
      }
    }
  }

  /**
   * Get domains pending manual review (Admin only)
   */
  static async getDomainsPendingReview(): Promise<CollegeDomain[]> {
    try {
      const { data: domains, error } = await supabaseAdmin
        .from('college_domains')
        .select('*')
        .eq('manual_review_required', true)
        .eq('is_active', true)
        .is('verified_at', null)
        .order('created_at')

      if (error) {
        console.error('Get domains pending review error:', error)
        return []
      }

      return domains || []
    } catch (error) {
      console.error('Get domains pending review error:', error)
      return []
    }
  }

  /**
   * Request domain addition (for users to request new domains)
   */
  static async requestDomainAddition(domainRequest: {
    domain?: string
    college_name: string
    country: string
    provides_email: boolean
    requester_email: string
    additional_info?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, we'll add it as a pending manual review domain
      const domainData: CollegeDomainInsert = {
        domain: domainRequest.domain?.toLowerCase() || null,
        college_name: domainRequest.college_name,
        country: domainRequest.country,
        provides_email: domainRequest.provides_email,
        verification_type: 'manual',
        manual_review_required: true,
        is_active: false // Start as inactive until reviewed
      }

      const result = await this.addCollegeDomain(domainData)
      
      if (!result.success) {
        return result
      }

      // TODO: Send notification to admins about new domain request
      console.log('New domain request:', {
        domain: domainRequest.domain,
        college: domainRequest.college_name,
        requester: domainRequest.requester_email,
        info: domainRequest.additional_info
      })

      return { success: true }
    } catch (error) {
      console.error('Request domain addition error:', error)
      return {
        success: false,
        error: 'Failed to submit domain request'
      }
    }
  }

  /**
   * Get domain statistics (Admin only)
   */
  static async getDomainStatistics(): Promise<{
    total: number
    active: number
    inactive: number
    email_providing: number
    database_only: number
    pending_review: number
    by_country: Record<string, number>
  }> {
    try {
      const { data: domains, error } = await supabaseAdmin
        .from('college_domains')
        .select('is_active, provides_email, manual_review_required, verified_at, country')

      if (error) {
        console.error('Get domain statistics error:', error)
        return {
          total: 0,
          active: 0,
          inactive: 0,
          email_providing: 0,
          database_only: 0,
          pending_review: 0,
          by_country: {}
        }
      }

      const stats = {
        total: domains.length,
        active: domains.filter(d => d.is_active).length,
        inactive: domains.filter(d => !d.is_active).length,
        email_providing: domains.filter(d => d.provides_email).length,
        database_only: domains.filter(d => !d.provides_email).length,
        pending_review: domains.filter(d => d.manual_review_required && !d.verified_at).length,
        by_country: domains.reduce((acc, domain) => {
          acc[domain.country] = (acc[domain.country] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      return stats
    } catch (error) {
      console.error('Get domain statistics error:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        email_providing: 0,
        database_only: 0,
        pending_review: 0,
        by_country: {}
      }
    }
  }

  /**
   * Validate international domain format
   */
  static validateInternationalDomain(domain: string): { valid: boolean; reason?: string } {
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    
    if (!domainRegex.test(domain)) {
      return {
        valid: false,
        reason: 'Invalid domain format'
      }
    }

    // Check for common educational domain patterns
    const educationalTlds = [
      '.edu', '.ac.', '.edu.', '.univ.', '.university.',
      '.college.', '.school.', '.institute.', '.tech.'
    ]

    const isEducational = educationalTlds.some(tld => 
      domain.toLowerCase().includes(tld)
    )

    if (!isEducational) {
      return {
        valid: true,
        reason: 'Domain does not appear to be educational - will require manual review'
      }
    }

    return { valid: true }
  }
}