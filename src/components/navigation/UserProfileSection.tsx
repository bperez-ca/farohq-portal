'use client'

import { useUser, useClerk, useAuth } from '@clerk/nextjs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Settings, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UserProfileSectionProps {
  collapsed?: boolean
}

export function UserProfileSection({ collapsed = false }: UserProfileSectionProps) {
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut } = useClerk()
  const { isLoaded: authLoaded, getToken } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch user role from backend
  useEffect(() => {
    async function fetchUserRole() {
      if (!authLoaded || !userLoaded || !user) {
        return
      }

      try {
        const token = await getToken()
        if (!token) {
          return
        }

        const response = await fetch('/api/v1/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setUserRole(data.org_role || null)
        }
      } catch (error) {
        // Silently fail - role is optional
        console.error('Failed to fetch user role:', error)
      }
    }

    fetchUserRole()
  }, [authLoaded, userLoaded, user, getToken])

  if (!user) return null

  const initials = user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'U'
  const displayName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'User'
  const email = user.emailAddresses[0]?.emailAddress || ''
  
  // Format role for display (capitalize first letter)
  const displayRole = userRole 
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()
    : null

  const profileContent = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors',
        collapsed && 'justify-center'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.imageUrl} alt={displayName} />
        <AvatarFallback className="text-xs">{initials.toUpperCase()}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate tracking-tight">{displayName}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate leading-relaxed">{email}</p>
            {displayRole && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {displayRole}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>{profileContent}</DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium tracking-tight">{displayName}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">{email}</p>
                      {displayRole && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {displayRole}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="right">{displayName}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{profileContent}</DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
