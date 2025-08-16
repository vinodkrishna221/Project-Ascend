import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production, this would fetch real metrics from the security system
    // For now, return mock data
    const metrics = {
      totalIncidents: 5,
      activeIncidents: 2,
      criticalIncidents: 1,
      recentAuditEvents: 15,
      gdprRequests: 3,
      complianceViolations: 0,
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Failed to fetch security metrics:', error);
    res.status(500).json({ error: 'Failed to fetch security metrics' });
  }
}