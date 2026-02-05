import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * POST /api/v1/invites/accept
 * Accept an invitation using a token
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID from auth/me endpoint
    const meResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 401 }
      );
    }

    const userData = await meResponse.json();
    const userId = userData.id || userData.user_id || userData.sub; // Clerk uses 'sub' for user ID

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    const body = await request.text();
    const inviteData = JSON.parse(body);
    
    if (!inviteData.token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Note: user_id is now optional - backend will use authenticated user from token
    const requestBody = {
      token: inviteData.token,
    };

    const acceptResponse = await fetch(`${API_BASE_URL}/api/v1/invites/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!acceptResponse.ok) {
      const errorText = await acceptResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to accept invite', details: errorText },
        { status: acceptResponse.status }
      );
    }

    const data = await acceptResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Accept invite API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to accept invite', details: errorMessage },
      { status: 500 }
    );
  }
}
