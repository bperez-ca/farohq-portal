'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { Upload, X } from 'lucide-react'
import type { OnboardingData } from '@/components/onboarding/OnboardingWizard'
import axios from 'axios'

const brandingSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')), // Optional, displayed but not required
  customDomain: z.string().optional(),
})

type BrandingFormData = z.infer<typeof brandingSchema>

interface BrandingFormProps {
  data: OnboardingData
  onComplete: (data: Partial<OnboardingData>) => void
}

export function BrandingForm({ data, onComplete }: BrandingFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(data.logoUrl || null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [subdomain, setSubdomain] = useState<string | null>(null) // Auto-generated subdomain for lower tiers
  const [tier, setTier] = useState<string | null>(null) // Current tier (from tenant)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      agencyName: data.agencyName,
      brandColor: data.brandColor || '#2563eb',
      secondaryColor: data.secondaryColor,
      website: data.website,
      customDomain: data.customDomain,
    },
  })

  const brandColor = watch('brandColor')
  const secondaryColor = watch('secondaryColor')
  const website = watch('website')

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PNG, SVG, JPG)
      const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        alert('Please select a PNG, SVG, or JPG file')
        return
      }
      // Validate file size (2MB for logos)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file size must be less than 2MB')
        return
      }
      // Validate dimensions for images (not SVG)
      if (file.type !== 'image/svg+xml') {
        const img = new Image()
        img.onload = () => {
          if (img.width < 64 || img.height < 64 || img.width > 2048 || img.height > 2048) {
            alert('Logo dimensions must be between 64x64 and 2048x2048 pixels')
            return
          }
          setLogoFile(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            setLogoPreview(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
        img.src = URL.createObjectURL(file)
      } else {
        setLogoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleFaviconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PNG, SVG, ICO)
      const validTypes = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
      if (!validTypes.includes(file.type)) {
        alert('Please select a PNG, SVG, or ICO file')
        return
      }
      // Validate file size (1MB for favicons)
      if (file.size > 1 * 1024 * 1024) {
        alert('Favicon file size must be less than 1MB')
        return
      }
      // Validate dimensions for images (not SVG)
      if (file.type !== 'image/svg+xml' && !file.type.includes('icon')) {
        const img = new Image()
        img.onload = () => {
          if (img.width < 16 || img.height < 16 || img.width > 512 || img.height > 512) {
            alert('Favicon dimensions must be between 16x16 and 512x512 pixels')
            return
          }
          // Check if square (for favicons)
          const ratio = img.width / img.height
          if (ratio < 0.95 || ratio > 1.05) {
            alert('Favicon should be square (1:1 aspect ratio)')
            return
          }
          setFaviconFile(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            setFaviconPreview(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
        img.src = URL.createObjectURL(file)
      } else {
        setFaviconFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setFaviconPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleRemoveFavicon = () => {
    setFaviconFile(null)
    setFaviconPreview(null)
    if (faviconInputRef.current) {
      faviconInputRef.current.value = ''
    }
  }

  // Upload file using presigned URL
  const uploadFile = async (file: File, assetType: 'logo' | 'favicon', tenantId: string): Promise<string | undefined> => {
    try {
      setIsUploading(true)

      // Step 1: Get presigned URL from backend
      const signResponse = await axios.post('/api/v1/files/sign', {
        agency_id: tenantId,
        asset: assetType,
      }, {
        withCredentials: true,
        headers: {
          'X-Tenant-ID': tenantId, // Ensure tenant context
        },
      })

      const { url: presignedUrl, key, headers: presignedHeaders } = signResponse.data

      // Step 2: Upload file directly to GCS/S3 using presigned URL
      await axios.put(presignedUrl, file, {
        headers: {
          ...presignedHeaders,
          'Content-Type': file.type,
        },
      })

      // Step 3: Construct public URL from key
      // For GCS: https://storage.googleapis.com/{bucket}/{key} or custom domain
      // The key format is: {tenant_id}/branding/{asset_type}/{filename}
      // We'll construct the full public URL
      // Note: In production, this should use the actual GCS bucket and may use a CDN
      const bucket = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME || 'farohq-files'
      const publicUrl = `https://storage.googleapis.com/${bucket}/${key}`
      return publicUrl
    } catch (error) {
      console.error(`Failed to upload ${assetType}:`, error)
      throw error // Re-throw to handle in caller
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (formData: BrandingFormData) => {
    try {
      // Generate slug from agency name
      const slug = formData.agencyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Create tenant via onboard (adds user as owner) — UX-001
      const tenantResponse = await axios.post('/api/v1/tenants/onboard', {
        name: formData.agencyName,
        slug: slug,
        website: formData.website || '',
        primary_color: formData.brandColor,
        logo_url: '',
      }, {
        withCredentials: true,
      })

      const tenantId = tenantResponse.data.id
      const tenantTier = tenantResponse.data.tier || 'starter' // Default to starter
      setTier(tenantTier)

      // Upload logo if provided (using presigned URL)
      let logoUrl: string | undefined
      if (logoFile) {
        try {
          logoUrl = await uploadFile(logoFile, 'logo', tenantId)
        } catch (error) {
          console.error('Failed to upload logo:', error)
          // Continue without logo
        }
      }

      // Upload favicon if provided (using presigned URL)
      let faviconUrl: string | undefined
      if (faviconFile) {
        try {
          faviconUrl = await uploadFile(faviconFile, 'favicon', tenantId)
        } catch (error) {
          console.error('Failed to upload favicon:', error)
          // Continue without favicon
        }
      }

      // Create brand with all fields (website is optional, subdomain auto-generated for lower tiers)
      try {
        const brandResponse = await axios.post('/api/v1/brands', {
          domain: formData.customDomain || '', // Optional: Only used for Scale tier
          website: formData.website || '', // Optional: Captured for future custom domain integration
          primary_color: formData.brandColor,
          secondary_color: formData.secondaryColor || '',
          logo_url: logoUrl || '',
          favicon_url: faviconUrl || '',
        }, {
          withCredentials: true,
          headers: {
            'X-Tenant-ID': tenantId, // Ensure tenant context is set
          },
        })

        // Extract subdomain from response (auto-generated for lower tiers)
        if (brandResponse.data.subdomain) {
          setSubdomain(brandResponse.data.subdomain)
        }
      } catch (error: any) {
        console.error('Failed to create brand:', error)
        // Continue - brand creation is handled by backend with subdomain generation
        // The tenant is created successfully, brand will be created with subdomain
      }

      onComplete({
        agencyName: formData.agencyName,
        brandColor: formData.brandColor,
        secondaryColor: formData.secondaryColor,
        website: formData.website,
        customDomain: formData.customDomain,
        logoUrl,
        faviconUrl,
        tenantId,
      })
    } catch (error: any) {
      console.error('Failed to create tenant:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to create workspace. Please try again.'
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Authentication required. Please sign in first.')
      } else {
        alert(errorMessage)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Let's brand your portal</CardTitle>
        <CardDescription>
          Your clients will see these details on their dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="agency-name">Agency Name</Label>
            <Input
              id="agency-name"
              placeholder="Growth Marketing Co"
              {...register('agencyName')}
              className={errors.agencyName ? 'border-red-500' : ''}
            />
            {errors.agencyName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.agencyName.message}
              </p>
            )}
          </div>

          {/* Website field (optional, displayed but not required) */}
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
              <p className="text-sm text-red-500 mt-1">
                {errors.website.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {website 
                ? "We'll use this to set up your custom domain when you upgrade"
                : "No website? No problem! You can add this later in settings. We'll help you set up your custom domain when you're ready."}
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Logo Upload</Label>
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
                <span className="text-xs">PNG, SVG, JPG up to 2MB (64x64 to 2048x2048px)</span>
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

          {/* Favicon Upload */}
          <div>
            <Label htmlFor="favicon">Favicon Upload (Optional)</Label>
            {faviconPreview ? (
              <div className="relative mt-2">
                <div className="border-2 border-dashed rounded-lg p-4 w-16 h-16">
                  <img
                    src={faviconPreview}
                    alt="Favicon preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFavicon}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
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
              onChange={handleFaviconSelect}
              className="hidden"
            />
          </div>

          <div>
            <Label htmlFor="brand-color">Primary Brand Color</Label>
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
              <p className="text-sm text-red-500 mt-1">
                {errors.brandColor.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="secondary-color">Secondary Brand Color (Optional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="secondary-color"
                type="color"
                value={secondaryColor || '#64748b'}
                onChange={(e) => setValue('secondaryColor', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                placeholder="#64748b"
                {...register('secondaryColor')}
                className={errors.secondaryColor ? 'border-red-500' : ''}
              />
            </div>
            {errors.secondaryColor && (
              <p className="text-sm text-red-500 mt-1">
                {errors.secondaryColor.message}
              </p>
            )}
          </div>

          {/* Domain/Subdomain Display */}
          {subdomain && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Your Portal URL:</p>
              <p className="text-lg font-semibold">{subdomain}</p>
              {tier && (tier === 'starter' || tier === 'growth') && (
                <p className="text-xs text-muted-foreground mt-2">
                  You're currently using a subdomain. Upgrade to Scale tier to use your custom domain.
                </p>
              )}
            </div>
          )}

          {/* Custom Domain field (Scale tier only) */}
          {tier === 'scale' && (
            <div>
              <Label htmlFor="domain">Custom Domain (Scale tier only)</Label>
              <Input
                id="domain"
                placeholder="portal.youragency.com"
                {...register('customDomain')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send setup instructions after you complete onboarding
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: brandColor }}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? 'Creating...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

