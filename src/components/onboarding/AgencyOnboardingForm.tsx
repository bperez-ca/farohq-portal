'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@farohq/ui'
import { Upload, X } from 'lucide-react'

const onboardingSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

interface AgencyOnboardingFormProps {
  onComplete: (data: OnboardingFormData & { logoUrl?: string }) => void
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

// Helper function to generate subdomain from website
function generateSubdomainFromWebsite(websiteUrl: string): string {
  const domain = extractDomainFromWebsite(websiteUrl)
  if (!domain) return ''
  const slug = generateSlug(domain)
  return slug ? `${slug}.app.farohq.com` : ''
}

// Helper function to generate subdomain from agency name
function generateSubdomainFromName(agencyName: string): string {
  const slug = generateSlug(agencyName)
  return slug ? `${slug}.app.farohq.com` : ''
}

export function AgencyOnboardingForm({ onComplete }: AgencyOnboardingFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [suggestedSubdomain, setSuggestedSubdomain] = useState<string>('')
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
    },
  })

  const agencyName = watch('agencyName')
  const slug = watch('slug')
  const website = watch('website')
  const brandColor = watch('brandColor')

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

  // Generate subdomain suggestion
  useEffect(() => {
    if (website) {
      const subdomain = generateSubdomainFromWebsite(website)
      setSuggestedSubdomain(subdomain)
    } else if (agencyName) {
      const subdomain = generateSubdomainFromName(agencyName)
      setSuggestedSubdomain(subdomain)
    } else {
      setSuggestedSubdomain('')
    }
  }, [website, agencyName])

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
      console.error('Failed to check slug availability:', error)
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
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

    try {
      setIsUploading(true)

      // Create tenant first
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
          logo_url: '', // Logo upload will be handled separately if needed
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create agency' }))
        alert(error.error || 'Failed to create agency. Please try again.')
        return
      }

      const tenantData = await response.json()

      // Pass data to parent component (onboarding page will handle success screen)
      onComplete({
        ...formData,
        logoUrl: logoPreview || undefined, // Pass preview URL for display (actual upload can be done later)
      })
    } catch (error) {
      console.error('Failed to create agency:', error)
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

          {/* Subdomain Suggestion */}
          {suggestedSubdomain && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Your Portal URL:</p>
              <p className="text-lg font-semibold">{suggestedSubdomain}</p>
              <p className="text-xs text-muted-foreground mt-2">
                This subdomain will be available for your Starter/Growth tier portal.
              </p>
            </div>
          )}

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
            disabled={isSubmitting || isUploading || slugAvailable === false}
          >
            {isSubmitting || isUploading ? 'Creating...' : 'Create Agency'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
