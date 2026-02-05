'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser, useAuth } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/lib/ui'
import { Mail, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react'
import axios from 'axios'

interface InviteDetails {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  tenant?: {
    id: string
    name: string
    slug: string
  }
  branding?: {
    logo_url?: string
    favicon_url?: string
    primary_color?: string
    secondary_color?: string
    hide_powered_by?: boolean
    theme_json?: Record<string, any>
  }
}

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  const { user } = useUser()
  useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)
  const [status, setStatus] = useState<'pending' | 'accepted' | 'expired' | 'revoked' | null>(null)
  
  // Apply branding styles when invite details are loaded
  useEffect(() => {
    if (!inviteDetails?.branding) return

    const branding = inviteDetails.branding
    const root = document.documentElement

    // Apply primary color - set both brand-color and primary CSS variables
    if (branding.primary_color) {
      root.style.setProperty('--brand-primary', branding.primary_color)
      root.style.setProperty('--brand-color', branding.primary_color)
      // Convert hex to HSL for Tailwind's primary color
      // For now, set both hex and HSL formats
      const hex = branding.primary_color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0
      const l = (max + min) / 2
      
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      root.style.setProperty('--primary', `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`)
      // Also set hex for direct use
      root.style.setProperty('--primary-hex', branding.primary_color)
    }

    // Apply secondary color
    if (branding.secondary_color) {
      root.style.setProperty('--brand-secondary', branding.secondary_color)
    }

    // Apply favicon if available
    if (branding.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = branding.favicon_url
    }
  }, [inviteDetails])

  // Fetch invite details (public endpoint - no auth required)
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInviteDetails()
  }, [token])

  const fetchInviteDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch invite details from public endpoint
      const inviteResponse = await axios.get(`/api/v1/invites/${token}`)
      const invite: InviteDetails = inviteResponse.data

      setInviteDetails(invite)
      setStatus(invite.status as 'pending' | 'accepted' | 'expired' | 'revoked')

      // Show error immediately if expired or revoked (before authentication)
      if (invite.status === 'expired' || invite.status === 'revoked') {
        setLoading(false)
        return
      }

      setLoading(false)
    } catch (error: any) {
      console.error('Failed to fetch invite:', error)
      
      if (error.response?.status === 404) {
        setStatus('expired')
        setError('Invitation not found or has expired')
      } else {
        setError('Failed to load invitation. Please try again.')
      }
      setLoading(false)
    }
  }

  const handleAcceptInvitation = () => {
    // Redirect to processing page
    router.push(`/invites/accept/${token}/processing`)
  }

  const handleSignIn = () => {
    const returnUrl = `/invites/accept/${token}/processing`
    router.push(`/signin?redirect_url=${encodeURIComponent(returnUrl)}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading invitation...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              Invitation Accepted
            </CardTitle>
            <CardDescription>
              You have successfully joined {inviteDetails?.tenant?.name || 'the organization'}!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Redirecting to your dashboard...
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  // Show white-label error immediately if expired/revoked (before authentication)
  if (status === 'expired') {
    const tenantName = inviteDetails?.tenant?.name || 'the organization'
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
            {inviteDetails?.branding?.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={inviteDetails.branding.logo_url} 
                  alt={tenantName} 
                  className="max-h-16 max-w-[200px] object-contain"
                />
              </div>
            )}
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="w-6 h-6" />
              Invitation Expired
            </CardTitle>
            <CardDescription>
              This invitation has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Please contact the organization administrator at <strong>{tenantName}</strong> to request a new invitation.
            </p>
            <Button onClick={() => router.push('/signin')} variant="outline" className="w-full">
              Sign In
            </Button>
          </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'revoked') {
    const tenantName = inviteDetails?.tenant?.name || 'the organization'
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
            {inviteDetails?.branding?.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={inviteDetails.branding.logo_url} 
                  alt={tenantName} 
                  className="max-h-16 max-w-[200px] object-contain"
                />
              </div>
            )}
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-6 h-6" />
              Invitation Revoked
            </CardTitle>
            <CardDescription>
              This invitation has been revoked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              This invitation is no longer valid. Please contact the organization administrator at <strong>{tenantName}</strong> if you believe this is an error.
            </p>
            <Button onClick={() => router.push('/signin')} variant="outline" className="w-full">
              Sign In
            </Button>
          </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get branding styles
  const primaryColor = inviteDetails?.branding?.primary_color || undefined
  const logoUrl = inviteDetails?.branding?.logo_url
  const hidePoweredBy = inviteDetails?.branding?.hide_powered_by || false

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
          {logoUrl && (
            <div className="flex justify-center mb-4">
              <img 
                src={logoUrl} 
                alt={inviteDetails?.tenant?.name || 'Organization'} 
                className="max-h-16 max-w-[200px] object-contain"
              />
            </div>
          )}
          <CardTitle className="flex items-center gap-2">
            {!logoUrl && <Mail className="w-6 h-6" />}
            Accept Invitation
          </CardTitle>
          <CardDescription>
            {inviteDetails?.tenant?.name 
              ? `You've been invited to join ${inviteDetails.tenant.name}`
              : "You've been invited to join an organization"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}

          {inviteDetails && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Role:</span> {inviteDetails.role}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span> {inviteDetails.email}
              </p>
              {inviteDetails.tenant && (
                <p className="text-sm">
                  <span className="font-medium">Organization:</span> {inviteDetails.tenant.name}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {!user && (
              <Button 
                onClick={handleSignIn} 
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                Sign In to Accept
              </Button>
            )}
            
            {user && (
              <Button 
                onClick={handleAcceptInvitation}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                Accept Invitation
              </Button>
            )}
          </div>

          {!hidePoweredBy && (
            <p className="text-xs text-center text-muted-foreground mt-4 pt-4 border-t">
              Powered by FARO HQ
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
