'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect to the new signin page with any query parameters
    const returnTo = searchParams.get('return_to') || '/dashboard'
    const error = searchParams.get('error')
    
    let redirectUrl = '/signin'
    if (returnTo) {
      redirectUrl += `?return_to=${encodeURIComponent(returnTo)}`
    }
    if (error) {
      redirectUrl += returnTo ? '&' : '?'
      redirectUrl += `error=${encodeURIComponent(error)}`
    }
    
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginRedirect />
    </Suspense>
  )
}
