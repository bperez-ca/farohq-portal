'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { OrgSelector } from '@/components/OrgSelector'
import { safeLogError } from '@/lib/log-sanitizer'

interface BackendUserInfo {
  user_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  name: string | null
  created_at: number | string | null
  org_id: string | null
  org_slug: string | null
  org_role: string | null
}

interface OrganizationInfo {
  id: string
  name: string
  slug: string
  role: string
  created_at: string
}

export default function DashboardPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { isLoaded: authLoaded, signOut, getToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [backendInfo, setBackendInfo] = useState<BackendUserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgCount, setOrgCount] = useState<number | null>(null)
  const [orgs, setOrgs] = useState<OrganizationInfo[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationInfo | null>(null)
  const [validatedTenantId, setValidatedTenantId] = useState<string | null>(null)

  // Sync user data to backend and fetch backend-specific user info
  useEffect(() => {
    async function syncAndFetchUserInfo() {
      // Wait for Clerk and auth to be loaded
      if (!authLoaded || !userLoaded) {
        return
      }

      // If user is not authenticated, redirect
      if (!user) {
        router.push('/signin')
        return
      }

      // Note: Org count check is now done in the separate useEffect hook
      // This avoids duplicate API calls and ensures org data is available

      try {
        setLoading(true)
        setError(null)
        
        // Get Clerk token
        const token = await getToken()
        if (!token) {
          router.push('/signin')
          return
        }

        // First, sync user data to backend
        try {
          const userData = {
            clerk_user_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || '',
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            full_name: user.fullName || '',
            image_url: user.imageUrl || '',
            phone_numbers: user.phoneNumbers?.map(p => p.phoneNumber) || [],
            last_sign_in_at: user.lastSignInAt ? Math.floor(new Date(user.lastSignInAt).getTime() / 1000) : null,
          }

          await fetch('/api/v1/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          })
          // Don't fail if sync fails, just log it
        } catch (syncError) {
          safeLogError('Failed to sync user data', syncError)
          // Continue to fetch user info even if sync fails
        }

        // Then fetch backend-specific user info
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include', // Include cookies for server-side auth
        })

        if (!response.ok) {
          // If unauthorized, don't show error - just redirect
          if (response.status === 401) {
            router.push('/signin')
            return
          }
          throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setBackendInfo(data)
      } catch (err) {
        safeLogError('Failed to fetch backend user info', err)
        // Don't set error for auth failures - we'll redirect instead
        if (err instanceof Error && !err.message.includes('401')) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    syncAndFetchUserInfo()
  }, [authLoaded, userLoaded, user, getToken, router])

  // Fetch organizations for org selector and display
  useEffect(() => {
    async function fetchOrgs() {
      if (!userLoaded || !user) {
        return
      }

      try {
        // Check for tenantId in query params
        const tenantIdFromQuery = searchParams?.get('tenantId')
        
        // If tenantId is provided, validate it first
        if (tenantIdFromQuery) {
          try {
            const validateResponse = await fetch(
              `/api/v1/tenants/validate?tenantId=${encodeURIComponent(tenantIdFromQuery)}`,
              { credentials: 'include' }
            )
            
            if (validateResponse.ok) {
              const validateData = await validateResponse.json()
              if (validateData.valid && validateData.hasAccess && validateData.hasRole) {
                setValidatedTenantId(validateData.tenantId)
                // Store in localStorage for future use
                localStorage.setItem('farohq_active_org_id', validateData.tenantId)
                // Redirect to agency dashboard with validated tenantId
                router.push(`/agency/dashboard?tenantId=${encodeURIComponent(validateData.tenantId)}`)
                return
              }
            }
          } catch (validateError) {
            safeLogError('Failed to validate tenantId', validateError)
            // Continue with normal flow if validation fails
          }
        } else {
          // If no tenantId in query params, check headers via API
          try {
            const validateResponse = await fetch(
              '/api/v1/tenants/validate',
              { credentials: 'include' }
            )
            
            if (validateResponse.ok) {
              const validateData = await validateResponse.json()
              if (validateData.valid && validateData.hasAccess && validateData.hasRole && validateData.tenantId) {
                setValidatedTenantId(validateData.tenantId)
                // Store in localStorage for future use
                localStorage.setItem('farohq_active_org_id', validateData.tenantId)
                // Redirect to agency dashboard with validated tenantId
                router.push(`/agency/dashboard?tenantId=${encodeURIComponent(validateData.tenantId)}`)
                return
              }
            }
          } catch (validateError) {
            safeLogError('Failed to validate tenantId from headers', validateError)
            // Continue with normal flow if validation fails
          }
        }

        const response = await fetch('/api/v1/tenants/my-orgs', {
          credentials: 'include',
        })
        
        if (!response.ok) {
          console.error('Failed to fetch orgs: HTTP', response.status, await response.text().catch(() => ''))
          return
        }
        
        const data = await response.json()
        console.log('Fetched orgs data:', data) // Debug log
        
        const orgsList: OrganizationInfo[] = data.orgs || []
        setOrgs(orgsList)
        setOrgCount(data.count || orgsList.length)
        
        // Check if user has any orgs - if not, redirect to onboarding
        if (orgsList.length === 0) {
          router.push('/onboarding')
          return
        }
        
        // Set current org (use first org, or can be enhanced to use active org from localStorage)
        // Try to get active org from localStorage, otherwise use first org
        const activeOrgId = localStorage.getItem('farohq_active_org_id')
        const activeOrg = activeOrgId 
          ? orgsList.find(org => org.id === activeOrgId) 
          : orgsList[0]
        const selectedOrg = activeOrg || orgsList[0]
        setCurrentOrg(selectedOrg)
        
        // Redirect to agency dashboard if user has orgs
        router.push('/agency/dashboard')
      } catch (error) {
        console.error('Failed to fetch orgs:', error)
        // Don't redirect on error - let user stay on dashboard
      }
    }

    fetchOrgs()
  }, [userLoaded, user, router, searchParams])

  // Redirect to agency dashboard if user has orgs (only if no tenantId validation is in progress)
  // This must be before any conditional returns to maintain hook order
  useEffect(() => {
    if (validatedTenantId) {
      // Already handled in fetchOrgs, don't redirect again
      return
    }
    
    if (!loading && (orgs.length > 0 || currentOrg)) {
      router.push('/agency/dashboard')
    } else if (!loading && orgs.length === 0 && userLoaded && user) {
      router.push('/onboarding')
    }
  }, [loading, orgs, currentOrg, router, validatedTenantId, userLoaded, user])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      safeLogError('Logout failed', error)
    }
  }

  if (!authLoaded || !userLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Format created_at timestamp if available
  const formatDate = (timestamp: number | string | Date | null | undefined): string => {
    if (!timestamp) return 'Unknown'
    try {
      // Handle Date objects directly
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString()
      }
      // Handle numeric timestamps (Unix seconds)
      const date = typeof timestamp === 'number' 
        ? new Date(timestamp * 1000)
        : new Date(timestamp)
      return date.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  // Get user email from Clerk (primary email)
  const userEmail = user.emailAddresses?.[0]?.emailAddress || backendInfo?.email || 'No email'
  
  // Get user name from Clerk (preferred) or fallback to backend
  const firstName = user.firstName || backendInfo?.first_name || null
  const lastName = user.lastName || backendInfo?.last_name || null
  const fullName = user.fullName || (firstName && lastName ? `${firstName} ${lastName}` : null) || backendInfo?.name || null
  
  // Get user profile image
  const imageUrl = user.imageUrl || null
  
  // Get phone numbers from Clerk
  const phoneNumbers = user.phoneNumbers?.map(p => p.phoneNumber) || []
  
  // Get created_at from Clerk (preferred) or backend
  const createdAt = user.createdAt ? new Date(user.createdAt) : (backendInfo?.created_at ? formatDate(backendInfo.created_at) : null)
  
  // Get last sign-in time
  const lastSignInAt = user.lastSignInAt ? new Date(user.lastSignInAt) : null
  const updatedAt = user.updatedAt ? new Date(user.updatedAt) : null
  
  // Get organization info from backend (prefer currentOrg from my-orgs endpoint)
  // Fall back to first org in list if currentOrg not set yet
  const displayOrg = currentOrg || (orgs.length > 0 ? orgs[0] : null)
  const orgName = displayOrg?.name || null
  const orgSlug = displayOrg?.slug || backendInfo?.org_slug || null
  const orgId = displayOrg?.id || backendInfo?.org_id || null
  const orgRole = displayOrg?.role || backendInfo?.org_role || null
  const orgPublicMetadata = null // Not in backend API response yet, can be added if needed
  const orgImageUrl = null // Not in backend API response yet, can be added if needed
  const orgCreatedAt = displayOrg?.created_at ? new Date(displayOrg.created_at) : null

  // This page now redirects to agency dashboard
  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
