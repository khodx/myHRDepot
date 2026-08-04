import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useMhdAuth } from '../Hook';
import type { MhdAuthRoleName, MhdImpersonationCompanyOption } from '../Types';

const MHD_IMPERSONATION_ROLES: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
  'Viewer',
];

/**
 * "View As" control for the top bar user chip. Only a REAL Platform Admin
 * (profile.realIsAdmin — never the impersonation-overridden profile.isAdmin)
 * ever sees this open; everyone else keeps the plain, non-interactive chip
 * that was here before.
 */
export function MhdImpersonationMenu() {
  const { profile, startImpersonation, endImpersonation, listCompaniesForImpersonation } =
    useMhdAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<MhdImpersonationCompanyOption[] | null>(null);
  const [pendingRole, setPendingRole] = useState<MhdAuthRoleName | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || '??'
    : '??';

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPendingRole(null);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  if (!profile?.realIsAdmin) {
    return (
      <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 shadow-sm sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-on">
          {initials}
        </div>
        <div className="hidden max-w-44 flex-col gap-0.5 lg:flex">
          <span className="truncate text-sm font-semibold">{profile?.displayName ?? 'User'}</span>
          <span className="truncate text-xs text-muted-foreground">
            {profile?.roleNames.join(', ') ?? ''}
          </span>
        </div>
      </div>
    );
  }

  async function handleOpen() {
    setIsOpen((prev) => !prev);
    setError(null);
    if (!companies) {
      try {
        setCompanies(await listCompaniesForImpersonation());
      } catch {
        setCompanies([]);
      }
    }
  }

  function handlePickRole(role: MhdAuthRoleName) {
    setError(null);
    if (role === 'Platform Admin') {
      void handleStart(role, null);
      return;
    }
    setPendingRole(role);
    setSelectedCompanyId('');
  }

  async function handleStart(role: MhdAuthRoleName, companyId: string | null) {
    setIsSubmitting(true);
    setError(null);
    try {
      await startImpersonation(role, companyId);
      setIsOpen(false);
      setPendingRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start impersonation');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExit() {
    setIsSubmitting(true);
    setError(null);
    try {
      await endImpersonation();
      setIsOpen(false);
      setPendingRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to exit impersonation');
    } finally {
      setIsSubmitting(false);
    }
  }

  const { impersonation } = profile;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 shadow-sm transition-colors hover:bg-muted sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-on">
          {initials}
        </div>
        <div className="hidden max-w-44 flex-col gap-0.5 lg:flex">
          <span className="truncate text-sm font-semibold">{profile.displayName ?? 'User'}</span>
          <span className="truncate text-xs text-muted-foreground">
            {impersonation.isImpersonating
              ? `Viewing as ${impersonation.role}`
              : profile.roleNames.join(', ')}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card p-3 shadow-lg"
        >
          {impersonation.isImpersonating && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
              <p className="font-semibold">
                Viewing as {impersonation.role}
                {impersonation.companyName ? ` · ${impersonation.companyName}` : ''}
              </p>
              <button
                type="button"
                onClick={() => void handleExit()}
                disabled={isSubmitting}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-amber-900 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
              >
                <LogOut className="h-3 w-3" />
                Exit Impersonation
              </button>
            </div>
          )}

          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            View As
          </p>
          <div className="flex flex-col gap-1">
            {MHD_IMPERSONATION_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handlePickRole(role)}
                disabled={isSubmitting}
                className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60 ${
                  impersonation.role === role ? 'bg-muted font-semibold' : ''
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {pendingRole && (
            <div className="mt-2 border-t border-border pt-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Company for {pendingRole}
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <option value="">Select a company…</option>
                {(companies ?? []).map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleStart(pendingRole, selectedCompanyId)}
                disabled={isSubmitting || !selectedCompanyId}
                className="w-full rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Start Viewing As {pendingRole}
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
