import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    })
  }

  try {
    const { provides_email, country, search } = req.query

    let query = supabase
      .from('college_domains')
      .select('*')
      .eq('is_active', true)
      .order('college_name')

    // Filter by email provision
    if (provides_email !== undefined) {
      const providesEmailBool = provides_email === 'true'
      query = query.eq('provides_email', providesEmailBool)
    }

    // Filter by country
    if (country && typeof country === 'string') {
      query = query.eq('country', country)
    }

    // Search by college name
    if (search && typeof search === 'string') {
      query = query.ilike('college_name', `%${search}%`)
    }

    const { data: colleges, error } = await query

    if (error) {
      console.error('Fetch colleges error:', error)
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch colleges'
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: colleges,
      meta: {
        count: colleges?.length || 0,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Colleges API error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    })
  }
}