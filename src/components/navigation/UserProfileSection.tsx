'use client'

import { useUser, useClerk } from '@clerk/nextjs'
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
import { useAuthSession } from '@/contexts/AuthSessionContext'

interface UserProfileSectionProps {
  collapsed?: boolean
  /** Agency tier (e.g. starter, growth, scale) - displayed as badge when in agency context */
  tier?: string
}

export function UserProfileSection({ collapsed = false, tier }: UserProfileSectionProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { orgRole: userRole } = useAuthSession()

  if (!user) return null

  const initials = user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'U'
  const displayName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'User'
  const email = user.emailAddresses[0]?.emailAddress || ''
  
  // Format role for display (capitalize first letter)
  const displayRole = userRole 
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()
    : null

  // Format tier for display (capitalize)
  const displayTier = tier 
    ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground truncate leading-relaxed">{email}</p>
            {displayRole && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {displayRole}
              </span>
            )}
            {displayTier && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium" title="Agency plan">
                {displayTier}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground leading-relaxed">{email}</p>
                      {displayRole && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {displayRole}
                        </span>
                      )}
                      {displayTier && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {displayTier}
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
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">{email}</p>
              {displayTier && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                  {displayTier}
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
  )
}
