import { NextRequest, NextResponse } from 'next/server';
import { getFilesApi } from '@/lib/sdk-client';

/**
 * GET /api/v1/files
 * List files using the typed SDK
 */
export async function GET(_request: NextRequest) {
  try {
    const filesApi = await getFilesApi();
    // apiV1FilesGet doesn't require parameters
    const files = await filesApi.apiV1FilesGet();
    
    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error('Files API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle SDK errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      const body = 'body' in error ? error.body : errorMessage;
      return NextResponse.json(
        { error: `Backend error: ${status}`, details: body },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch files', details: errorMessage },
      { status: 500 }
    );
  }
}

