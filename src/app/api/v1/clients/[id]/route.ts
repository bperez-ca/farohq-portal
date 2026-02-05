import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/clients/{id}
 * Get a client by ID. Returns the client if the user has access via their tenant.
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

    const response = await fetch(`${API_BASE_URL}/api/v1/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to get client', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Get client API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get client', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/clients/{id}
 * Update a client.
 */
export async function PUT(
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
    const response = await fetch(`${API_BASE_URL}/api/v1/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to update client', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Update client API error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update client', details: errorMessage },
      { status: 500 }
    );
  }
}
