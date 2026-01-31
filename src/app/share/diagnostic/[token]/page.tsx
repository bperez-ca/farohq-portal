'use client'

import { useParams } from 'next/navigation'
import SharedDiagnosticClient from './SharedDiagnosticClient'

/** UX-013: Shared Diagnostic. UX-015: Book call CTA. */
export default function SharedDiagnosticPage() {
  const params = useParams()
  const token = (params?.token as string) || ''

  return <SharedDiagnosticClient token={token} />
}
