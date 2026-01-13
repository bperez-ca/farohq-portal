'use client'

import { useEffect } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { SignUp } from '@clerk/nextjs'

// Component to sync user data after signup
function UserSyncHandler() {
  const { user, isLoaded: userLoaded } = useUser()
  const { getToken } = useAuth()

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
  }, [user, userLoaded, getToken])

  return null
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          },
        }}
        redirectUrl="/onboarding"
        routing="path"
        signInUrl="/signin"
      />
      {/* User Sync Handler - syncs user data after signup */}
      <UserSyncHandler />
    </div>
  )
}
