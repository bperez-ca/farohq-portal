'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button, Input, Label } from '@/lib/ui'
import { BrandLogo } from '@/components/BrandLogo'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { AlertCircle, Loader2 } from 'lucide-react'

interface SignupFormProps {
  logoUrl?: string | null
  primaryColor?: string
  returnTo?: string
}

export function SignupForm({ logoUrl, primaryColor = '#2563eb', returnTo = '/dashboard' }: SignupFormProps) {
  const router = useRouter()
  const { signUp, isLoaded } = useAuth()
  const { theme, loading: isBrandThemeLoading } = useBrandTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const tier = theme?.tier
  const isFullWhiteLabel = tier === 'growth' || tier === 'scale'
  const displayLogoUrl = logoUrl || theme?.logo_url

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    try {
      setLoading(true)
      setError(null)

      // Use Clerk's signUp method directly
      const result = await signUp.create({
        emailAddress: email,
        password: password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      })

      if (result.status === 'complete') {
        // Sign up successful, redirect
        router.push(returnTo)
      } else {
        // Email verification required
        setError('Please check your email to verify your account.')
      }
    } catch (err: any) {
      console.error('Sign up error:', err)
      setError(err.errors?.[0]?.message || 'Failed to sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand Logo - Tier-based display */}
      {isFullWhiteLabel ? (
        // Full white-label tiers: always show logo area (agency logo or spinner)
        <div className="mb-6 flex justify-center">
          {isBrandThemeLoading || !displayLogoUrl ? (
            <Loader2 className="h-12 w-12 text-gray-500 animate-spin" />
          ) : (
            <BrandLogo
              logoUrl={displayLogoUrl}
              alt="Brand Logo"
              className="h-12 w-auto"
              showText={false}
            />
          )}
        </div>
      ) : (
        // Lower tiers: only show if logoUrl provided (Faro logo)
        logoUrl && (
          <div className="mb-6 flex justify-center">
            <BrandLogo
              logoUrl={logoUrl}
              alt="FaroHQ Logo"
              className="h-12 w-auto"
              showText={false}
            />
          </div>
        )
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            disabled={loading || !isLoaded}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            disabled={loading || !isLoaded}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading || !isLoaded}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading || !isLoaded}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Must be at least 8 characters
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading || !isLoaded}
        className="w-full"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing up...
          </>
        ) : (
          'Sign Up'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <a
          href="/signin"
          className="hover:underline"
          style={{ color: primaryColor }}
        >
          Already have an account? Sign in
        </a>
      </div>
    </form>
  )
}
