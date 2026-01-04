'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@farohq/ui'
import { Upload, X } from 'lucide-react'
import type { OnboardingData } from './OnboardingWizard'
import axios from 'axios'

const brandingSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
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
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      brandColor: data.brandColor,
      customDomain: data.customDomain,
    },
  })

  const brandColor = watch('brandColor')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB')
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadLogo = async (): Promise<string | undefined> => {
    if (!logoFile) return undefined

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', logoFile)
      formData.append('type', 'image')

      // Note: This will need tenantId after tenant is created
      // For now, we'll upload after tenant creation
      const response = await axios.post('/api/v1/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data.url || response.data.id
    } catch (error) {
      console.error('Failed to upload logo:', error)
      // Continue without logo if upload fails
      return undefined
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

      // Create tenant
      const tenantResponse = await axios.post('/api/v1/tenants', {
        name: formData.agencyName,
        slug: slug,
      })

      const tenantId = tenantResponse.data.id

      // Upload logo if provided (now we have tenantId)
      let logoUrl: string | undefined
      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)
        formData.append('type', 'image')
        formData.append('tenantId', tenantId)

        try {
          const logoResponse = await axios.post('/api/v1/files', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          logoUrl = logoResponse.data.url || logoResponse.data.id
        } catch (error) {
          console.error('Failed to upload logo:', error)
          // Continue without logo
        }
      }

      // Update brand theme via brands endpoint
      // Note: This endpoint may require authentication
      // The brand is created/updated with tenant_id (agency_id) in context
      try {
        await axios.post('/api/v1/brands', {
          agency_id: tenantId,
          primary_color: formData.brandColor,
          logo_url: logoUrl,
          domain: formData.customDomain,
        }, {
          // Include credentials for authenticated requests
          withCredentials: true,
        })
      } catch (error: any) {
        console.error('Failed to update brand:', error)
        // Continue - brand update is optional for onboarding
        // The tenant is created successfully, brand can be updated later
      }

      onComplete({
        agencyName: formData.agencyName,
        brandColor: formData.brandColor,
        customDomain: formData.customDomain,
        logoUrl,
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
        // Optionally redirect to sign in
        // window.location.href = '/signin?return_to=/onboarding'
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
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors mt-2"
              >
                <Upload className="w-6 h-6 mx-auto mb-2" />
                Click to upload or drag and drop
                <br />
                <span className="text-xs">PNG, JPG up to 2MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div>
            <Label htmlFor="brand-color">Brand Color</Label>
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
            <Label htmlFor="domain">Custom Domain</Label>
            <Input
              id="domain"
              placeholder="portal.youragency.com"
              {...register('customDomain')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll send setup instructions after you complete onboarding
            </p>
          </div>

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

