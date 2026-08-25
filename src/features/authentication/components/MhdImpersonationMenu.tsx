import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { MhdAvatarCircle } from '@/components/ui/MhdAvatar';
import { useMhdPersonPhotoUrl } from '@/features/people/Hook';
import { useMhdAuth } from '../Hook';
import type {
  MhdAuthRoleName,
  MhdCurrentUserProfile,
  MhdImpersonationCompanyOption,
} from '../Types';

type MhdImpersonationTier = 'platform-admin' | 'client-admin' | 'hr-partner';

/**
 * Mirrors the server-side tiers in mhd_start_impersonation: Platform Admin
 * (any role, any company), Client Admin (any company-scoped role, forced to
 * their own company), HR Partner (their level and downward, forced to their
 * own company). The server is still the real authority — this only decides
 * what the UI offers, so a stale client can't offer a choice the RPC would
 * reject anyway.
 */
function mhdGetImpersonationTier(
  profile: MhdCurrentUserProfile | null,
): MhdImpersonationTier | null {
  if (!profile) return null;
  if (profile.realIsAdmin) return 'platform-admin';
  if (profile.realRoleNames.includes('Client Admin')) return 'client-admin';
  if (profile.realRoleNames.includes('HR Partner')) return 'hr-partner';
  return null;
}

// Mirrors mhd_start_impersonation's tier arrays (migration 0197) exactly —
// keep both in lockstep. platform-admin may impersonate any of the 14
// roles; client-admin may impersonate everything at its own tier and below
// (everything except Platform Admin/HR Partner); hr-partner may
// impersonate HR Partner and below.
const MHD_IMPERSONATION_ALLOWED_ROLES: Record<MhdImpersonationTier, MhdAuthRoleName[]> = {
  'platform-admin': [
    'Platform Admin', 'Executive Leadership', 'Director', 'HR Partner',
    'HR Admin', 'HR Specialist', 'HR Coordinator', 'Client Admin',
    'Manager', 'Supervisor', 'Lead', 'Employee', '3rd Party', 'Viewer',
  ],
  'client-admin': [
    'Executive Leadership', 'Director', 'Client Admin', 'HR Admin',
    'HR Specialist', 'HR Coordinator', 'Manager', 'Supervisor', 'Lead',
    'Employee', '3rd Party', 'Viewer',
  ],
  'hr-partner': [
    'HR Partner', 'HR Admin', 'HR Specialist', 'HR Coordinator',
    'Manager', 'Supervisor', 'Lead', 'Employee', '3rd Party', 'Viewer',
  ],
};

/**
 * "View As" control for the top bar user chip. Gated on the REAL role
 * (never the impersonation-overridden profile.roleNames/isAdmin) so that
 * whoever opened the menu keeps seeing it — and the same target roles —
 * while actively impersonating.
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

  const tier = mhdGetImpersonationTier(profile);
  const photoUrlQuery = useMhdPersonPhotoUrl(profile?.photoPath);
  const avatarName = profile?.displayName ?? 'User';

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

  if (!profile || !tier) {
    return (
      <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 shadow-sm sm:flex">
        <MhdAvatarCircle
          name={avatarName}
          photoUrl={photoUrlQuery.data}
          size="md"
          className="h-10 w-10 text-sm bg-accent text-accent-on"
        />
        <div className="hidden max-w-44 flex-col gap-0.5 lg:flex">
          <span className="truncate text-base font-semibold">{profile?.displayName ?? 'User'}</span>
        </div>
      </div>
    );
  }

  const allowedRoles = MHD_IMPERSONATION_ALLOWED_ROLES[tier];

  async function handleOpen() {
    setIsOpen((prev) => !prev);
    setError(null);
    // Only a Platform Admin needs the company picker — Client Admin/HR
    // Partner are always forced to their own company server-side, and
    // mhd_list_companies_for_impersonation() returns nothing for them anyway.
    if (tier === 'platform-admin' && !companies) {
      try {
        setCompanies(await listCompaniesForImpersonation());
      } catch {
        setCompanies([]);
      }
    }
  }

  function handlePickRole(role: MhdAuthRoleName) {
    setError(null);
    if (tier !== 'platform-admin' || role === 'Platform Admin') {
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
        className="mhd-topbar-icon-btn hidden items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 shadow-sm transition-colors sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MhdAvatarCircle
          name={avatarName}
          photoUrl={photoUrlQuery.data}
          size="md"
          className="h-10 w-10 text-sm bg-accent text-accent-on"
        />
        <div className="hidden max-w-44 flex-col gap-0.5 lg:flex">
          <span className="truncate text-base font-semibold">{profile.displayName ?? 'User'}</span>
          {impersonation.isImpersonating ? (
            <span className="truncate text-base text-muted-foreground">
              Viewing as {impersonation.role}
            </span>
          ) : null}
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
            {tier === 'platform-admin' ? 'View As' : 'View As (within your company)'}
          </p>
          <div className="flex flex-col gap-1">
            {allowedRoles.map((role) => (
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
