'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/signin')
    return null
  }

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
                Welcome, {user.emailAddresses[0]?.emailAddress || user.firstName || 'User'}
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
                Welcome to Local Visibility OS
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
                      {user.emailAddresses[0]?.emailAddress || 'No email'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">First Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.firstName || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.lastName || 'Not set'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </dd>
                  </div>
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
