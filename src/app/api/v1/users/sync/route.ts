import { NextRequest, NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';

/**
 * POST /api/v1/users/sync
 * Syncs user data from Clerk to the backend
 * This should be called after signup or when user data changes
 */
export async function POST(request: NextRequest) {
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
      console.error('No token available for users/sync request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from request body
    const body = await request.json();
    console.log('Received user data to sync:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.clerk_user_id) {
      console.error('Missing clerk_user_id in request body');
      return NextResponse.json(
        { error: 'clerk_user_id is required' },
        { status: 400 }
      );
    }
    
    // Forward to backend
    const response = await serverApiRequest('/api/v1/users/sync', {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to sync user:', error);
      return NextResponse.json(
        { error: 'Failed to sync user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
