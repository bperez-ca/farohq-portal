'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui'
import { CheckCircle2 } from 'lucide-react'
import type { OnboardingData } from '@/components/onboarding/OnboardingWizard'
import axios from 'axios'

const locationSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
  city: z.string().min(1, 'City is required'),
  phone: z.string().min(1, 'Phone is required'),
  gbpUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type LocationFormData = z.infer<typeof locationSchema>

interface LocationFormProps {
  data: OnboardingData
  onComplete: (data: Partial<OnboardingData>) => void
}

const industries = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'salon', label: 'Salon' },
  { value: 'dental', label: 'Dental' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'tattoo', label: 'Tattoo' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Other' },
]

export function LocationForm({ data, onComplete }: LocationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      businessName: data.businessName,
      industry: data.industry,
      city: data.city,
      phone: data.phone,
      gbpUrl: data.gbpUrl,
    },
  })

  const brandColor = data.brandColor || '#2563eb'

  const onSubmit = async (formData: LocationFormData) => {
    if (!data.tenantId) {
      alert('Tenant ID is missing. Please go back and complete step 1.')
      return
    }

    try {
      const slug = formData.businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'business'

      const clientResponse = await axios.post(
        `/api/v1/tenants/${data.tenantId}/clients`,
        { name: formData.businessName, slug, tier: 'starter' },
        { withCredentials: true }
      )
      const clientId = clientResponse.data?.id

      onComplete({
        businessName: formData.businessName,
        industry: formData.industry,
        city: formData.city,
        phone: formData.phone,
        gbpUrl: formData.gbpUrl,
        clientId,
      })
    } catch (error: any) {
      console.error('Failed to create first client:', error)
      const msg = error.response?.data?.error || error.response?.data?.details || error.message
      alert(msg || 'Failed to create first client. Please try again.')
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Add a business you want to impress
          </CardTitle>
          <CardDescription>
            We'll generate a presence report to show them what they're missing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="Joe's HVAC"
                {...register('businessName')}
                className={errors.businessName ? 'border-red-500' : ''}
              />
              {errors.businessName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select
                onValueChange={(value) => setValue('industry', value)}
                defaultValue={data.industry}
              >
                <SelectTrigger
                  className={errors.industry ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.industry.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Austin"
                {...register('city')}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Main Phone</Label>
              <Input
                id="phone"
                placeholder="(555) 987-6543"
                type="tel"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="gbp">Google Business Profile URL (optional)</Label>
              <Input
                id="gbp"
                placeholder="https://g.page/..."
                type="url"
                {...register('gbpUrl')}
                className={errors.gbpUrl ? 'border-red-500' : ''}
              />
              {errors.gbpUrl && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.gbpUrl.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: brandColor }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating first client...' : 'Add first client'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <p className="text-sm text-muted-foreground">
          We'll generate a Presence & Trust report for this business showing:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 mt-4">
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
            Online listing accuracy across platforms
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
            Current review ratings and gaps
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
            Estimated missed revenue from slow replies
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          You'll get a shareable link to show them the opportunity.
        </p>
      </Card>
    </div>
  )
}

