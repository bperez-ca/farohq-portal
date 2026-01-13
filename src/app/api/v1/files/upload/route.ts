import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getClerkToken, serverApiRequest } from '@/lib/server-api-client';

/**
 * POST /api/v1/files/upload
 * Upload file directly to local public directory (for development)
 * In production, this would use GCS/S3 via presigned URLs
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

    // Get tenant ID from header or body
    const headersList = request.headers;
    const tenantIdHeader = headersList.get('x-tenant-id');
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assetType = formData.get('asset') as string; // 'logo' or 'favicon'
    const agencyId = formData.get('agency_id') as string;
    
    let tenantId = tenantIdHeader || agencyId;

    // If no tenant ID, get from user's orgs
    if (!tenantId) {
      try {
        const orgsResponse = await serverApiRequest('/api/v1/tenants/my-orgs', {
          method: 'GET',
          token: token,
        });

        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          const orgs = orgsData.orgs || [];
          if (orgs.length > 0) {
            tenantId = orgs[0].id;
          }
        }
      } catch (orgError) {
        console.warn('Could not fetch orgs for tenant context:', orgError);
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required. Provide agency_id in body or X-Tenant-ID header.' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!assetType || !['logo', 'favicon'].includes(assetType)) {
      return NextResponse.json(
        { error: 'Invalid asset type. Must be "logo" or "favicon"' },
        { status: 400 }
      );
    }

    // Create uploads directory structure: public/uploads/{tenant_id}/branding/{asset_type}/
    const uploadsDir = join(process.cwd(), 'public', 'uploads', tenantId, 'branding', assetType);
    
    // Ensure directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop() || 'png';
    const filename = `${assetType}-${timestamp}.${extension}`;
    const filePath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/${tenantId}/branding/${assetType}/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      key: `uploads/${tenantId}/branding/${assetType}/${filename}`,
      public_url: publicUrl,
    }, { status: 200 });
  } catch (error) {
    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload file', details: errorMessage },
      { status: 500 }
    );
  }
}
