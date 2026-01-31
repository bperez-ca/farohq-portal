'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
}

export function NavItem({ href, icon: Icon, label, collapsed = false }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)
  const { theme } = useBrandTheme()
  
  // Get brand colors from theme or use defaults
  const brandColor = theme?.primary_color || '#2563eb'
  const secondaryColor = theme?.secondary_color || '#6b7280'
  // Create semi-transparent background color (15% opacity)
  const activeBgColor = `${brandColor}15`

  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all tracking-tight',
        isActive
          ? 'text-foreground'
          : 'hover:text-foreground hover:bg-accent/50',
        collapsed && 'justify-center'
      )}
      style={
        isActive && !collapsed
          ? {
              backgroundColor: activeBgColor,
              color: brandColor,
            }
          : !isActive
          ? {
              color: secondaryColor,
            }
          : {}
      }
    >
      <Icon 
        className="w-5 h-5 flex-shrink-0" 
        style={isActive ? { color: brandColor } : { color: secondaryColor }} 
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}
