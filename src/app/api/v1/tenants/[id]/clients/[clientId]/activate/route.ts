import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken, getValidatedTenantId } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * PATCH /api/v1/tenants/{id}/clients/{clientId}/activate
 * Activates a lead client with the given plan (layer). Body: { "layer": "basic" | "growth" | "premium" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  try {
    const { id: tenantId, clientId } = await params;

    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const validatedTenantId = await getValidatedTenantId(tenantId, token, request);
    const body = await request.json().catch(() => ({})) as { layer?: string };
    const layer = body?.layer;

    if (!layer || !['basic', 'plus', 'pro', 'elite'].includes(layer)) {
      return NextResponse.json(
        { error: 'layer is required (basic, plus, pro, or elite)' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/tenants/${validatedTenantId}/clients/${clientId}/activate`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': validatedTenantId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ layer }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to activate client', details: data.details },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Activate client API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to activate client', details: message },
      { status: 500 }
    );
  }
}
