'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { authenticatedFetch } from '@/lib/authenticated-fetch'

const ACTIVE_ORG_KEY = 'farohq_active_org_id'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface BackendUserInfo {
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

export interface OrganizationInfo {
  id: string
  name: string
  slug: string
  role: string
  created_at: string
  status?: string
  logo_url?: string
  logoUrl?: string
  tier?: string
}

interface AuthSessionContextType {
  userInfo: BackendUserInfo | null
  orgs: OrganizationInfo[]
  activeOrgId: string | null
  setActiveOrgId: (id: string) => void
  orgRole: string | null
  orgCount: number
  loading: boolean
  refetch: () => Promise<void>
}

const AuthSessionContext = createContext<AuthSessionContextType | null>(null)

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext)
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider')
  }
  return ctx
}

export function useAuthSessionOptional() {
  return useContext(AuthSessionContext)
}

interface AuthSessionProviderProps {
  children: React.ReactNode
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const { user, isLoaded: userLoaded } = useUser()
  const [userInfo, setUserInfo] = useState<BackendUserInfo | null>(null)
  const [orgs, setOrgs] = useState<OrganizationInfo[]>([])
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const setActiveOrgId = useCallback((id: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_ORG_KEY, id)
    }
    setActiveOrgIdState(id)
  }, [])

  const fetchSession = useCallback(async () => {
    if (!user) {
      setUserInfo(null)
      setOrgs([])
      setActiveOrgIdState(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Sync user data to backend (fire and forget)
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
      authenticatedFetch('/api/v1/users/sync', {
        method: 'POST',
        body: JSON.stringify(userData),
      }).catch(() => {})

      const [meRes, orgsRes] = await Promise.all([
        authenticatedFetch('/api/v1/auth/me'),
        authenticatedFetch('/api/v1/tenants/my-orgs'),
      ])

      if (meRes.ok) {
        const meData = await meRes.json()
        setUserInfo(meData)
      } else {
        setUserInfo(null)
      }

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json()
        const orgsList: OrganizationInfo[] = orgsData.orgs || []
        setOrgs(orgsList)

        const storedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_ORG_KEY) : null
        const validStored = storedId && orgsList.some((o: OrganizationInfo) => o.id === storedId)
        if (validStored) {
          setActiveOrgIdState(storedId)
        } else if (orgsList.length > 0) {
          const firstId = orgsList[0].id
          setActiveOrgIdState(firstId)
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_ORG_KEY, firstId)
          }
        } else {
          setActiveOrgIdState(null)
        }
      } else {
        setOrgs([])
        setActiveOrgIdState(null)
      }
      setLastFetch(Date.now())
    } catch (error) {
      console.error('AuthSessionProvider: failed to fetch session', error)
      setUserInfo(null)
      setOrgs([])
      setActiveOrgIdState(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!userLoaded) return

    if (!user) {
      setUserInfo(null)
      setOrgs([])
      setActiveOrgIdState(null)
      setLoading(false)
      return
    }

    const now = Date.now()
    if (lastFetch > 0 && now - lastFetch < CACHE_TTL_MS) {
      setLoading(false)
      return
    }

    fetchSession()
  }, [userLoaded, user, fetchSession, lastFetch])

  // Initialize activeOrgId from localStorage when orgs load
  useEffect(() => {
    if (orgs.length > 0 && !activeOrgId) {
      const storedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_ORG_KEY) : null
      const validStored = storedId && orgs.some((o) => o.id === storedId)
      if (validStored) {
        setActiveOrgIdState(storedId)
      } else {
        const firstId = orgs[0].id
        setActiveOrgIdState(firstId)
        if (typeof window !== 'undefined') {
          localStorage.setItem(ACTIVE_ORG_KEY, firstId)
        }
      }
    }
  }, [orgs, activeOrgId])

  const value: AuthSessionContextType = {
    userInfo,
    orgs,
    activeOrgId,
    setActiveOrgId,
    orgRole: userInfo?.org_role ?? (orgs.find((o) => o.id === activeOrgId)?.role) ?? null,
    orgCount: orgs.length,
    loading,
    refetch: fetchSession,
  }

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}
