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

interface UserProfileSectionProps {
  collapsed?: boolean
}

export function UserProfileSection({ collapsed = false }: UserProfileSectionProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!user) return null

  const initials = user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'U'
  const displayName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'User'
  const email = user.emailAddresses[0]?.emailAddress || ''

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
          <p className="text-xs text-muted-foreground truncate leading-relaxed">{email}</p>
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
                    <p className="text-xs text-muted-foreground leading-relaxed">{email}</p>
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
