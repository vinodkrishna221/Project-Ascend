/**
 * Data Retention API Endpoint
 * 
 * Provides information about data retention policies
 * GET: Retrieve data retention policies and user's data age
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '../../../../lib/auth.middleware';
import { privacyService } from '../../../../lib/privacy.service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { user } = req as any;

  try {
    switch (method) {
      case 'GET':
        return await handleGetDataRetention(req, res, user.id);
      
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Data retention API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

async function handleGetDataRetention(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Get retention policies
    const retentionPolicies = await privacyService.getDataRetentionInfo();
    
    // Get user's account age and data summary
    const { data: profile } = await require('../../../lib/supabase').supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    const accountAge = profile ? 
      Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Calculate data retention status
    const dataRetentionStatus = retentionPolicies.map((policy: any) => {
      const retentionDays = parseRetentionPeriod(policy.retention_period);
      const dataAge = accountAge; // Simplified - in reality, different data types have different ages
      
      return {
        dataType: policy.data_type,
        description: policy.description,
        retentionPeriod: policy.retention_period,
        retentionDays,
        legalBasis: policy.legal_basis,
        dataAge,
        willBeDeletedIn: Math.max(0, retentionDays - dataAge),
        status: dataAge >= retentionDays ? 'eligible_for_deletion' : 'retained'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        accountCreated: profile?.created_at,
        accountAgeDays: accountAge,
        retentionPolicies: dataRetentionStatus,
        summary: {
          totalDataTypes: retentionPolicies.length,
          eligibleForDeletion: dataRetentionStatus.filter((d: any) => d.status === 'eligible_for_deletion').length,
          averageRetentionDays: Math.round(
            dataRetentionStatus.reduce((sum: any, d: any) => sum + d.retentionDays, 0) / dataRetentionStatus.length
          )
        }
      }
    });
  } catch (error) {
    console.error('Get data retention error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch data retention information'
      }
    });
  }
}

function parseRetentionPeriod(interval: string): number {
  // Parse PostgreSQL interval to days
  // This is a simplified parser - in production, use a proper interval parser
  const match = interval.match(/(\d+)\s*(day|days|year|years)/i);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'day':
    case 'days':
      return value;
    case 'year':
    case 'years':
      return value * 365;
    default:
      return 0;
  }
}

export default authMiddleware(handler);