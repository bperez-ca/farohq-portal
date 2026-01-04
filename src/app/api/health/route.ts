import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        portal: 'healthy',
        auth: 'clerk'
      },
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        portal: 'healthy',
        auth: 'clerk'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      version: process.env.npm_package_version || '1.0.0'
    }, { status: 503 })
  }
}
