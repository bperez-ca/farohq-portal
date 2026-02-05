'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/lib/ui'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Upload, X, Save, AlertCircle, CheckCircle2, Palette, RotateCcw, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { DomainVerification } from '@/components/branding/DomainVerification'
import { useRouter, useSearchParams } from 'next/navigation'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { suggestSecondaryColor, getContrastRating, hexToHsl, hslToHex, getTextColorForBackground, type ColorSuggestion } from '@/lib/color-utils'
import { useAuthSession } from '@/contexts/AuthSessionContext'

const brandingSchema = z.object({
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  hidePoweredBy: z.boolean().optional(),
  domain: z.string().optional(), // Optional: Custom domain (Scale tier only)
  tenantName: z.string().min(1, 'Business name is required'),
  tenantSlug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

type BrandingFormData = z.infer<typeof brandingSchema>

interface BrandData {
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
  ssl_status: string | null
  tier?: string
}

interface TenantData {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
}

export default function BrandingSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { orgs, activeOrgId } = useAuthSession()
  const isDebugMode = searchParams.get('debug') === 'useTheForceLuke'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [tenantData, setTenantData] = useState<TenantData | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isValidatingSlug, setIsValidatingSlug] = useState(false)
  const [colorSuggestions, setColorSuggestions] = useState<ColorSuggestion[]>([])
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewColors, setPreviewColors] = useState<{ primary?: string; secondary?: string } | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const slugValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      website: '',
      primaryColor: '#2563eb',
      secondaryColor: '',
      hidePoweredBy: false,
      domain: '',
      tenantName: '',
      tenantSlug: '',
    },
  })

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const website = watch('website')
  const tenantSlug = watch('tenantSlug')

  // Generate color suggestions when primary color changes
  useEffect(() => {
    if (primaryColor && /^#[0-9A-Fa-f]{6}$/i.test(primaryColor)) {
      const suggestions = suggestSecondaryColor(primaryColor, { preferHighContrast: true })
      setColorSuggestions(suggestions)
    }
  }, [primaryColor])

  // Sync preview colors with form values when preview mode is active
  useEffect(() => {
    if (previewMode) {
      setPreviewColors({
        primary: primaryColor,
        secondary: secondaryColor || undefined,
      })
    }
  }, [primaryColor, secondaryColor, previewMode])

  // Apply preview colors when in preview mode
  useEffect(() => {
    if (previewMode && previewColors) {
      const root = document.documentElement
      if (previewColors.primary) {
        root.style.setProperty('--brand-color', previewColors.primary, 'important')
        // Calculate hover color
        const hsl = hexToHsl(previewColors.primary)
        if (hsl) {
          const hoverL = Math.max(0, hsl.l - 10)
          const hoverColor = hslToHex(hsl.h, hsl.s, hoverL)
          root.style.setProperty('--brand-color-hover', hoverColor, 'important')
        }
        // Automatically set text color based on background darkness
        const textColor = getTextColorForBackground(previewColors.primary)
        root.style.setProperty('--brand-color-text', textColor, 'important')
        // Also update primary-foreground for Tailwind compatibility
        root.style.setProperty('--primary-foreground', textColor === '#ffffff' ? '210 40% 98%' : '222.2 47.4% 11.2%', 'important')
      }
      if (previewColors.secondary) {
        root.style.setProperty('--brand-secondary', previewColors.secondary, 'important')
        root.style.setProperty('--brand-secondary-color', previewColors.secondary, 'important')
        // Automatically set text color based on background darkness
        const textColor = getTextColorForBackground(previewColors.secondary)
        root.style.setProperty('--brand-secondary-text', textColor, 'important')
        // Also update Tailwind secondary
        const hsl = hexToHsl(previewColors.secondary)
        if (hsl) {
          root.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`, 'important')
          // Update secondary-foreground based on text color
          root.style.setProperty('--secondary-foreground', textColor === '#ffffff' ? '210 40% 98%' : '222.2 47.4% 11.2%', 'important')
        }
      }
    } else if (!previewMode) {
      // Restore original theme when preview is disabled
      if (brandData) {
        const root = document.documentElement
        if (brandData.primary_color) {
          root.style.setProperty('--brand-color', brandData.primary_color, 'important')
          const textColor = getTextColorForBackground(brandData.primary_color)
          root.style.setProperty('--brand-color-text', textColor, 'important')
        }
        if (brandData.secondary_color) {
          root.style.setProperty('--brand-secondary', brandData.secondary_color, 'important')
          root.style.setProperty('--brand-secondary-color', brandData.secondary_color, 'important')
          const textColor = getTextColorForBackground(brandData.secondary_color)
          root.style.setProperty('--brand-secondary-text', textColor, 'important')
        }
      }
    }
  }, [previewMode, previewColors, brandData])


  // Mark form as dirty when files are uploaded or removed
  // This ensures the Save button is enabled when users upload logo/favicon
  useEffect(() => {
    if (logoFile !== null || faviconFile !== null) {
      // A file has been selected - mark form as dirty
      // We use a harmless field update to trigger the dirty state
      const currentWebsite = watch('website') || ''
      setValue('website', currentWebsite, { shouldDirty: true })
    }
  }, [logoFile, faviconFile, setValue, watch])

  // Debug: Log button disabled reasons (only in debug mode)
  useEffect(() => {
    if (!isDebugMode) return

    const disabledReasons = []
    if (saving) disabledReasons.push('Currently saving')
    if (isUploading) disabledReasons.push('Currently uploading files')
    if (!isDirty) disabledReasons.push('No changes detected (form is clean)')
    if (isValidatingSlug) disabledReasons.push('Slug validation in progress')
    if (slugError) disabledReasons.push(`Slug error: ${slugError}`)
    
    if (disabledReasons.length > 0) {
      console.log('[Save Button] Disabled reasons:', disabledReasons)
      console.log('[Save Button] State:', {
        saving,
        isUploading,
        isDirty,
        isValidatingSlug,
        slugError,
        hasErrors: Object.keys(errors).length > 0,
        hasLogoFile: !!logoFile,
        hasFaviconFile: !!faviconFile,
      })
    }
  }, [isDebugMode, saving, isUploading, isDirty, isValidatingSlug, slugError, errors, logoFile, faviconFile])

  // Validate slug when it changes
  useEffect(() => {
    if (slugValidationTimeoutRef.current) {
      clearTimeout(slugValidationTimeoutRef.current)
    }

    // Don't validate if slug is empty or hasn't changed from original
    if (!tenantSlug || (tenantData && tenantSlug === tenantData.slug)) {
      setSlugError(null)
      return
    }

    // Debounce validation
    slugValidationTimeoutRef.current = setTimeout(async () => {
      setIsValidatingSlug(true)
      setSlugError(null)

      try {
        const response = await axios.get(`/api/v1/tenants/validate-slug?slug=${encodeURIComponent(tenantSlug)}`, {
          withCredentials: true,
        })

        if (response.data) {
          if (!response.data.available) {
            setSlugError('This slug is already taken. Please choose another.')
          } else if (response.data.error) {
            setSlugError(response.data.error)
          }
        }
      } catch (error) {
        console.error('Failed to validate slug:', error)
        // Don't show error on validation failure, let backend handle it
      } finally {
        setIsValidatingSlug(false)
      }
    }, 500)

    return () => {
      if (slugValidationTimeoutRef.current) {
        clearTimeout(slugValidationTimeoutRef.current)
      }
    }
  }, [tenantSlug, tenantData])

  // Load brand data (re-run when orgs load for no-brand fallback)
  useEffect(() => {
    loadBrandData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs.length])

  const loadBrandData = async () => {
    try {
      setLoading(true)
      // Get brand ID from context (tenant ID = agency ID = brand ID)
      const brandResponse = await axios.get('/api/v1/brands', {
        withCredentials: true,
      })

      if (brandResponse.data && brandResponse.data.length > 0) {
        const brand = brandResponse.data[0]
        setBrandData(brand)
        setValue('website', brand.website || '')
        setValue('primaryColor', brand.primary_color || '#2563eb')
        setValue('secondaryColor', brand.secondary_color || '')
        setValue('hidePoweredBy', brand.hide_powered_by || false)
        setValue('domain', brand.domain || '')
        setLogoPreview(brand.logo_url || null)
        setFaviconPreview(brand.favicon_url || null)

        // Use tenant information from brands response (same pattern as brands endpoint)
        // The brands endpoint already includes tenant data in the response
        if (brand.tenant) {
          setTenantData({
            id: brand.tenant.id,
            name: brand.tenant.name,
            slug: brand.tenant.slug,
            status: brand.tenant.status || 'active',
            created_at: brand.created_at || new Date().toISOString(),
          })
          setValue('tenantName', brand.tenant.name || '')
          setValue('tenantSlug', brand.tenant.slug || '')
        } else if (brand.agency_id) {
          // Fallback: if tenant data not in brands response, try separate call
          try {
            const tenantResponse = await axios.get(`/api/v1/tenants/${brand.agency_id}`, {
              withCredentials: true,
            })
            if (tenantResponse.data) {
              const tenant = tenantResponse.data
              setTenantData(tenant)
              setValue('tenantName', tenant.name || '')
              setValue('tenantSlug', tenant.slug || '')
            }
          } catch (tenantError) {
            console.error('Failed to load tenant data:', tenantError)
            // Don't fail the whole page if tenant data fails to load
          }
        }
      } else {
        // No brand exists yet - use orgs from session context
        if (orgs.length > 0) {
          const activeOrg = orgs.find((o) => o.id === activeOrgId) || orgs[0]
            
            // Use org data directly (my-orgs already returns name, slug, etc.)
            // Try to get more detailed tenant info, but fallback to org data if it fails
            if (activeOrg.name && activeOrg.slug) {
              setTenantData({
                id: activeOrg.id,
                name: activeOrg.name,
                slug: activeOrg.slug,
                status: activeOrg.status || 'active',
                created_at: activeOrg.created_at || new Date().toISOString(),
              })
              setValue('tenantName', activeOrg.name)
              setValue('tenantSlug', activeOrg.slug)
            }
            
            // Try to get more detailed tenant info (optional - we already have the basics)
            try {
              const tenantResponse = await axios.get(`/api/v1/tenants/${activeOrg.id}`, {
                withCredentials: true,
              })
              
              if (tenantResponse.data) {
                const tenant = tenantResponse.data
                setTenantData(tenant)
                setValue('tenantName', tenant.name || activeOrg.name || '')
                setValue('tenantSlug', tenant.slug || activeOrg.slug || '')
              }
            } catch (tenantError: any) {
              // Silently fail - we already have org data
              console.warn('Could not fetch detailed tenant data, using org data:', tenantError?.response?.status)
            }
            
            // Create a minimal brand data structure for the form
            setBrandData({
              agency_id: activeOrg.id,
              domain: null,
              subdomain: null,
              domain_type: null,
              website: null,
              logo_url: null,
              favicon_url: null,
              primary_color: '#2563eb',
              secondary_color: null,
              hide_powered_by: false,
              can_hide_powered_by: false,
              can_configure_domain: false,
              ssl_status: null,
            })
        } else {
          setError('No organizations found. Please ensure you are part of an organization.')
        }
      }
    } catch (error: any) {
      console.error('Failed to load brand data:', error)
      
      // Handle 403 error specifically
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.error || error.response?.data || error.response?.data?.message
        if (typeof errorMessage === 'string' && errorMessage.includes("don't have access")) {
          setError('You don\'t have access to any organizations. Please contact support.')
        } else {
          setError(errorMessage || 'Access denied. Please ensure you are part of an organization.')
        }
      } else {
        setError('Failed to load branding settings. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File, assetType: 'logo' | 'favicon'): Promise<string | undefined> => {
    if (!brandData) return undefined

    try {
      setIsUploading(true)
      
      // Get sign response to determine if we should use local upload or GCS
      const signResponse = await axios.post('/api/v1/files/sign', {
        agency_id: brandData.agency_id,
        asset: assetType,
      }, {
        withCredentials: true,
        headers: {
          'X-Tenant-ID': brandData.agency_id, // Ensure tenant context
        },
      })

      // Check if we should use local upload (development mode)
      if (signResponse.data.use_local_upload) {
        // Use local upload endpoint
        const formData = new FormData()
        formData.append('file', file)
        formData.append('asset', assetType)
        formData.append('agency_id', brandData.agency_id)

        const uploadResponse = await axios.post('/api/v1/files/upload', formData, {
          withCredentials: true,
          headers: {
            'X-Tenant-ID': brandData.agency_id,
            'Content-Type': 'multipart/form-data',
          },
        })

        // Return the public URL (relative path for local, full URL for production)
        const publicUrl = uploadResponse.data.public_url || uploadResponse.data.url
        return publicUrl.startsWith('http') ? publicUrl : `${window.location.origin}${publicUrl}`
      }

      // Production: Use GCS/S3 presigned URL
      const { url: presignedUrl, key, headers: presignedHeaders } = signResponse.data

      if (!presignedUrl) {
        throw new Error('No presigned URL returned from server')
      }

      // Upload file directly to GCS/S3
      await axios.put(presignedUrl, file, {
        headers: {
          ...presignedHeaders,
          'Content-Type': file.type,
        },
      })

      // Construct public URL from key
      // For GCS: https://storage.googleapis.com/{bucket}/{key}
      // For Cloudflare CDN: https://cdn.yourdomain.com/{key}
      const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME || 'farohq-files'
      const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN
      
      if (cdnDomain) {
        // Use Cloudflare CDN if configured
        return `https://${cdnDomain}/${key}`
      } else {
        // Use GCS direct URL
        return `https://storage.googleapis.com/${bucket}/${key}`
      }
    } catch (error) {
      console.error(`Failed to upload ${assetType}:`, error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (formData: BrandingFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      if (!brandData) {
        setError('Brand data not loaded')
        return
      }

      // Upload logo if changed
      let logoUrl: string | undefined = brandData.logo_url || undefined
      if (logoFile) {
        try {
          logoUrl = await uploadFile(logoFile, 'logo')
        } catch (error) {
          console.error('Failed to upload logo:', error)
          setError('Failed to upload logo. Please try again.')
          return
        }
      }

      // Upload favicon if changed
      let faviconUrl: string | undefined = brandData.favicon_url || undefined
      if (faviconFile) {
        try {
          faviconUrl = await uploadFile(faviconFile, 'favicon')
        } catch (error) {
          console.error('Failed to upload favicon:', error)
          setError('Failed to upload favicon. Please try again.')
          return
        }
      }

      // Update brand
      const updatePayload: any = {
        website: formData.website || null,
        primary_color: formData.primaryColor,
        secondary_color: formData.secondaryColor || null,
      }
      
      // Only include hide_powered_by if user has permission to change it
      // This prevents 403 errors when the checkbox is disabled
      if (brandData.can_hide_powered_by) {
        updatePayload.hide_powered_by = formData.hidePoweredBy || false
      }
      // If user doesn't have permission, don't include this field in the payload
      // The backend will keep the existing value

      // Only include logo/favicon if uploaded
      if (logoUrl) {
        updatePayload.logo_url = logoUrl
      }
      if (faviconUrl) {
        updatePayload.favicon_url = faviconUrl
      }

      // Domain configuration (Scale tier only, validated on backend)
      // Only include domain if it's a non-empty string, otherwise don't include it at all
      // For updates, we need to handle clearing the domain explicitly, but for creates, 
      // we should omit it entirely to let the backend generate subdomains
      if (formData.domain !== undefined && formData.domain !== null && formData.domain.trim() !== '') {
        updatePayload.domain = formData.domain.trim()
      }
      // If domain is empty, don't include it in the payload - backend will handle subdomain generation

      // Update or create brand
      let brandResponse
      try {
        // Try to update first (only if brand exists - check if agency_id exists)
        if (brandData.agency_id) {
          try {
            brandResponse = await axios.put(`/api/v1/brands?brandId=${brandData.agency_id}`, updatePayload, {
              withCredentials: true,
              headers: {
                'X-Tenant-ID': brandData.agency_id, // Ensure tenant context
              },
            })

            // Handle tier-related errors (403 Forbidden)
            if (brandResponse.status === 403) {
              const errorData = brandResponse.data
              setError(errorData.error || 'This feature is not available for your tier. Please upgrade.')
              return
            }

            setBrandData(brandResponse.data)
            // Success - skip to tenant update
          } catch (updateError: any) {
            // If 404, brand doesn't exist - will create below
            if (updateError.response?.status === 404) {
              // Brand doesn't exist - will create in next step
              brandResponse = null
            } else {
              // Other error - re-throw to be handled
              throw updateError
            }
          }
        }
        
        // If update failed (404) or no brand exists, create new brand
        if (!brandResponse) {
          try {
            // Create brand with payload - explicitly exclude domain to avoid unique constraint violations
            // Backend will automatically generate subdomain based on tenant tier
            // NOTE: The backend has a bug where it sets domain="" for lower tiers, which violates
            // the unique constraint if multiple brands exist. The backend should use NULL instead.
            // This is a backend issue that needs to be fixed.
            const createPayload: any = {
              primary_color: updatePayload.primary_color,
              secondary_color: updatePayload.secondary_color || null,
              theme_json: {}, // Backend expects theme_json, provide empty object if not specified
            }
            
            // Only include website if it's provided (can be null/empty)
            if (updatePayload.website) {
              createPayload.website = updatePayload.website
            }
            
            // Only include logo/favicon if they exist in updatePayload
            if (updatePayload.logo_url) {
              createPayload.logo_url = updatePayload.logo_url
            }
            if (updatePayload.favicon_url) {
              createPayload.favicon_url = updatePayload.favicon_url
            }
            
            // Only include hide_powered_by if it exists and user has permission
            if (updatePayload.hide_powered_by !== undefined && brandData.can_hide_powered_by) {
              createPayload.hide_powered_by = updatePayload.hide_powered_by
            }
            
            // CRITICAL: Do NOT include domain field - backend will set it to "" for lower tiers
            // which violates unique constraint. This needs to be fixed in the backend to use NULL.
            
            brandResponse = await axios.post('/api/v1/brands', createPayload, {
              withCredentials: true,
              headers: {
                'X-Tenant-ID': brandData.agency_id, // Ensure tenant context
              },
            })

            if (brandResponse.status === 201 || brandResponse.status === 200) {
              setBrandData(brandResponse.data)
            } else {
              throw new Error('Failed to create brand')
            }
          } catch (createError: any) {
            console.error('Failed to create brand:', createError)
            let createErrorMessage = createError.response?.data?.error || 
                                     createError.response?.data?.message ||
                                     createError.message ||
                                     'Failed to create brand. Please try again.'
            
            // Handle database constraint violations
            if (createError.response?.status === 500) {
              const errorText = createError.response?.data || ''
              const errorString = typeof errorText === 'string' ? errorText : JSON.stringify(errorText)
              
              if (errorString.includes('branding_domain_key')) {
                // This is a backend issue: backend sets domain="" for lower tiers, which violates unique constraint
                // when multiple brands exist. The backend should use NULL instead of empty string.
                createErrorMessage = 'Failed to create brand due to a domain conflict. This may occur when multiple brands have empty domains. Please refresh the page and try again, or contact support if the issue persists.'
              } else if (errorString.includes('duplicate key')) {
                createErrorMessage = 'This brand already exists. Please refresh the page and try again.'
              } else {
                createErrorMessage = 'Failed to create brand. The domain may already be in use, or there may be a system error. Please try again or contact support.'
              }
            } else if (createError.response?.status === 403) {
              createErrorMessage = 'You do not have permission to create this brand, or this feature requires a higher tier.'
            }
            
            setError(createErrorMessage)
            return
          }
        }
      } catch (updateError: any) {
        // Handle errors from the update attempt (if not 404)
        if (updateError.response?.status === 403) {
          // Handle 403 Forbidden (tier restrictions or permission issues)
          const errorData = updateError.response?.data
          const errorMessage = errorData?.error || 
                             errorData?.message ||
                             'You do not have permission to update this brand, or this feature requires a higher tier.'
          setError(errorMessage)
          return
        } else {
          // Re-throw other errors to be handled by outer catch
          throw updateError
        }
      }

      // Update tenant information if changed
      if (tenantData && (formData.tenantName !== tenantData.name || formData.tenantSlug !== tenantData.slug)) {
        try {
          const tenantUpdatePayload: any = {}
          if (formData.tenantName !== tenantData.name) {
            tenantUpdatePayload.name = formData.tenantName
          }
          if (formData.tenantSlug !== tenantData.slug) {
            tenantUpdatePayload.slug = formData.tenantSlug
          }

          const tenantUpdateResponse = await axios.put(`/api/v1/tenants/${tenantData.id}`, tenantUpdatePayload, {
            withCredentials: true,
          })

          if (tenantUpdateResponse.data) {
            setTenantData(tenantUpdateResponse.data)
          }
        } catch (tenantError: any) {
          console.error('Failed to update tenant:', tenantError)
          const tenantErrorMessage = tenantError.response?.data?.error || 
                                    tenantError.response?.data?.message ||
                                    'Failed to update tenant information'
          setError(tenantErrorMessage)
          return
        }
      }

      setSuccess(true)
      
      // Reload brand data to get updated fields
      await loadBrandData()
      
      // Force theme refresh by clearing cache
      // This ensures the sidebar and other components pick up the new branding
      if (typeof window !== 'undefined') {
        // Signal to BrandThemeProvider to clear cache and refetch
        sessionStorage.setItem('farohq_clear_brand_cache', 'true')
        // Trigger a custom event to notify BrandThemeProvider
        window.dispatchEvent(new CustomEvent('brandThemeUpdated'))
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Failed to update brand:', error)
      
      // Handle different error response formats
      let errorMessage = 'Failed to update branding settings. Please try again.'
      
      if (error.response) {
        // Try to parse error response
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            // Plain text error response
            errorMessage = error.response.data
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message
          } else if (error.response.data.details) {
            errorMessage = error.response.data.details
          }
        }
        
        // Handle tier-related errors
        if (error.response.status === 403) {
          errorMessage = errorMessage || 'This feature is not available for your tier. Please upgrade.'
        } else if (error.response.status === 400) {
          errorMessage = errorMessage || 'Invalid request. Please check your input.'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading branding settings...</div>
      </div>
    )
  }

  if (!brandData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Failed to load branding settings</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-4">
          Manage your organization settings and team members.
        </p>
      </div>

      <SettingsNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-600 dark:text-green-400">Branding settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
            <CardDescription>Update your agency name and slug</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tenant-name">Business Name</Label>
              <Input
                id="tenant-name"
                placeholder="Your Agency Name"
                {...register('tenantName')}
                className={errors.tenantName ? 'border-red-500' : ''}
              />
              {errors.tenantName && (
                <p className="text-sm text-red-500 mt-1">{errors.tenantName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tenant-slug">Slug</Label>
              <div className="relative">
                <Input
                  id="tenant-slug"
                  placeholder="your-agency-slug"
                  {...register('tenantSlug')}
                  className={errors.tenantSlug || slugError ? 'border-red-500' : ''}
                />
                {isValidatingSlug && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Checking...
                  </span>
                )}
              </div>
              {errors.tenantSlug && (
                <p className="text-sm text-red-500 mt-1">{errors.tenantSlug.message}</p>
              )}
              {slugError && !errors.tenantSlug && (
                <p className="text-sm text-red-500 mt-1">{slugError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Used in your portal URL. Only lowercase letters, numbers, and hyphens allowed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Assets</CardTitle>
            <CardDescription>Upload your logo and favicon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
              {logoPreview ? (
                <div className="relative mt-2 inline-block">
                  <div className="border-2 rounded-lg p-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview(brandData.logo_url || null)
                      if (logoInputRef.current) {
                        logoInputRef.current.value = ''
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors mt-2"
                >
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  Click to upload logo
                  <br />
                  <span className="text-xs">PNG, SVG, JPG up to 2MB (64x64 to 2048x2048px)</span>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLogoFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setLogoPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="hidden"
              />
              </div>

              {/* Favicon Upload */}
              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon (Optional)</Label>
              {faviconPreview ? (
                <div className="relative mt-2 inline-block">
                  <div className="border-2 rounded-lg p-2 w-16 h-16">
                    <img
                      src={faviconPreview}
                      alt="Favicon preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFaviconFile(null)
                      setFaviconPreview(brandData.favicon_url || null)
                      if (faviconInputRef.current) {
                        faviconInputRef.current.value = ''
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => faviconInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors mt-2"
                >
                  <Upload className="w-4 h-4 mx-auto mb-2" />
                  Click to upload favicon
                  <br />
                  <span className="text-xs">PNG, SVG, ICO up to 1MB (16x16 to 512x512px, square)</span>
                </div>
              )}
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFaviconFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setFaviconPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="hidden"
              />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>Set your primary and secondary brand colors</CardDescription>
              </div>
              <Button
                type="button"
                variant={previewMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!previewMode) {
                    // Enable preview with current form values
                    setPreviewColors({
                      primary: primaryColor,
                      secondary: secondaryColor || undefined,
                    })
                  } else {
                    // Disable preview
                    setPreviewColors(null)
                  }
                  setPreviewMode(!previewMode)
                }}
              >
                {previewMode ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Exit Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    const newColor = e.target.value
                    setValue('primaryColor', newColor, { shouldDirty: true })
                    if (previewMode) {
                      setPreviewColors(prev => ({ ...prev, primary: newColor }))
                    }
                  }}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  placeholder="#2563eb"
                  {...register('primaryColor', {
                    onChange: (e) => {
                      if (previewMode) {
                        setPreviewColors(prev => ({ ...prev, primary: e.target.value }))
                      }
                    }
                  })}
                  className={errors.primaryColor ? 'border-red-500' : ''}
                />
              </div>
              {errors.primaryColor && (
                <p className="text-sm text-red-500 mt-1">{errors.primaryColor.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="secondary-color">Secondary Color (Optional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor || '#64748b'}
                  onChange={(e) => {
                    const newColor = e.target.value
                    setValue('secondaryColor', newColor, { shouldDirty: true })
                    if (previewMode) {
                      setPreviewColors(prev => ({ ...prev, secondary: newColor }))
                    }
                  }}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  placeholder="#64748b"
                  {...register('secondaryColor', {
                    onChange: (e) => {
                      if (previewMode) {
                        setPreviewColors(prev => ({ ...prev, secondary: e.target.value || undefined }))
                      }
                    }
                  })}
                  className={errors.secondaryColor ? 'border-red-500' : ''}
                />
                <Popover open={suggestionOpen} onOpenChange={setSuggestionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Suggest Color
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-3">
                      <div className="font-semibold text-sm">Suggested Secondary Colors</div>
                      <p className="text-xs text-muted-foreground">
                        Based on your primary color using color theory
                      </p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {colorSuggestions.length > 0 ? (
                          colorSuggestions.map((suggestion, index) => {
                            const contrastRating = getContrastRating(suggestion.contrast)
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                                onClick={() => {
                                  setValue('secondaryColor', suggestion.color, { shouldDirty: true })
                                  if (previewMode) {
                                    setPreviewColors(prev => ({ ...prev, secondary: suggestion.color }))
                                  }
                                  setSuggestionOpen(false)
                                }}
                              >
                                <div
                                  className="w-10 h-10 rounded border-2 border-border flex-shrink-0"
                                  style={{ backgroundColor: suggestion.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{suggestion.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {suggestion.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono">{suggestion.color}</span>
                                    <span
                                      className={`text-xs ${
                                        contrastRating.accessible
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-amber-600 dark:text-amber-400'
                                      }`}
                                    >
                                      {contrastRating.level}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setValue('secondaryColor', suggestion.color, { shouldDirty: true })
                                    if (previewMode) {
                                      setPreviewColors(prev => ({ ...prev, secondary: suggestion.color }))
                                    }
                                    setSuggestionOpen(false)
                                  }}
                                >
                                  Apply
                                </Button>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No suggestions available. Please select a valid primary color.
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const defaultColor = '#9ca3af'
                    setValue('secondaryColor', defaultColor, { shouldDirty: true })
                    if (previewMode) {
                      setPreviewColors(prev => ({ ...prev, secondary: defaultColor }))
                    }
                  }}
                  title="Reset to default gray"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('secondaryColor', '', { shouldDirty: true })
                    if (previewMode) {
                      setPreviewColors(prev => ({ ...prev, secondary: undefined }))
                    }
                  }}
                  title="Clear secondary color"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {errors.secondaryColor && (
                <p className="text-sm text-red-500 mt-1">{errors.secondaryColor.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Used for inactive states, borders, and subtle accents
              </p>
            </div>

            {/* Preview Component - Show sample UI elements */}
            {previewMode && (
              <div className="mt-6 pt-6 border-t">
                <Label className="text-sm font-semibold mb-3 block">Live Preview</Label>
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Buttons</div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        style={{ 
                          backgroundColor: previewColors?.primary || primaryColor,
                          color: getTextColorForBackground(previewColors?.primary || primaryColor)
                        }}
                      >
                        Primary Button
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        style={{ 
                          backgroundColor: previewColors?.secondary || secondaryColor || '#9ca3af',
                          color: getTextColorForBackground(previewColors?.secondary || secondaryColor || '#9ca3af')
                        }}
                      >
                        Secondary Button
                      </Button>
                      <Button variant="outline" size="sm">Outline Button</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Badges</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="default" 
                        style={{ 
                          backgroundColor: previewColors?.primary || primaryColor,
                          color: getTextColorForBackground(previewColors?.primary || primaryColor)
                        }}
                      >
                        Primary Badge
                      </Badge>
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: previewColors?.secondary || secondaryColor || '#9ca3af',
                          color: getTextColorForBackground(previewColors?.secondary || secondaryColor || '#9ca3af')
                        }}
                      >
                        Secondary Badge
                      </Badge>
                      <Badge variant="outline">Outline Badge</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Navigation States</div>
                    <div className="flex flex-col gap-1">
                      <div 
                        className="px-3 py-2 rounded-lg text-sm font-medium"
                        style={{ 
                          backgroundColor: `${previewColors?.primary || primaryColor}15`,
                          color: previewColors?.primary || primaryColor
                        }}
                      >
                        Active Navigation Item
                      </div>
                      <div 
                        className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent/50"
                        style={{ 
                          color: previewColors?.secondary || secondaryColor || '#6b7280'
                        }}
                      >
                        Inactive Navigation Item
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Color Values</div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="font-medium">Primary:</span>{' '}
                        <span className="font-mono">{previewColors?.primary || primaryColor}</span>
                      </div>
                      <div>
                        <span className="font-medium">Secondary:</span>{' '}
                        <span className="font-mono">{previewColors?.secondary || secondaryColor || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Preview mode is active. Changes are temporary until you save.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website & Domain</CardTitle>
            <CardDescription>Configure your agency website and custom domain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Website field (always editable, optional) */}
            <div>
              <Label htmlFor="website">Agency Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://your-agency.com"
                {...register('website')}
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && (
                <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {website 
                  ? "We'll use this to set up your custom domain when you upgrade to Scale tier"
                  : "Add your website to enable custom domain setup when you upgrade to Scale tier"}
              </p>
            </div>

            {/* Domain/Subdomain Display */}
            {brandData.subdomain && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Your Portal URL:</p>
                <p className="text-lg font-semibold">{brandData.subdomain}</p>
                {brandData.domain_type === 'subdomain' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You&apos;re currently using a subdomain. Upgrade to Scale tier to use your custom domain.
                  </p>
                )}
              </div>
            )}

            {/* Custom Domain Configuration (Scale tier only) */}
            {brandData.can_configure_domain && (
              <div>
                <Label htmlFor="domain">Custom Domain (Scale tier only)</Label>
                <Input
                  id="domain"
                  placeholder="portal.youragency.com"
                  {...register('domain')}
                  defaultValue={brandData.domain || ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure your custom domain. We&apos;ll send setup instructions after you save.
                </p>
                {brandData.domain && (
                  <div className="mt-4">
                    <DomainVerification brandId={brandData.agency_id} domain={brandData.domain} tier={brandData.tier} />
                  </div>
                )}
              </div>
            )}

            {!brandData.can_configure_domain && brandData.domain && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Custom Domain: {brandData.domain}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Custom domain support is only available for Scale tier. Upgrade to enable this feature.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding Badge</CardTitle>
            <CardDescription>Control the &quot;Powered by Faro&quot; badge visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hide-powered-by"
                {...register('hidePoweredBy')}
                disabled={!brandData.can_hide_powered_by}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="hide-powered-by" className="cursor-pointer">
                Hide &quot;Powered by Faro&quot; badge
              </Label>
            </div>
            {!brandData.can_hide_powered_by && (
              <p className="text-xs text-muted-foreground mt-2">
                This feature is only available for Growth+ tiers. Upgrade to hide the badge.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-end gap-6 mb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving || isUploading}
              className="min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || isUploading || !isDirty || isValidatingSlug || !!slugError}
              style={{ backgroundColor: primaryColor }}
              className="min-w-[160px]"
              title={
                isDebugMode
                  ? saving
                    ? 'Saving changes...'
                    : isUploading
                    ? 'Uploading files...'
                    : !isDirty
                    ? 'No changes to save. Make changes to enable this button.'
                    : isValidatingSlug
                    ? 'Validating slug...'
                    : slugError
                    ? `Cannot save: ${slugError}`
                    : 'Save changes'
                  : undefined
              }
            >
              {saving || isUploading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          {/* Debug info - show why button is disabled (only in debug mode) */}
          {isDebugMode && (saving || isUploading || !isDirty || isValidatingSlug || !!slugError) && (
            <div className="text-xs text-muted-foreground mt-2 text-right">
              {!isDirty && 'Make changes to enable save'}
              {isValidatingSlug && 'Validating slug...'}
              {slugError && `Error: ${slugError}`}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
