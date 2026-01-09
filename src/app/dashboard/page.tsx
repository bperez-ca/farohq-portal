'use client'

import { useUser, useAuth, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

export default function DashboardPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { isLoaded: authLoaded, signOut, getToken } = useAuth()
  const { organization, isLoaded: orgLoaded, membership } = useOrganization()
  const router = useRouter()
  const [backendInfo, setBackendInfo] = useState<BackendUserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync user data to backend and fetch backend-specific user info
  useEffect(() => {
    async function syncAndFetchUserInfo() {
      // Wait for Clerk, auth, and org to be loaded
      if (!authLoaded || !userLoaded || !orgLoaded) {
        return
      }

      // If user is not authenticated, redirect
      if (!user) {
        router.push('/signin')
        return
      }

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
          console.error('Failed to sync user data:', syncError)
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
        console.error('Failed to fetch backend user info:', err)
        // Don't set error for auth failures - we'll redirect instead
        if (err instanceof Error && !err.message.includes('401')) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    syncAndFetchUserInfo()
  }, [authLoaded, userLoaded, orgLoaded, user, getToken, router])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!authLoaded || !userLoaded || !orgLoaded || loading) {
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
  
  // Get organization info from Clerk (preferred) or backend
  const orgName = organization?.name || null
  const orgSlug = organization?.slug || backendInfo?.org_slug || null
  const orgId = organization?.id || backendInfo?.org_id || null
  const orgRole = membership?.role || backendInfo?.org_role || null
  const orgPublicMetadata = organization?.publicMetadata || null
  const orgImageUrl = organization?.imageUrl || null
  const orgCreatedAt = organization?.createdAt ? new Date(organization.createdAt) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {fullName || firstName || userEmail || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to FaroHQ
              </h2>
              <p className="text-gray-600 mb-8">
                You are successfully authenticated and can access the dashboard.
              </p>
              
              {/* User Info */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userEmail}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.id || backendInfo?.user_id || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">First Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{firstName || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lastName || 'Not set'}</dd>
                  </div>
                  {fullName && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{fullName}</dd>
                    </div>
                  )}
                  {imageUrl && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Profile Image</dt>
                      <dd className="mt-1">
                        <img 
                          src={imageUrl} 
                          alt="Profile" 
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      </dd>
                    </div>
                  )}
                  {phoneNumbers.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Phone Numbers</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {phoneNumbers.map((phone, idx) => (
                          <div key={idx}>{phone}</div>
                        ))}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {createdAt instanceof Date ? createdAt.toLocaleDateString() : createdAt || 'Unknown'}
                    </dd>
                  </div>
                  {lastSignInAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {lastSignInAt.toLocaleDateString()} {lastSignInAt.toLocaleTimeString()}
                      </dd>
                    </div>
                  )}
                  {updatedAt && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {updatedAt.toLocaleDateString()} {updatedAt.toLocaleTimeString()}
                      </dd>
                    </div>
                  )}
                  {orgId && (
                    <>
                      <div className="sm:col-span-2 border-t pt-4 mt-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Organization Information</h4>
                      </div>
                      {orgImageUrl && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Organization Logo</dt>
                          <dd className="mt-1">
                            <img 
                              src={orgImageUrl} 
                              alt="Organization Logo" 
                              className="h-16 w-16 rounded object-cover"
                            />
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Organization Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{orgName || 'Not set'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{orgId}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Organization Role</dt>
                        <dd className="mt-1 text-sm text-gray-900">{orgRole || 'Not set'}</dd>
                      </div>
                      {orgSlug && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Organization Slug</dt>
                          <dd className="mt-1 text-sm text-gray-900">{orgSlug}</dd>
                        </div>
                      )}
                      {orgCreatedAt && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Organization Created</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {orgCreatedAt.toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {orgPublicMetadata && Object.keys(orgPublicMetadata).length > 0 && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Organization Metadata</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(orgPublicMetadata, null, 2)}
                            </pre>
                          </dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </div>

              {/* Navigation */}
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/api/v1/brands"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium"
                >
                  View Brands API
                </Link>
                <Link
                  href="/api/v1/files"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium"
                >
                  View Files API
                </Link>
                <Link
                  href="/api/health"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md text-sm font-medium"
                >
                  Check API Health
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
