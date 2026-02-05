import { NextResponse } from 'next/server';
import { serverApiRequest, getClerkToken } from '@/lib/server-api-client';
import { safeLogError } from '@/lib/log-sanitizer';

/**
 * GET /api/v1/smb/plans
 * Returns SMB plan (layer) definitions with features for Activate client modal. Requires auth.
 */
export async function GET() {
  try {
    const token = await getClerkToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await serverApiRequest('/api/v1/smb/plans', { token });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to load plans' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    safeLogError('SMB plans API error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load plans', details: message },
      { status: 500 }
    );
  }
}
