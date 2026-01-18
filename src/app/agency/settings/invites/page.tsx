'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@farohq/ui'
import { Mail, Plus, X, Trash2, AlertCircle, CheckCircle2, Clock, UserX } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { SettingsNav } from '@/components/settings/SettingsNav'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'staff', 'viewer', 'client_viewer'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface Invite {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  accepted_at?: string
  revoked_at?: string
  created_at: string
  created_by: string
}

interface TenantData {
  id: string
  name: string
  slug: string
}

export default function InvitesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [tenantData, setTenantData] = useState<TenantData | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  })

  // Load invites and tenant data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get tenant ID from context (use my-orgs endpoint - same pattern as brands)
      const orgsResponse = await axios.get('/api/v1/tenants/my-orgs', {
        withCredentials: true,
      })
      
      let tenantId: string | null = null
      
      if (orgsResponse.data?.orgs?.length > 0) {
        // Get active org from query params, header, or use first org
        const urlParams = new URLSearchParams(window.location.search)
        const orgIdParam = urlParams.get('org-id') || urlParams.get('orgId')
        const orgSlugParam = urlParams.get('slug')
        
        let activeOrg = orgsResponse.data.orgs[0]
        
        // Priority: query param org-id > query param slug > first org
        if (orgIdParam) {
          activeOrg = orgsResponse.data.orgs.find((org: any) => org.id === orgIdParam) || orgsResponse.data.orgs[0]
        } else if (orgSlugParam) {
          activeOrg = orgsResponse.data.orgs.find((org: any) => org.slug === orgSlugParam) || orgsResponse.data.orgs[0]
        }
        
        tenantId = activeOrg.id
        setTenantData({
          id: activeOrg.id,
          name: activeOrg.name,
          slug: activeOrg.slug,
        })
      }

      if (!tenantId) {
        setError('No organization found. Please ensure you are part of an organization.')
        return
      }

      // Load tenant data if not already loaded
      if (!tenantData) {
        try {
          const tenantResponse = await axios.get(`/api/v1/tenants/${tenantId}`, {
            withCredentials: true,
          })
          if (tenantResponse.data) {
            setTenantData(tenantResponse.data)
          }
        } catch (err) {
          console.warn('Failed to load tenant details, using org data')
        }
      }

      // Load invites
      const invitesResponse = await axios.get(`/api/v1/tenants/${tenantId}/invites`, {
        withCredentials: true,
      })

      if (invitesResponse.data?.invites) {
        setInvites(invitesResponse.data.invites)
      }
    } catch (error: any) {
      console.error('Failed to load invites:', error)
      setError(error.response?.data?.error || 'Failed to load invites. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (formData: InviteFormData) => {
    if (!tenantData) {
      setError('Tenant data not loaded')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const response = await axios.post(
        `/api/v1/tenants/${tenantData.id}/invites`,
        {
          email: formData.email,
          role: formData.role,
        },
        {
          withCredentials: true,
        }
      )

      setSuccess(`Invitation sent to ${formData.email}`)
      reset()
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to create invite:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to send invitation. Please try again.'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (inviteId: string) => {
    if (!tenantData) return

    try {
      setRevoking(inviteId)
      setError(null)

      await axios.delete(`/api/v1/tenants/${tenantData.id}/invites/${inviteId}`, {
        withCredentials: true,
      })

      setSuccess('Invitation revoked successfully')
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to revoke invite:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to revoke invitation. Please try again.'
      setError(errorMessage)
    } finally {
      setRevoking(null)
    }
  }

  const handleDelete = async (inviteId: string) => {
    if (!tenantData) return

    // Confirm permanent deletion
    if (!confirm('Are you sure you want to permanently delete this invitation? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(inviteId)
      setError(null)

      await axios.delete(`/api/v1/tenants/${tenantData.id}/invites/${inviteId}?permanent=true`, {
        withCredentials: true,
      })

      setSuccess('Invitation deleted permanently')
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to delete invite:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to delete invitation. Please try again.'
      setError(errorMessage)
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (invite: Invite) => {
    switch (invite.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            <AlertCircle className="w-3 h-3" />
            Expired
          </span>
        )
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
            <UserX className="w-3 h-3" />
            Revoked
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading invites...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-4">
          Manage your organization settings and team members.
        </p>
      </div>

      <SettingsNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-600 dark:text-green-400">{success}</span>
        </div>
      )}

      {/* Create Invite Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <CardDescription>Invite a new team member to join your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                'Sending...'
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invites List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage invitations sent to team members</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations found. Send your first invitation above.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Email and status row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-base truncate">{invite.email}</span>
                      {getStatusBadge(invite)}
                      <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded-md">
                        {invite.role}
                      </span>
                    </div>
                    
                    {/* Dates row */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pl-6">
                      {invite.status === 'pending' && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {formatDate(invite.expires_at)}
                          </span>
                        </>
                      )}
                      {invite.status === 'accepted' && invite.accepted_at && (
                        <>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Accepted: {formatDate(invite.accepted_at)}
                          </span>
                        </>
                      )}
                      {invite.status === 'revoked' && invite.revoked_at && (
                        <>
                          <span className="flex items-center gap-1">
                            <UserX className="w-3 h-3" />
                            Revoked: {formatDate(invite.revoked_at)}
                          </span>
                        </>
                      )}
                      {invite.status === 'expired' && (
                        <>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Expired: {formatDate(invite.expires_at)}
                          </span>
                        </>
                      )}
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs">Sent: {formatDate(invite.created_at)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0 sm:self-center flex gap-2">
                    {invite.status === 'pending' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(invite.id)}
                        disabled={revoking === invite.id || deleting === invite.id}
                        className="w-full sm:w-auto"
                      >
                        {revoking === invite.id ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Revoking...
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Revoke
                          </>
                        )}
                      </Button>
                    )}
                    {/* Delete button available for all invites (distinct from revoke) */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invite.id)}
                      disabled={revoking === invite.id || deleting === invite.id}
                      className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {deleting === invite.id ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
