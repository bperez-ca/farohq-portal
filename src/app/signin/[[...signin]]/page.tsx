'use client'

import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useSearchParams } from 'next/navigation'

function SignInContent() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  return (
    <AuthLayout title="Sign In">
      <SignIn
        path="/signin"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          },
        }}
        redirectUrl={redirectUrl}
        routing="path"
        signUpUrl="/signup"
      />
    </AuthLayout>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading…</div></div>}>
      <SignInContent />
    </Suspense>
  )
}
