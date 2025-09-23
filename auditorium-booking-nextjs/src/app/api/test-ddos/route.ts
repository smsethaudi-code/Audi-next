import { NextRequest, NextResponse } from 'next/server'
import { withDDoSProtection } from '@/lib/ddosProtection'

/**
 * Test endpoint to demonstrate DDoS protection
 * This endpoint has strict DDoS protection enabled
 */
export async function GET(request: NextRequest) {
  return await withDDoSProtection(
    request,
    async (req) => {
      // Simple test endpoint
      return NextResponse.json({
        success: true,
        message: 'DDoS protection is working!',
        timestamp: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
    },
    {
      strictMode: true,
      customLimits: {
        requestsPerMinute: 10, // Very strict for testing
        burstLimit: 3
      }
    }
  )
}

export async function POST(request: NextRequest) {
  return await withDDoSProtection(
    request,
    async (req) => {
      const body = await req.json()
      
      return NextResponse.json({
        success: true,
        message: 'POST request with DDoS protection successful',
        receivedData: body,
        timestamp: new Date().toISOString()
      })
    },
    {
      strictMode: true,
      customLimits: {
        requestsPerMinute: 5, // Even stricter for POST requests
        burstLimit: 2
      }
    }
  )
}