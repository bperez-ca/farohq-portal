'use client'

import { SignIn } from '@clerk/nextjs'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  return (
    <AuthLayout title="Sign In">
      <SignIn
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
