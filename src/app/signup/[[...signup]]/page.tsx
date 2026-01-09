'use client'

import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'

// Component to sync user data after signup
function UserSyncHandler() {
  const { user, isLoaded: userLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function syncUser() {
      // Wait for user to be loaded
      if (!userLoaded || !user) {
        return
      }

      try {
        // Get Clerk token
        const token = await getToken()
        if (!token) {
          console.error('No token available for user sync')
          return
        }

        // Extract user data from Clerk
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

        // Call the sync endpoint
        const response = await fetch('/api/v1/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const error = await response.text()
          console.error('Failed to sync user:', error)
          // Don't block navigation on sync failure, just log it
        } else {
          console.log('User synced successfully')
        }
      } catch (error) {
        console.error('Error syncing user:', error)
        // Don't block navigation on sync failure
      }
    }

    syncUser()
  }, [user, userLoaded, getToken, router])

  return null
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700",
              }
            }}
            routing="path"
            path="/signup"
            signInUrl="/signin"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>

        {/* User Sync Handler - syncs user data after signup */}
        <UserSyncHandler />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
