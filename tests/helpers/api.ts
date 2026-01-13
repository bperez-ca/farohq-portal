import axios, { AxiosInstance } from 'axios';

/**
 * API helper utilities for E2E test data setup
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

export interface TenantData {
  name: string;
  slug: string;
  website?: string;
  country?: string;
  timezone?: string;
  primary_color?: string;
  logo_url?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create an API client with authentication
 */
function createApiClient(apiKey?: string): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
  });
  
  return client;
}

/**
 * Create a tenant via API (for test setup)
 * Requires authentication token
 */
export async function createTenant(
  apiKey: string,
  tenantData: TenantData
): Promise<Tenant> {
  const client = createApiClient(apiKey);
  
  try {
    const response = await client.post<Tenant>('/v1/tenants', tenantData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to create tenant: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Delete a tenant (cleanup)
 */
export async function deleteTenant(apiKey: string, tenantId: string): Promise<void> {
  const client = createApiClient(apiKey);
  
  try {
    await client.delete(`/v1/tenants/${tenantId}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to delete tenant: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Get user's org count
 */
export async function getUserOrgCount(
  userId: string,
  apiKey?: string
): Promise<number> {
  const client = createApiClient(apiKey);
  
  try {
    const response = await client.get<{ count: number }>(
      `/v1/tenants/my-orgs/count?user_id=${userId}`
    );
    return response.data.count;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to get user org count: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

/**
 * List tenants for a user
 */
export async function listUserTenants(
  userId: string,
  apiKey?: string
): Promise<Tenant[]> {
  const client = createApiClient(apiKey);
  
  try {
    const response = await client.get<{ tenants: Tenant[] }>(
      `/v1/tenants/my-orgs?user_id=${userId}`
    );
    return response.data.tenants || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to list user tenants: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Validate slug availability
 */
export async function validateSlug(
  slug: string,
  apiKey?: string
): Promise<{ available: boolean; slug: string }> {
  const client = createApiClient(apiKey);
  
  try {
    const response = await client.get<{ available: boolean; slug: string }>(
      `/v1/tenants/validate-slug?slug=${encodeURIComponent(slug)}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to validate slug: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Create tenant member (for test setup - user with orgs)
 */
export async function createTenantMember(
  apiKey: string,
  tenantId: string,
  userId: string,
  role: string = 'owner'
): Promise<void> {
  const client = createApiClient(apiKey);
  
  try {
    await client.post(`/v1/tenants/${tenantId}/members`, {
      user_id: userId,
      role,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to create tenant member: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}
