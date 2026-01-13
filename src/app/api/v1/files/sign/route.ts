import { NextRequest, NextResponse } from 'next/server';
import { proxyApiRequest } from '@/lib/server-api-client';

/**
 * POST /api/v1/files/sign
 * Generate presigned URL for file upload (proxies to backend)
 * Returns presigned URL for direct client uploads to GCS/S3
 */
export async function POST(request: NextRequest) {
  try {
    // Get tenant ID from headers (set by middleware)
    const response = await proxyApiRequest('/api/v1/files/sign', request);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Files sign API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: errorMessage },
      { status: 500 }
    );
  }
}
