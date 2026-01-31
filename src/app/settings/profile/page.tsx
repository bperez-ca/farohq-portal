'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { OrgSelector } from '@/components/OrgSelector'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui'
import { Button } from '@/lib/ui'

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

export default function ProfilePage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { isLoaded: authLoaded, signOut, getToken } = useAuth()
  const router = useRouter()
  const [backendInfo, setBackendInfo] = useState<BackendUserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgCount, setOrgCount] = useState<number | null>(null)
  const [orgs, setOrgs] = useState<OrganizationInfo[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationInfo | null>(null)

  useEffect(() => {
    async function syncAndFetchUserInfo() {
      if (!authLoaded || !userLoaded) {
        return
      }

      if (!user) {
        router.push('/signin')
        return
      }

      try {
        setLoading(true)
        setError(null)

        const token = await getToken()
        if (!token) {
          router.push('/signin')
          return
        }

        try {
          const userData = {
            clerk_user_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || '',
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            full_name: user.fullName || '',
            image_url: user.imageUrl || '',
            phone_numbers: user.phoneNumbers?.map((p) => p.phoneNumber) || [],
            last_sign_in_at: user.lastSignInAt
              ? Math.floor(new Date(user.lastSignInAt).getTime() / 1000)
              : null,
          }

          await fetch('/api/v1/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          })
        } catch (syncError) {
          console.error('Failed to sync user data:', syncError)
        }

        const response = await fetch('/api/v1/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/signin')
            return
          }
          throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setBackendInfo(data)
      } catch (err) {
        console.error('Failed to fetch backend user info:', err)
        if (err instanceof Error && !err.message.includes('401')) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    syncAndFetchUserInfo()
  }, [authLoaded, userLoaded, user, getToken, router])

  useEffect(() => {
    async function fetchOrgs() {
      if (!userLoaded || !user) {
        return
      }

      try {
        const response = await fetch('/api/v1/tenants/my-orgs', {
          credentials: 'include',
        })

        if (!response.ok) {
          console.error('Failed to fetch orgs: HTTP', response.status, await response.text().catch(() => ''))
          return
        }

        const data = await response.json()
        const orgsList: OrganizationInfo[] = data.orgs || []
        setOrgs(orgsList)
        setOrgCount(data.count || orgsList.length)

        const activeOrgId = localStorage.getItem('farohq_active_org_id')
        const activeOrg = activeOrgId ? orgsList.find((org) => org.id === activeOrgId) : orgsList[0]
        const selectedOrg = activeOrg || orgsList[0]
        setCurrentOrg(selectedOrg)
      } catch (error) {
        console.error('Failed to fetch orgs:', error)
      }
    }

    fetchOrgs()
  }, [userLoaded, user, router])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Logout failed:', error)
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

  const formatDate = (timestamp: number | string | Date | null | undefined): string => {
    if (!timestamp) return 'Unknown'
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString()
      }
      const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
      return date.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  const userEmail = user.emailAddresses?.[0]?.emailAddress || backendInfo?.email || 'No email'
  const firstName = user.firstName || backendInfo?.first_name || null
  const lastName = user.lastName || backendInfo?.last_name || null
  const fullName =
    user.fullName || (firstName && lastName ? `${firstName} ${lastName}` : null) || backendInfo?.name || null
  const imageUrl = user.imageUrl || null
  const phoneNumbers = user.phoneNumbers?.map((p) => p.phoneNumber) || []
  const createdAt = user.createdAt ? new Date(user.createdAt) : backendInfo?.created_at ? formatDate(backendInfo.created_at) : null
  const lastSignInAt = user.lastSignInAt ? new Date(user.lastSignInAt) : null
  const updatedAt = user.updatedAt ? new Date(user.updatedAt) : null

  const displayOrg = currentOrg || (orgs.length > 0 ? orgs[0] : null)
  const orgName = displayOrg?.name || null
  const orgSlug = displayOrg?.slug || backendInfo?.org_slug || null
  const orgId = displayOrg?.id || backendInfo?.org_id || null
  const orgRole = displayOrg?.role || backendInfo?.org_role || null
  const orgCreatedAt = displayOrg?.created_at ? new Date(displayOrg.created_at) : null

  return (
    <div className="min-h-screen">
      <PageHeader
        breadcrumbs={[{ label: 'Settings', href: '/settings/profile' }, { label: 'Profile' }]}
        title="Profile"
        subtitle="Manage your account information and preferences"
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="tracking-tight">User Information</CardTitle>
              <CardDescription className="leading-relaxed">Your personal account details</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Email</dt>
                  <dd className="text-sm text-foreground font-medium">{userEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">User ID</dt>
                  <dd className="text-sm text-foreground font-medium">{user.id || backendInfo?.user_id || 'Not available'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">First Name</dt>
                  <dd className="text-sm text-foreground font-medium">{firstName || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Last Name</dt>
                  <dd className="text-sm text-foreground font-medium">{lastName || 'Not set'}</dd>
                </div>
                {fullName && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                    <dd className="mt-1 text-sm text-foreground">{fullName}</dd>
                  </div>
                )}
                {imageUrl && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Profile Image</dt>
                    <dd className="mt-1">
                      <img src={imageUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
                    </dd>
                  </div>
                )}
                {phoneNumbers.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Phone Numbers</dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {phoneNumbers.map((phone, idx) => (
                        <div key={idx}>{phone}</div>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {createdAt instanceof Date ? createdAt.toLocaleDateString() : createdAt || 'Unknown'}
                  </dd>
                </div>
                {lastSignInAt && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Last Sign In</dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {lastSignInAt.toLocaleDateString()} {lastSignInAt.toLocaleTimeString()}
                    </dd>
                  </div>
                )}
                {updatedAt && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {updatedAt.toLocaleDateString()} {updatedAt.toLocaleTimeString()}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Organization Information Card */}
          {(currentOrg || orgs.length > 0) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="tracking-tight">Organization Information</CardTitle>
                    <CardDescription className="leading-relaxed">Your agency and organization details</CardDescription>
                  </div>
                  {orgCount !== null && orgCount > 1 && <OrgSelector />}
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Organization Name</dt>
                    <dd className="text-sm text-foreground font-medium">{orgName || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Organization ID</dt>
                    <dd className="text-sm text-foreground font-medium">{orgId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Organization Role</dt>
                    <dd className="text-sm text-foreground font-medium">{orgRole || 'Not set'}</dd>
                  </div>
                  {orgSlug && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Organization Slug</dt>
                      <dd className="text-sm text-foreground font-medium">{orgSlug}</dd>
                    </div>
                  )}
                  {orgCreatedAt && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight">Organization Created</dt>
                      <dd className="text-sm text-foreground font-medium">{orgCreatedAt.toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
