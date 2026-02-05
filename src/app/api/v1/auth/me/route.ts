import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * GET /api/v1/auth/me
 * Get current user information from backend.
 * Uses Clerk session (cookies) - client sends credentials: 'include' only.
 */
export async function GET(_request: NextRequest) {
  try {
    const token = await getClerkToken();

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token available' },
        { status: 401 }
      );
    }

    const response = await serverApiRequest('/api/v1/auth/me', {
      method: 'GET',
      token: token,
    });

    console.log('Backend response status:', response.status);

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Backend auth/me error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user info', details: errorText },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Backend returned non-JSON response:', text);
      return NextResponse.json(
        { error: 'Backend returned non-JSON response', details: text },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Auth me API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user information', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
      },
      { status: 500 }
    );
  }
}
