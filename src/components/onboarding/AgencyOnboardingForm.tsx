'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@farohq/ui'
import { Upload, X } from 'lucide-react'
import { safeLogError, safeLogWarn } from '@/lib/log-sanitizer'

const onboardingSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface AgencyOnboardingFormProps {
  onComplete: (data: OnboardingFormData & { logoUrl?: string; tenantId?: string; subdomain?: string }) => void
}

// Helper function to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to extract domain from website URL
function extractDomainFromWebsite(websiteUrl: string): string {
  try {
    // Remove protocol
    let domain = websiteUrl.replace(/^https?:\/\//, '')
    // Remove www.
    domain = domain.replace(/^www\./, '')
    // Remove path, query, hash
    domain = domain.split('/')[0]
    domain = domain.split('?')[0]
    domain = domain.split('#')[0]
    // Remove port
    domain = domain.split(':')[0]
    return domain
  } catch {
    return ''
  }
}

// Helper function to remove TLD and subdomain from domain
// e.g., "subdomain.example.com" -> "example", "www.example.com.mx" -> "example"
function removeTLDFromDomain(domain: string): string {
  if (!domain) return ''
  
  // Remove common subdomain prefixes (www, app, api, etc.)
  const subdomainPrefixes = ['www', 'app', 'api', 'admin', 'portal', 'dashboard', 'staging', 'dev', 'test']
  let parts = domain.split('.')
  
  // Remove subdomain prefix if present
  if (parts.length > 0 && subdomainPrefixes.includes(parts[0].toLowerCase())) {
    parts = parts.slice(1)
  }
  
  if (parts.length === 0) return ''
  
  // If domain has 2 or fewer parts, return the main part
  if (parts.length <= 2) {
    // If it's a 2-part domain like "example.com", return just "example"
    if (parts.length === 2) {
      return parts[0]
    }
    return parts[0] || domain
  }
  
  // For domains with 3+ parts, check if last 2 parts form a country TLD
  // Common country TLDs: .co.uk, .com.mx, .com.au, .co.za, etc.
  const lastTwo = parts.slice(-2).join('.')
  const countryTLDs = ['co.uk', 'com.mx', 'com.au', 'co.za', 'com.br', 'com.ar', 'co.nz', 'com.co']
  
  if (countryTLDs.includes(lastTwo.toLowerCase())) {
    // Remove last 2 parts (country TLD), return the main domain part
    // e.g., "subdomain.example.com.mx" -> ["subdomain", "example"] -> "example"
    const mainParts = parts.slice(0, -2)
    return mainParts.length > 0 ? mainParts[mainParts.length - 1] : parts[0]
  }
  
  // Otherwise, remove just the last part (standard TLD like .com, .org)
  // Return the main domain part (second to last if there are subdomains)
  // e.g., "subdomain.example.com" -> ["subdomain", "example"] -> "example"
  const mainParts = parts.slice(0, -1)
  return mainParts.length > 0 ? mainParts[mainParts.length - 1] : parts[0]
}

// Helper function to generate subdomain value (just the subdomain part, not full URL)
function generateSubdomainFromWebsite(websiteUrl: string): string {
  const domain = extractDomainFromWebsite(websiteUrl)
  if (!domain) return ''
  
  // Remove TLD and subdomain to get just the main domain
  const hostname = removeTLDFromDomain(domain)
  if (!hostname) return ''
  
  // Generate slug from hostname (without TLD and subdomain)
  return generateSlug(hostname)
}

// Helper function to generate subdomain from agency name
function generateSubdomainFromName(agencyName: string): string {
  return generateSlug(agencyName)
}

export function AgencyOnboardingForm({ onComplete }: AgencyOnboardingFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      agencyName: '',
      slug: '',
      website: '',
      brandColor: '#2563eb',
      subdomain: '',
    },
  })

  const agencyName = watch('agencyName')
  const slug = watch('slug')
  const website = watch('website')
  const brandColor = watch('brandColor')
  const subdomain = watch('subdomain')

  // Auto-generate slug from agency name
  useEffect(() => {
    if (agencyName && !slug) {
      const generatedSlug = generateSlug(agencyName)
      setValue('slug', generatedSlug, { shouldValidate: false })
    }
  }, [agencyName, slug, setValue])

  // Update slug when agency name changes (if slug matches previous generated slug)
  useEffect(() => {
    if (agencyName) {
      const generatedSlug = generateSlug(agencyName)
      const currentSlug = slug
      // Only auto-update if current slug matches what would be generated from previous name
      // This is a simple heuristic - in practice, user might have edited slug, so we're conservative
      if (currentSlug && generateSlug(agencyName) !== currentSlug) {
        // User has edited slug, don't auto-update
      }
    }
  }, [agencyName, slug])

  // Auto-generate subdomain suggestion
  useEffect(() => {
    if (!subdomain) { // Only auto-generate if user hasn't edited it
      if (website) {
        const suggested = generateSubdomainFromWebsite(website)
        setValue('subdomain', suggested, { shouldValidate: false })
      } else if (agencyName) {
        const suggested = generateSubdomainFromName(agencyName)
        setValue('subdomain', suggested, { shouldValidate: false })
      }
    }
  }, [website, agencyName, subdomain, setValue])

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    const timeoutId = setTimeout(() => {
      checkSlugAvailability(slug)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [slug])

  // Check subdomain availability (debounced)
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    const timeoutId = setTimeout(() => {
      checkSubdomainAvailability(subdomain)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [subdomain])

  const checkSlugAvailability = async (slugToCheck: string) => {
    setCheckingSlug(true)
    try {
      const response = await fetch(`/api/v1/tenants/validate-slug?slug=${encodeURIComponent(slugToCheck)}`)
      if (response.ok) {
        const data = await response.json()
        setSlugAvailable(data.available)
      } else {
        setSlugAvailable(null)
      }
    } catch (error) {
      safeLogError('Failed to check slug availability', error)
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  const checkSubdomainAvailability = async (subdomainToCheck: string) => {
    setCheckingSubdomain(true)
    try {
      // Use the same validation endpoint as slug, or create a separate one
      // For now, we'll use validate-slug since subdomain validation might be similar
      const response = await fetch(`/api/v1/tenants/validate-slug?slug=${encodeURIComponent(subdomainToCheck)}`)
      if (response.ok) {
        const data = await response.json()
        setSubdomainAvailable(data.available)
      } else {
        setSubdomainAvailable(null)
      }
    } catch (error) {
      safeLogError('Failed to check subdomain availability', error)
      setSubdomainAvailable(null)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        alert('Please select a PNG, SVG, or JPG file')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file size must be less than 2MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const onSubmit = async (formData: OnboardingFormData) => {
    // Validate slug availability
    if (slugAvailable === false) {
      alert('This slug is already taken. Please choose another.')
      return
    }

    // Validate subdomain availability
    if (formData.subdomain && subdomainAvailable === false) {
      alert('This subdomain is already taken. Please choose another.')
      return
    }

    try {
      setIsUploading(true)

      // Step 1: Create tenant first (we need tenantId for logo upload)
      const response = await fetch('/api/v1/tenants/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.agencyName,
          slug: formData.slug,
          website: formData.website || '',
          primary_color: formData.brandColor,
          logo_url: '', // Will be updated after logo upload
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create agency' }))
        alert(error.error || 'Failed to create agency. Please try again.')
        return
      }

      const tenantData = await response.json()
      const tenantId = tenantData.id

      // Step 2: Upload logo if provided
      let logoUrl = ''
      if (logoFile) {
        try {
          const logoFormData = new FormData()
          logoFormData.append('file', logoFile)
          logoFormData.append('asset', 'logo')
          logoFormData.append('agency_id', tenantId)

          const uploadResponse = await fetch('/api/v1/files/upload', {
            method: 'POST',
            headers: {
              'X-Tenant-ID': tenantId,
            },
            credentials: 'include',
            body: logoFormData,
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            logoUrl = uploadData.public_url || uploadData.url || ''
          } else {
            safeLogWarn('Failed to upload logo, continuing without logo')
          }
        } catch (uploadError) {
          safeLogError('Failed to upload logo', uploadError)
          // Continue without logo
        }
      }

      // Step 3: Create brand record with all branding data (use POST for new brands)
      try {
        // Backend expects: logo_url, primary_color, secondary_color, website, favicon_url (optional)
        // Backend gets agency_id from X-Tenant-ID header, not from body
        // Database constraint requires secondary_color to be valid hex color or NULL
        // Use primary color as default for secondary color (can be changed later in settings)
        const brandPayload = {
          primary_color: formData.brandColor,
          secondary_color: formData.brandColor, // Use primary color as default (database requires valid hex or NULL)
          logo_url: logoUrl || '',
          website: formData.website || '',
          favicon_url: '', // Optional, can be added later
        }
        // Ensure tenantId is a clean string (no extra spaces or duplicates)
        const cleanTenantId = tenantId?.trim();
        const brandResponse = await fetch('/api/v1/brands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': cleanTenantId,
          },
          credentials: 'include',
          body: JSON.stringify(brandPayload),
        })

        if (!brandResponse.ok) {
          const errorText = await brandResponse.text().catch(() => 'Unknown error')
          safeLogWarn('Failed to create brand record', { errorText })
          // Continue anyway - brand can be created/updated later in settings
        }
      } catch (brandError) {
        safeLogError('Failed to create brand', brandError)
        // Continue anyway - brand can be created later
      }

      // Pass data to parent component
      const fullSubdomain = formData.subdomain ? `${formData.subdomain}.app.farohq.com` : undefined
      onComplete({
        ...formData,
        logoUrl: logoUrl || logoPreview || undefined,
        tenantId: tenantId,
        subdomain: fullSubdomain,
      })
    } catch (error) {
      safeLogError('Failed to create agency', error)
      alert('Failed to create agency. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Let's create your agency</CardTitle>
        <CardDescription>
          Get started by setting up your agency profile. You can always update these later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Agency Name */}
          <div>
            <Label htmlFor="agency-name">Agency Name *</Label>
            <Input
              id="agency-name"
              placeholder="Growth Marketing Co"
              {...register('agencyName')}
              className={errors.agencyName ? 'border-red-500' : ''}
            />
            {errors.agencyName && (
              <p className="text-sm text-red-500 mt-1">{errors.agencyName.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="growth-marketing-co"
              {...register('slug')}
              className={errors.slug || slugAvailable === false ? 'border-red-500' : slugAvailable === true ? 'border-green-500' : ''}
            />
            {errors.slug && (
              <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
            )}
            {checkingSlug && (
              <p className="text-sm text-muted-foreground mt-1">Checking availability...</p>
            )}
            {!checkingSlug && slugAvailable === false && (
              <p className="text-sm text-red-500 mt-1">This slug is already taken</p>
            )}
            {!checkingSlug && slugAvailable === true && (
              <p className="text-sm text-green-500 mt-1">Slug is available</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website (Optional)</Label>
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
              We'll use this to suggest your portal subdomain.
            </p>
          </div>

          {/* Subdomain */}
          <div>
            <Label htmlFor="subdomain">Portal Subdomain *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                placeholder="your-agency"
                {...register('subdomain')}
                className={errors.subdomain || subdomainAvailable === false ? 'border-red-500' : subdomainAvailable === true ? 'border-green-500' : ''}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">.app.farohq.com</span>
            </div>
            {errors.subdomain && (
              <p className="text-sm text-red-500 mt-1">{errors.subdomain.message}</p>
            )}
            {checkingSubdomain && (
              <p className="text-sm text-muted-foreground mt-1">Checking availability...</p>
            )}
            {!checkingSubdomain && subdomainAvailable === false && (
              <p className="text-sm text-red-500 mt-1">This subdomain is already taken</p>
            )}
            {!checkingSubdomain && subdomainAvailable === true && (
              <p className="text-sm text-green-500 mt-1">Subdomain is available</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Your portal will be available at: <strong>{subdomain ? `${subdomain}.app.farohq.com` : 'subdomain.app.farohq.com'}</strong>
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Logo (Optional)</Label>
            {logoPreview ? (
              <div className="relative mt-2">
                <div className="border-2 border-dashed rounded-lg p-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 mx-auto"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
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
                Click to upload or drag and drop
                <br />
                <span className="text-xs">PNG, SVG, JPG up to 2MB</span>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/jpg"
              onChange={handleLogoSelect}
              className="hidden"
            />
          </div>

          {/* Brand Color */}
          <div>
            <Label htmlFor="brand-color">Brand Color *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="brand-color"
                type="color"
                value={brandColor}
                onChange={(e) => setValue('brandColor', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                placeholder="#2563eb"
                {...register('brandColor')}
                className={errors.brandColor ? 'border-red-500' : ''}
              />
            </div>
            {errors.brandColor && (
              <p className="text-sm text-red-500 mt-1">{errors.brandColor.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: brandColor }}
            disabled={isSubmitting || isUploading || slugAvailable === false || (subdomain && subdomainAvailable === false)}
          >
            {isSubmitting || isUploading ? 'Creating...' : 'Create Agency'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
