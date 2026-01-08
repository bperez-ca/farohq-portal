import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * GET /api/v1/auth/me
 * Get current user information from backend
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header first, fallback to Clerk session
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Using token from Authorization header');
    } else {
      // Fallback to getting token from Clerk session
      try {
        token = await getClerkToken();
        console.log('Got token from Clerk session:', token ? 'token exists' : 'no token');
      } catch (err) {
        console.error('Failed to get Clerk token:', err);
        token = null;
      }
    }

    if (!token) {
      console.error('No token available for auth/me request');
      return NextResponse.json(
        { error: 'No authentication token available' },
        { status: 401 }
      );
    }

    console.log('Making request to backend /api/v1/auth/me with token');
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
    console.log('Successfully fetched user info');
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
