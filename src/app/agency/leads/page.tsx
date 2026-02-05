'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { Badge } from '@/components/ui/badge'
import { mockProspects, mockDiagnostics } from '@/lib/mock-data'
import type { Prospect, LeadStage } from '@/lib/types'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'
import { Plus, FileText, ExternalLink } from 'lucide-react'

/** UX-014: Agency pipeline table — stages, diagnostic status, bulk actions. */

type DiagStatus = 'Not run' | 'Ready' | 'Shared' | 'Viewed'

function getDiagStatus(p: Prospect): { status: DiagStatus; viewCount?: number } {
  if (!p.diagnosticId) return { status: 'Not run' }
  if (p.stage === 'Diagnostic Ready') return { status: 'Ready' }
  if (p.stage === 'Invited') return { status: 'Shared' }
  if (p.stage === 'Trialing' || p.stage === 'Active Client') {
    const d = mockDiagnostics.find((x) => x.prospectId === p.id)
    return { status: 'Viewed', viewCount: d?.openCount ?? 0 }
  }
  return { status: 'Ready' }
}

const stageColors: Record<LeadStage, string> = {
  Prospect: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  'Diagnostic Pending': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  'Diagnostic Ready': 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  Invited: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  Trialing: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  'Active Client': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'Churn Risk': 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  Churned: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

const diagStatusLabels: Record<DiagStatus, string> = {
  'Not run': 'Not run',
  'Ready': 'Ready',
  'Shared': 'Shared',
  'Viewed': 'Viewed',
}

export default function AgencyLeadsPage() {
  const router = useRouter()
  const { theme } = useBrandTheme()
  const brandColor = theme?.primary_color || '#2563eb'
  const [prospects] = useState<Prospect[]>(mockProspects)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    if (selected.size === prospects.length) setSelected(new Set())
    else setSelected(new Set(prospects.map((p) => p.id)))
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Agency', href: '/agency/dashboard' },
          { label: 'Leads' },
        ]}
        title="Leads"
        subtitle="Prospect pipeline and diagnostics"
        actions={
          <Button
            size="sm"
            className="hidden md:inline-flex gap-2"
            style={{ backgroundColor: brandColor }}
            onClick={() => {}}
          >
            <Plus className="w-4 h-4" />
            Add prospect
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10 bg-muted/30">
                  <th className="text-left py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === prospects.length && prospects.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-4 px-4 font-medium">Business</th>
                  <th className="text-left py-4 px-4 font-medium">Stage</th>
                  <th className="text-left py-4 px-4 font-medium">Diagnostic</th>
                  <th className="text-left py-4 px-4 font-medium">Last activity</th>
                  <th className="text-right py-4 px-4 font-medium">Est. value</th>
                  <th className="text-right py-4 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => {
                  const { status: diagStatus, viewCount } = getDiagStatus(p)
                  const diag = mockDiagnostics.find((d) => d.prospectId === p.id)
                  const shareLink = diag?.shareToken ? `/share/diagnostic/${diag.shareToken}` : null

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-black/5 dark:border-white/10 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggle(p.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {p.industry} · {p.city}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={stageColors[p.stage]}>
                          {p.stage}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">
                          {diagStatusLabels[diagStatus]}
                          {diagStatus === 'Viewed' && viewCount != null && ` (${viewCount})`}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{p.updatedAt}</td>
                      <td className="py-4 px-4 text-right font-medium">
                        {p.estMonthlyValue != null ? `$${p.estMonthlyValue}/mo` : '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {shareLink && (
                            <Link href={shareLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Share
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            style={{ borderColor: brandColor, color: brandColor }}
                            onClick={() => router.push('/business/dashboard')}
                          >
                            View as client
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
