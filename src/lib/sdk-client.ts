/**
 * SDK Client Helper for FaroHQ API
 * 
 * Creates configured SDK instances with Clerk authentication for use in Next.js
 * Route Handlers and Server Components.
 */

import { auth } from '@clerk/nextjs/server';
import { Configuration, BrandApi, FilesApi, TenantsApi } from '@farohq/sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';

/**
 * Get Clerk token for SDK authentication
 */
async function getClerkToken(): Promise<string | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    return token;
  } catch (error) {
    console.error('Failed to get Clerk token:', error);
    return null;
  }
}

/**
 * Create SDK configuration with Clerk authentication
 */
async function createSDKConfiguration(): Promise<Configuration> {
  const token = await getClerkToken();
  
  return new Configuration({
    basePath: API_BASE_URL,
    accessToken: async () => token || '',
  });
}

/**
 * Get configured BrandApi instance
 */
export async function getBrandApi(): Promise<BrandApi> {
  const config = await createSDKConfiguration();
  return new BrandApi(config);
}

/**
 * Get configured FilesApi instance
 */
export async function getFilesApi(): Promise<FilesApi> {
  const config = await createSDKConfiguration();
  return new FilesApi(config);
}

/**
 * Get configured TenantsApi instance
 */
export async function getTenantsApi(): Promise<TenantsApi> {
  const config = await createSDKConfiguration();
  return new TenantsApi(config);
}

/**
 * Create SDK configuration with a specific token (for custom use cases)
 */
export function createSDKConfigWithToken(token: string | null): Configuration {
  return new Configuration({
    basePath: API_BASE_URL,
    accessToken: async () => token || '',
  });
}

