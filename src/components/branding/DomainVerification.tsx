'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import axios from 'axios'

interface DomainVerificationProps {
  brandId: string
  domain: string
  tier?: string
}

interface DomainStatus {
  verified: boolean
  expected_cname: string
  current_cname?: string
  ssl_status: string
  branding: {
    domain: string
    subdomain: string | null
    domain_type: string | null
    website: string | null
    ssl_status: string | null
  }
}

export function DomainVerification({ brandId, domain, tier }: DomainVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState<DomainStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string | null>(null)

  // Tier validation: Only render for Scale tier
  if (tier !== 'scale') {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Upgrade Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            Custom domain support is only available for Scale tier. Upgrade to enable this feature.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/settings/billing'}>
            Upgrade to Scale Tier
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Load domain status on mount and periodically
  useEffect(() => {
    loadDomainStatus()
    // Poll every 30 seconds when status is pending
    const interval = setInterval(() => {
      if (status?.ssl_status === 'pending') {
        loadDomainStatus()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [brandId, domain, status?.ssl_status])

  const loadDomainStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(`/api/v1/brands/${brandId}/domain-status`, {
        withCredentials: true,
      })

      if (response.data) {
        setStatus(response.data)
      }
    } catch (error: any) {
      console.error('Failed to load domain status:', error)
      if (error.response?.status === 403) {
        setError('Custom domain support is only available for Scale tier')
      } else {
        setError('Failed to load domain status. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadInstructions = async () => {
    try {
      setError(null)
      const response = await axios.get(`/api/v1/brands/${brandId}/domain-instructions`, {
        withCredentials: true,
      })

      if (response.data) {
        setInstructions(response.data.instructions)
      }
    } catch (error: any) {
      console.error('Failed to load domain instructions:', error)
      if (error.response?.status === 403) {
        setError('Custom domain support is only available for Scale tier')
      } else {
        setError('Failed to load domain instructions. Please try again.')
      }
    }
  }

  const handleVerify = async () => {
    try {
      setVerifying(true)
      setError(null)

      const response = await axios.post(`/api/v1/brands/${brandId}/verify-domain`, {
        domain: domain,
      }, {
        withCredentials: true,
      })

      if (response.data) {
        setStatus(response.data)
        // Load instructions if not verified yet
        if (!response.data.verified && response.data.expected_cname) {
          await loadInstructions()
        }
      }
    } catch (error: any) {
      console.error('Failed to verify domain:', error)
      if (error.response?.status === 403) {
        setError('Custom domain support is only available for Scale tier')
      } else {
        setError(error.response?.data?.error || 'Failed to verify domain. Please try again.')
      }
    } finally {
      setVerifying(false)
    }
  }

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading domain status...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Verification</CardTitle>
        <CardDescription>
          Verify your custom domain and monitor SSL certificate provisioning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Domain: {domain}</p>
          {status?.expected_cname && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Expected CNAME Target (from Vercel API):</p>
              <code className="text-xs block break-all">{status.expected_cname}</code>
              <p className="text-xs text-muted-foreground mt-2">
                Note: CNAME target value may vary. Always fetch from Vercel API.
              </p>
            </div>
          )}

          {status?.current_cname && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Current DNS Record (for UX feedback only):</p>
              <code className="text-xs block break-all">{status.current_cname}</code>
              <p className="text-xs text-muted-foreground mt-2">
                Note: This is for UI feedback only. Vercel API is the source of truth.
              </p>
            </div>
          )}
        </div>

        {status?.verified ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Domain verified via Vercel
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Status from Vercel API: Verified
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {instructions ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  DNS Setup Instructions
                </p>
                <pre className="text-xs text-blue-700 dark:text-blue-300 whitespace-pre-wrap font-mono">
                  {instructions}
                </pre>
                <a
                  href="https://vercel.com/docs/custom-domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                >
                  Vercel Domain Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={loadInstructions}
                disabled={loading}
              >
                Show DNS Instructions
              </Button>
            )}

            <Button
              type="button"
              onClick={handleVerify}
              disabled={verifying || loading}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Domain'
              )}
            </Button>
          </div>
        )}

        {/* SSL Status */}
        {status && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">SSL Certificate Status</p>
            <p className="text-xs text-muted-foreground mb-2">
              Status from Vercel API (source of truth):
            </p>
            {status.ssl_status === 'active' ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            ) : status.ssl_status === 'pending' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  SSL certificate is being provisioned by Vercel. This typically takes minutes to hours, but can take up to 24 hours.
                </p>
                <p className="text-xs text-muted-foreground">
                  Vercel automatically provisions SSL after DNS is correct and propagated.
                </p>
              </div>
            ) : status.ssl_status === 'failed' ? (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Failed</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Status: {status.ssl_status || 'Unknown'}
              </div>
            )}
          </div>
        )}

        {status?.verified && status?.ssl_status === 'active' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              ✓ Domain Ready
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              Your custom domain is verified and SSL is active. The domain is fully functional with white-label branding.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
