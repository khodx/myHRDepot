/**
 * MhdCompanyDetailPage
 *
 * Route: /companies/:companyId
 * Displays company profile, people count, task summary, active status.
 *
 * Requires: mhdCompanyService.getCompanyById(companyId) added to Companies Service.ts:
 *   async getCompanyById(id: string): Promise<MhdCompany>
 *   → supabase.from('companies').select('*').eq('id', id).single()
 *
 * Visible to: Platform Admin, HR Partner only (enforced by MhdSidebar NAV_ITEMS + RLS)
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, ClipboardList } from 'lucide-react'
import { MhdBreadcrumb } from './MhdBreadcrumb'
import { mhdCompanyService } from '@/features/companies/Service'

export function MhdCompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['mhd-company', companyId],
    queryFn: () => mhdCompanyService.getCompanyById(companyId!),
    enabled: !!companyId,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading company…</p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {(error as Error)?.message ?? 'Company not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/companies')}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Companies
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <MhdBreadcrumb
        items={[
          { label: 'Companies', to: '/companies' },
          { label: company.companyName },
        ]}
      />

      {/* Company card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-400">{company.referenceId}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{company.companyName}</h1>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/people?companyId=${company.id}`)}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            View People
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tasks?companyId=${company.id}`)}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            View Tasks
          </button>
        </div>

        {/* Timestamps */}
        <div className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
          <p>Created: {new Date(company.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(company.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
