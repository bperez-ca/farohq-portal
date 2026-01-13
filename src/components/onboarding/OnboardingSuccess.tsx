'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@farohq/ui'
import { CheckCircle2 } from 'lucide-react'

interface OnboardingSuccessProps {
  agencyName: string
  subdomain?: string
}

export function OnboardingSuccess({ agencyName, subdomain }: OnboardingSuccessProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

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
          You're all set! Redirecting to your dashboard...
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
          <Button
            size="lg"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
