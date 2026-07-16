/**
 * MhdPersonDetailPage
 *
 * Route: /people/:personId
 * Displays full person profile: name, contact methods, associated tasks.
 *
 * Requires: mhdPersonService.getPersonById(personId) added to People Service.ts:
 *   async getPersonById(personId: string): Promise<MhdPerson>
 *   → supabase.from('people').select(PERSON_SELECT).eq('id', personId).single()
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Mail, Phone, Smartphone, Building2 } from 'lucide-react'
import { MhdBreadcrumb } from './MhdBreadcrumb'
import { mhdPersonService } from '@/features/people/Service'

export function MhdPersonDetailPage() {
  const { personId } = useParams<{ personId: string }>()
  const navigate = useNavigate()

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['mhd-person', personId],
    queryFn: () => mhdPersonService.getPersonById(personId!),
    enabled: !!personId,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading person…</p>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">
          {(error as Error)?.message ?? 'Person not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/people')}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to People
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <MhdBreadcrumb
        items={[{ label: 'People', to: '/people' }, { label: person.displayName }]}
      />

      {/* Profile card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar initials */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
{person.firstName?.[0] ?? ''}{person.lastName?.[0] ?? ''}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-neutral-900">{person.displayName}</h1>
            {person.preferredName && (
              <p className="text-sm text-neutral-500">Preferred: {person.preferredName}</p>
            )}
            <p className="mt-0.5 text-xs text-neutral-400">{person.referenceId}</p>
          </div>
        </div>

        {/* Company */}
        {person.companyName && (
          <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
            <Building2 className="h-4 w-4 text-neutral-400" />
            <span>{person.companyName}</span>
          </div>
        )}

        {/* Contact methods */}
        <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
          {person.primaryEmail && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Mail className="h-4 w-4 text-neutral-400" />
              <a href={`mailto:${person.primaryEmail}`} className="hover:text-blue-600 hover:underline">
                {person.primaryEmail}
              </a>
            </div>
          )}
          {person.primaryPhone && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Phone className="h-4 w-4 text-neutral-400" />
              <a href={`tel:${person.primaryPhone}`} className="hover:text-blue-600 hover:underline">
                {person.primaryPhone}
              </a>
            </div>
          )}
          {person.primaryMobile && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Smartphone className="h-4 w-4 text-neutral-400" />
              <a href={`tel:${person.primaryMobile}`} className="hover:text-blue-600 hover:underline">
                {person.primaryMobile}
              </a>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
          <p>Added: {new Date(person.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(person.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
