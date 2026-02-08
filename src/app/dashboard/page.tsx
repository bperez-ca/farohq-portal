'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { safeLogError } from '@/lib/log-sanitizer'
import { useAuthSession } from '@/contexts/AuthSessionContext'

function DashboardContent() {
  const { user, isLoaded: userLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { orgCount, loading: sessionLoading, setActiveOrgId, refetch } = useAuthSession()
  const [validating, setValidating] = useState(false)

  const tenantIdFromQuery = searchParams?.get('tenantId')

  useEffect(() => {
    if (!userLoaded) return
    if (!user) {
      router.push('/signin')
      return
    }
  }, [userLoaded, user, router])

  useEffect(() => {
    if (!userLoaded || !user || !tenantIdFromQuery) return

    let cancelled = false
    setValidating(true)

    async function validate() {
      try {
        const res = await authenticatedFetch(
          `/api/v1/tenants/validate?tenantId=${encodeURIComponent(tenantIdFromQuery!)}`
        )
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          if (data.valid && data.hasAccess && data.hasRole) {
            setActiveOrgId(data.tenantId)
            await refetch()
            router.push(`/agency/dashboard?tenantId=${encodeURIComponent(data.tenantId)}`)
            return
          }
        }
      } catch (err) {
        if (!cancelled) safeLogError('Failed to validate tenantId', err)
      } finally {
        if (!cancelled) setValidating(false)
      }
    }

    validate()
    return () => { cancelled = true }
  }, [userLoaded, user, tenantIdFromQuery, setActiveOrgId, refetch, router])

  useEffect(() => {
    if (!userLoaded || !user || validating) return
    if (sessionLoading) return

    if (orgCount === 0) {
      router.push('/onboarding')
      return
    }
    if (orgCount > 0) {
      router.push('/agency/dashboard')
    }
  }, [userLoaded, user, sessionLoading, orgCount, validating, router])

  if (!userLoaded || sessionLoading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading…</div></div>}>
      <DashboardContent />
    </Suspense>
  )
}
