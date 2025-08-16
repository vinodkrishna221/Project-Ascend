import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production, this would fetch real events from the audit system
    // For now, return mock data
    const events = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        eventType: 'authentication_success',
        riskLevel: 'low',
        success: true,
        details: { action: 'user_login', userId: 'user123' },
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        eventType: 'authentication_failure',
        riskLevel: 'medium',
        success: false,
        details: { action: 'failed_login', attempts: 3, ip: '192.168.1.1' },
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        eventType: 'email_verification',
        riskLevel: 'low',
        success: true,
        details: { action: 'email_verified', email: 'user@college.edu' },
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        eventType: 'rate_limit_exceeded',
        riskLevel: 'high',
        success: false,
        details: { action: 'rate_limit_hit', endpoint: '/api/v1/auth/verify-email' },
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        eventType: 'college_verification',
        riskLevel: 'low',
        success: true,
        details: { action: 'college_verified', college: 'MIT' },
      },
    ];

    res.status(200).json({ events });
  } catch (error) {
    console.error('Failed to fetch security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
}