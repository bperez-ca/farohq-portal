'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser, useAuth } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface Invite {
  id: string
  email: string
  role: string
  token: string
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
  }
}

export default function ProcessingInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  const { user, isLoaded: userLoaded } = useUser()
  const { isLoaded: authLoaded } = useAuth()

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string>('Processing your invitation...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    // Wait for auth to load
    if (!authLoaded || !userLoaded) {
      return
    }

    // If not authenticated, redirect to sign in
    if (!user) {
      const returnUrl = `/invites/accept/${token}/processing`
      router.push(`/signin?redirect_url=${encodeURIComponent(returnUrl)}`)
      return
    }

    // User is authenticated, process the invite
    processInvite()
  }, [token, authLoaded, userLoaded, user, router])

  const processInvite = async () => {
    try {
      setLoading(true)
      setError(null)

      const userEmail = user?.emailAddresses?.[0]?.emailAddress
      if (!userEmail) {
        setError('Unable to retrieve your email address. Please try again.')
        setLoading(false)
        return
      }

      // Step 1: Sync user (create if doesn't exist in DB)
      // This ensures the user exists in our database before proceeding
      setMessage('Syncing your account...')
      try {
        const syncResponse = await axios.post(
          '/api/v1/users/sync',
          {
            clerk_user_id: user.id,
            email: userEmail,
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            full_name: user.fullName || '',
            image_url: user.imageUrl || '',
            phone_numbers: user.phoneNumbers?.map(p => p.phoneNumber) || [],
            last_sign_in_at: user.lastSignInAt ? Math.floor(new Date(user.lastSignInAt).getTime() / 1000) : null,
          },
          { withCredentials: true }
        )
        // User synced successfully, continue
      } catch (syncError: any) {
        // If sync fails, log but continue - user might already exist
        console.warn('User sync warning:', syncError)
        // Continue to check for invitations
      }

      // Step 2: Check if user has existing tenants
      setMessage('Checking your organizations...')
      try {
        const orgsResponse = await axios.get('/api/v1/tenants/my-orgs', {
          withCredentials: true,
        })

        const orgsData = orgsResponse.data
        const orgCount = orgsData.count || (orgsData.orgs || []).length

        // If user has tenant, redirect to dashboard (skip connect stepper)
        if (orgCount > 0) {
          const firstOrg = orgsData.orgs?.[0]
          if (firstOrg?.id) {
            localStorage.setItem('farohq_active_org_id', firstOrg.id)
          }
          setMessage('You already have an organization. Redirecting to dashboard...')
          setTimeout(() => router.push('/dashboard'), 1000)
          return
        }
      } catch (orgsError: any) {
        // If error (shouldn't happen after fix, but handle gracefully), continue
        console.warn('Check orgs warning:', orgsError)
      }

      // Step 3: Find invitation by email (now that user is synced)
      setMessage('Finding your invitation...')
      const invitesResponse = await axios.get(`/api/v1/invites/by-email?email=${encodeURIComponent(userEmail)}`, {
        withCredentials: true,
      })

      const invites: Invite[] = invitesResponse.data.invites || []

      // Step 4: Auto-select invite matching the token from URL
      const matchingInvite = invites.find(inv => inv.token === token)

      if (!matchingInvite) {
        // No invite found for this email, redirect to onboarding
        setMessage('No pending invitation found. Redirecting to onboarding...')
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
        return
      }

      // Step 5: Check invite status
      if (matchingInvite.status === 'expired') {
        const tenantName = matchingInvite.tenant?.name || 'the organization'
        setError(`This invitation has expired. Please contact the administrator at ${tenantName} to request a new invitation.`)
        setLoading(false)
        return
      }

      if (matchingInvite.status === 'revoked') {
        const tenantName = matchingInvite.tenant?.name || 'the organization'
        setError(`This invitation has been revoked. Please contact the administrator at ${tenantName} if you believe this is an error.`)
        setLoading(false)
        return
      }

      if (matchingInvite.status !== 'pending') {
        // Invite already accepted - set tenant ID, redirect to connect or dashboard
        if (matchingInvite.tenant?.id) {
          localStorage.setItem('farohq_active_org_id', matchingInvite.tenant.id)
        }
        setMessage('This invitation has already been accepted. Redirecting...')
        setTimeout(() => {
          router.push(`/invites/accept/${token}/connect`)
        }, 1000)
        return
      }

      // Step 6: Accept the pending invite
      setMessage('Accepting your invitation...')

      try {
        await axios.post(
          '/api/v1/invites/accept',
          {
            token: token,
          },
          {
            withCredentials: true,
          }
        )

        // Successfully accepted - set tenant ID in localStorage before redirect for branding
        if (matchingInvite.tenant?.id) {
          localStorage.setItem('farohq_active_org_id', matchingInvite.tenant.id)
        }

        // UX-002: Redirect to connect stepper (Google/WhatsApp), then dashboard
        setMessage('Invitation accepted! Redirecting to connect your channels...')
        setTimeout(() => {
          router.push(`/invites/accept/${token}/connect`)
        }, 1000)
      } catch (acceptError: any) {
        console.error('Failed to accept invite:', acceptError)
        
        if (acceptError.response?.status === 400) {
          const errorMessage = acceptError.response.data?.error || acceptError.response.data?.details || acceptError.response.data
          if (typeof errorMessage === 'string') {
            if (errorMessage.includes('expired')) {
              const tenantName = matchingInvite.tenant?.name || 'the organization'
              setError(`This invitation has expired. Please contact the administrator at ${tenantName} to request a new invitation.`)
            } else if (errorMessage.includes('revoked')) {
              const tenantName = matchingInvite.tenant?.name || 'the organization'
              setError(`This invitation has been revoked. Please contact the administrator at ${tenantName} if you believe this is an error.`)
            } else {
              setError(errorMessage)
            }
          } else {
            setError('Failed to accept invitation. Please try again.')
          }
        } else {
          setError('Failed to accept invitation. Please try again.')
        }
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Failed to process invite:', error)
      
      if (error.response?.status === 404 || error.response?.status === 401) {
        // No invites found or not authenticated - redirect to onboarding
        setMessage('No pending invitation found. Redirecting to onboarding...')
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
        return
      }

      setError('Failed to process invitation. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Processing Invitation
          </CardTitle>
          <CardDescription>
            Please wait while we process your invitation...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
