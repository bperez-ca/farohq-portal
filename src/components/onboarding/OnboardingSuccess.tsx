'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { CheckCircle2 } from 'lucide-react'

interface OnboardingSuccessProps {
  agencyName: string
  subdomain?: string
  tenantId?: string
}

export function OnboardingSuccess({ agencyName, subdomain, tenantId }: OnboardingSuccessProps) {
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleGoToDashboard = async () => {
    setIsValidating(true)
    setValidationError(null)

    try {
      // If tenantId is provided, validate it first
      if (tenantId) {
        try {
          const response = await fetch(`/api/v1/tenants/validate?tenantId=${encodeURIComponent(tenantId)}`, {
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            if (data.valid && data.hasAccess && data.hasRole) {
              // Redirect to dashboard with tenantId
              router.push(`/dashboard?tenantId=${encodeURIComponent(data.tenantId)}`)
              return
            } else {
              setValidationError('Unable to validate tenant access. Redirecting to default dashboard...')
              // Fall through to default dashboard
            }
          } else if (response.status === 404) {
            // Tenant not found - might be a timing issue, but proceed to default dashboard
            console.warn('Tenant not found during validation, proceeding to default dashboard')
          } else if (response.status === 400) {
            // Missing tenantId parameter - shouldn't happen if we're passing it, but handle gracefully
            console.warn('Validation request had missing parameters')
          }
        } catch (error) {
          console.error('Failed to validate tenant:', error)
          setValidationError('Validation failed. Redirecting to default dashboard...')
        }
      } else {
        // Also check for tenantId in headers via API
        try {
          const response = await fetch('/api/v1/tenants/validate', {
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            if (data.valid && data.hasAccess && data.hasRole && data.tenantId) {
              // Redirect to dashboard with tenantId
              router.push(`/dashboard?tenantId=${encodeURIComponent(data.tenantId)}`)
              return
            }
          } else if (response.status === 400) {
            // No tenantId in headers - this is expected, proceed to default dashboard
            console.log('No tenantId found, proceeding to default dashboard')
          }
        } catch (error) {
          console.error('Failed to validate tenant from headers:', error)
        }
      }

      // If no valid tenantId found, redirect to default dashboard
      router.push('/agency/dashboard')
    } catch (error) {
      console.error('Unexpected error during navigation:', error)
      setValidationError('An error occurred. Please try again.')
      setIsValidating(false)
    }
  }

  return (
    <Card className="text-center">
      <CardHeader>
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-3xl">Congratulations!</CardTitle>
        <CardDescription className="text-lg mt-2">
          Your agency <strong>{agencyName}</strong> has been created successfully.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subdomain && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Your Portal URL:</p>
            <p className="text-lg font-semibold">{subdomain}</p>
            <p className="text-xs text-muted-foreground mt-2">
              This subdomain will be available shortly.
            </p>
          </div>
        )}
        
        <p className="text-muted-foreground">
          You're all set! Click the button below to go to your dashboard.
        </p>

        {validationError && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {validationError}
          </p>
        )}
        
        <div className="flex justify-center gap-4 pt-4">
          <Button
            size="lg"
            onClick={handleGoToDashboard}
            disabled={isValidating}
          >
            {isValidating ? 'Loading...' : 'Go to Dashboard'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
