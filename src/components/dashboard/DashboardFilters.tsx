'use client'

import { useState } from 'react'
import { Button } from '@/lib/ui'
import { Card } from '@/lib/ui'
import { Filter } from 'lucide-react'

interface DashboardFiltersProps {
  onFilterChange?: (filters: FilterState) => void
}

export interface FilterState {
  clientId?: string
  dateRange?: '7d' | '30d' | '90d' | 'custom'
  locationId?: string
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '30d',
  })

  const handleDateRangeChange = (range: '7d' | '30d' | '90d' | 'custom') => {
    const newFilters = { ...filters, dateRange: range }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  return (
    <Card className="p-5 mb-8">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-muted-foreground opacity-70" />
          <span className="text-sm font-medium tracking-tight">Filters:</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">Date Range:</span>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={filters.dateRange === range ? 'default' : 'outline'}
                size="sm"
                className="h-9 px-4 font-medium text-sm border-2 shadow-sm hover:shadow transition-all"
                onClick={() => handleDateRangeChange(range)}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </Button>
            ))}
          </div>
        </div>
        {/* TODO: Add client and location filters when API is ready */}
      </div>
    </Card>
  )
}
