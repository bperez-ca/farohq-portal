import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * GET /api/v1/locations/{id}/whatsapp?tenant_id=...
 * Returns WhatsApp binding status for the location (connected, twilio_phone, connected_at).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: locationId } = await params;
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    const response = await fetch(
      `${API_BASE_URL}/api/v1/locations/${locationId}/whatsapp`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to get WhatsApp binding', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Location WhatsApp GET error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get WhatsApp binding', details: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/locations/{id}/whatsapp?tenant_id=...
 * Body: { twilio_phone: string }. Connect or update WhatsApp number for the location.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: locationId } = await params;
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    const body = await request.text();
    const response = await fetch(
      `${API_BASE_URL}/api/v1/locations/${locationId}/whatsapp`,
      { method: 'PUT', headers, body: body || undefined }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to connect WhatsApp', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('Location WhatsApp PUT error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to connect WhatsApp', details: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/locations/{id}/whatsapp?tenant_id=...
 * Disconnect WhatsApp from the location.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: locationId } = await params;
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    const response = await fetch(
      `${API_BASE_URL}/api/v1/locations/${locationId}/whatsapp`,
      { method: 'DELETE', headers }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to disconnect WhatsApp', details: errorText },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    safeLogError('Location WhatsApp DELETE error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to disconnect WhatsApp', details: message },
      { status: 500 }
    );
  }
}
