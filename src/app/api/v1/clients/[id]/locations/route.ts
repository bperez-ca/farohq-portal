import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/clients/{id}/locations
 * List locations for a client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/clients/${clientId}/locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to list locations', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('List locations API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to list locations', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/clients/{id}/locations
 * Create a location for a client.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.text();
    const response = await fetch(`${API_BASE_URL}/api/v1/clients/${clientId}/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to create location', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    safeLogError('Create location API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create location', details: errorMessage },
      { status: 500 }
    );
  }
}
