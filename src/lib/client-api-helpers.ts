/**
 * Client-side API helpers using Clerk authentication
 * For use in Client Components with useAuth hook from Clerk
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { apiGet, apiPost, apiPut, apiDelete, apiRequest } from './api-client';

/**
 * Hook to get authenticated API methods
 * Usage in Client Components:
 * 
 * const { apiGet, apiPost } = useAuthenticatedApi();
 * const data = await apiGet('/api/v1/tenants');
 */
export function useAuthenticatedApi() {
  const { getToken } = useAuth();

  const authenticatedRequest = async <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = await getToken();
    const { signal, ...rest } = options;
    return apiRequest<T>(endpoint, { ...rest, signal: signal ?? undefined, token: token || undefined });
  };

  const authenticatedGet = async <T = unknown>(endpoint: string): Promise<T> => {
    const token = await getToken();
    return apiGet<T>(endpoint, { token: token || undefined });
  };

  const authenticatedPost = async <T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<T> => {
    const token = await getToken();
    return apiPost<T>(endpoint, data, { token: token || undefined });
  };

  const authenticatedPut = async <T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<T> => {
    const token = await getToken();
    return apiPut<T>(endpoint, data, { token: token || undefined });
  };

  const authenticatedDelete = async <T = unknown>(endpoint: string): Promise<T> => {
    const token = await getToken();
    return apiDelete<T>(endpoint, { token: token || undefined });
  };

  return {
    apiRequest: authenticatedRequest,
    apiGet: authenticatedGet,
    apiPost: authenticatedPost,
    apiPut: authenticatedPut,
    apiDelete: authenticatedDelete,
  };
}





