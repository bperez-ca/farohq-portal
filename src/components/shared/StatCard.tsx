'use client'

import { Button } from '@farohq/ui'
import { Card } from '@farohq/ui'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { LucideIcon } from 'lucide-react'
import { KPITooltip } from './KPITooltip'

interface StatCardProps {
  title?: string
  bigNumber?: string | number
  subtext?: string
  label?: string
  value?: string
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
  color?: 'green' | 'yellow' | 'red'
  tooltip?: string
  optionalCTA?: {
    label: string
    onClick: () => void
  }
}

export function StatCard({
  title,
  bigNumber,
  subtext,
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  color,
  tooltip,
  optionalCTA,
}: StatCardProps) {
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'

  const displayTitle = title || label
  const displayValue = bigNumber !== undefined ? bigNumber : value
  const displaySubtext = subtext || subtitle

  const variantClasses = {
    default: '',
    success: 'border-green-200 dark:border-green-900',
    warning: 'border-yellow-200 dark:border-yellow-900',
    danger: 'border-red-200 dark:border-red-900',
  }

  const colorClasses = color
    ? {
        green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30',
        yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30',
        red: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30',
      }[color]
    : ''

  const numberColorClasses = color
    ? {
        green: 'text-green-700 dark:text-green-300',
        yellow: 'text-yellow-700 dark:text-yellow-300',
        red: 'text-rose-700 dark:text-rose-300',
      }[color]
    : ''

  return (
    <Card className={`p-6 rounded-xl shadow-sm ${color ? colorClasses : variantClasses[variant]}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{displayTitle}</h3>
            {tooltip && <KPITooltip content={tooltip} />}
          </div>
          {Icon && <Icon className="w-5 h-5 text-muted-foreground opacity-70" />}
        </div>
        <div className={`text-4xl md:text-5xl font-semibold tracking-tight ${numberColorClasses || 'accent-heading'}`}>
          {displayValue}
        </div>
        {displaySubtext && <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed">{displaySubtext}</p>}
        {optionalCTA && (
          <Button
            onClick={optionalCTA.onClick}
            style={{ backgroundColor: brandColor }}
            className="mt-4 w-full h-10 font-medium text-sm shadow-sm hover:shadow transition-all"
          >
            {optionalCTA.label}
          </Button>
        )}
      </div>
    </Card>
  )
}
