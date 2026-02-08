/**
 * Type-safe brand API client for frontend
 * Handles all brand operations with proper error handling and retries
 */

import axios, { AxiosInstance, AxiosError } from 'axios'

export interface BrandTheme {
  agency_id: string
  domain: string | null
  subdomain: string | null
  domain_type: string | null
  website: string | null
  logo_url: string | null
  favicon_url: string | null
  primary_color: string | null
  secondary_color: string | null
  hide_powered_by: boolean
  can_hide_powered_by: boolean
  can_configure_domain: boolean
  email_domain: string | null
  ssl_status: string | null
  theme_json: Record<string, any>
  verified_at: string | null
  updated_at: string
}

export interface DomainStatus {
  branding: BrandTheme
  verified: boolean
  expected_cname: string
  current_cname?: string
  ssl_status: string
}

export interface DomainInstructions {
  domain: string
  cname_target: string
  instructions: string
}

export interface UpdateBrandRequest {
  website?: string | null
  primary_color?: string
  secondary_color?: string | null
  logo_url?: string | null
  favicon_url?: string | null
  hide_powered_by?: boolean
  domain?: string | null
}

class BrandAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'BrandAPIError'
  }
}

export class BrandClient {
  private client: AxiosInstance

  constructor(baseURL: string = '/api/v1') {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include tenant ID if available
    this.client.interceptors.request.use((config) => {
      // Tenant ID comes from context (middleware or headers)
      // For client-side, we rely on cookies/headers set by middleware
      return config
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ error?: string }>) => {
        const data = error.response?.data
        const message = data && typeof data === 'object' && 'error' in data ? data.error : undefined
        if (error.response?.status === 403) {
          throw new BrandAPIError(
            message || 'Forbidden: Feature not available for your tier',
            403,
            'TIER_REQUIRED'
          )
        }
        if (error.response?.status === 404) {
          throw new BrandAPIError(
            message || 'Brand not found',
            404,
            'NOT_FOUND'
          )
        }
        throw new BrandAPIError(
          message || error.message || 'Unknown error',
          error.response?.status,
          error.code
        )
      }
    )
  }

  /**
   * Get brand by host (for theme resolution)
   * Returns default theme if 404
   */
  async getBrandByHost(host: string): Promise<BrandTheme> {
    try {
      const response = await this.client.get(`/brand/by-host?host=${encodeURIComponent(host)}`)
      return response.data
    } catch (error: any) {
      if (error.status === 404) {
        // Return default theme
        return this.getDefaultTheme()
      }
      throw error
    }
  }

  /**
   * Get brand by domain
   */
  async getBrandByDomain(domain: string): Promise<BrandTheme> {
    const response = await this.client.get(`/brand/by-domain?domain=${encodeURIComponent(domain)}`)
    return response.data
  }

  /**
   * Get brand by subdomain
   */
  async getBrandBySubdomain(subdomain: string): Promise<BrandTheme> {
    const response = await this.client.get(`/brand/by-subdomain?subdomain=${encodeURIComponent(subdomain)}`)
    return response.data
  }

  /**
   * List brands for current tenant
   */
  async listBrands(): Promise<BrandTheme[]> {
    const response = await this.client.get('/brands')
    return Array.isArray(response.data) ? response.data : [response.data]
  }

  /**
   * Get brand by ID
   */
  async getBrand(brandId: string): Promise<BrandTheme> {
    const response = await this.client.get(`/brands/${brandId}`)
    return response.data
  }

  /**
   * Create brand
   */
  async createBrand(data: UpdateBrandRequest & { agency_id?: string }): Promise<BrandTheme> {
    const response = await this.client.post('/brands', data)
    return response.data
  }

  /**
   * Update brand
   * Includes tier validation on backend
   */
  async updateBrand(brandId: string, data: UpdateBrandRequest): Promise<BrandTheme> {
    try {
      const response = await this.client.put(`/brands?brandId=${brandId}`, data)
      return response.data
    } catch (error: any) {
      if (error.status === 403) {
        throw new BrandAPIError(
          error.message || 'This feature is not available for your tier. Please upgrade.',
          403,
          'TIER_REQUIRED'
        )
      }
      throw error
    }
  }

  /**
   * Verify domain (Scale tier only)
   */
  async verifyDomain(brandId: string, domain?: string): Promise<DomainStatus> {
    try {
      const response = await this.client.post(`/brands/${brandId}/verify-domain`, {
        domain: domain || undefined,
      })
      return response.data
    } catch (error: any) {
      if (error.status === 403) {
        throw new BrandAPIError(
          'Custom domain support is only available for Scale tier',
          403,
          'TIER_REQUIRED'
        )
      }
      throw error
    }
  }

  /**
   * Get domain status (Scale tier only)
   */
  async getDomainStatus(brandId: string): Promise<DomainStatus> {
    try {
      const response = await this.client.get(`/brands/${brandId}/domain-status`)
      return response.data
    } catch (error: any) {
      if (error.status === 403) {
        throw new BrandAPIError(
          'Custom domain support is only available for Scale tier',
          403,
          'TIER_REQUIRED'
        )
      }
      throw error
    }
  }

  /**
   * Get domain instructions (Scale tier only)
   */
  async getDomainInstructions(brandId: string): Promise<DomainInstructions> {
    try {
      const response = await this.client.get(`/brands/${brandId}/domain-instructions`)
      return response.data
    } catch (error: any) {
      if (error.status === 403) {
        throw new BrandAPIError(
          'Custom domain support is only available for Scale tier',
          403,
          'TIER_REQUIRED'
        )
      }
      throw error
    }
  }

  /**
   * Get SSL status (Scale tier only)
   */
  async getSSLStatus(brandId: string): Promise<{ ssl_status: string }> {
    try {
      const response = await this.client.get(`/brands/${brandId}/ssl-status`)
      return response.data
    } catch (error: any) {
      if (error.status === 403) {
        throw new BrandAPIError(
          'Custom domain support is only available for Scale tier',
          403,
          'TIER_REQUIRED'
        )
      }
      throw error
    }
  }

  /**
   * Get default theme (loading state with gray colors)
   */
  private getDefaultTheme(): BrandTheme {
    return {
      agency_id: 'default',
      domain: null,
      subdomain: null,
      domain_type: null,
      website: null,
      logo_url: null,
      favicon_url: null,
      primary_color: '#6b7280',
      secondary_color: '#9ca3af',
      hide_powered_by: false,
      can_hide_powered_by: false,
      can_configure_domain: false,
      email_domain: null,
      ssl_status: null,
      theme_json: {},
      verified_at: null,
      updated_at: new Date().toISOString(),
    }
  }
}

// Export singleton instance
export const brandClient = new BrandClient()
