import { NextRequest, NextResponse } from 'next/server';
import { getClerkToken } from '@/lib/server-api-client';

/**
 * GET /api/v1/smb/search
 * Deprecated (P2-00-4-2). Add Client uses only Autocomplete + Place Details with session token.
 * Returns 410 Gone so callers are directed to use autocomplete and place-details instead.
 */
export async function GET(_request: NextRequest) {
  const token = await getClerkToken();
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      error: 'Text Search is deprecated. Use autocomplete and place-details instead.',
      code: 'GONE',
      use: 'POST /api/v1/smb/autocomplete and GET /api/v1/smb/place-details with session_token',
    },
    { status: 410 }
  );
}
