import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMhdAuth } from '../Hook';
import type { MhdAuthRoleName } from '../Types';

/**
 * Lets a user who holds multiple roles (e.g. HR Admin + Employee) choose
 * which subset is "active" right now — narrowing nav/route visibility to
 * just those roles, so e.g. an HR Admin can act purely as an Employee for
 * self-service without their admin surfaces cluttering the nav. This is a
 * DIFFERENT mechanism from "View As" (MhdImpersonationMenu): it only ever
 * narrows the caller's OWN roles, never becomes someone else's identity,
 * has no server session, and is purely a client-side UI preference — the
 * server always independently re-derives real permissions from auth.uid()
 * on every RPC, so this can never under- or over-privilege an actual
 * write (see MhdAuthState.actingAsRoles' doc comment).
 *
 * Deliberately hidden while impersonation is active — the two mechanisms
 * are kept from combining so there is never a confusing double-override.
 * The existing "Exit Impersonation" control (MhdImpersonationBanner) is
 * completely separate and unaffected either way.
 */
export function MhdActingAsMenu() {
  const { profile, actingAsRoles, setActingAsRoles } = useMhdAuth();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  if (!profile || profile.impersonation.isImpersonating) return null;
  if (profile.realRoleNames.length <= 1) return null;

  const activeRoles = actingAsRoles ?? profile.realRoleNames;
  const isFiltered = actingAsRoles !== null;

  function handleToggleRole(role: MhdAuthRoleName) {
    const nextSet = activeRoles.includes(role)
      ? activeRoles.filter((r) => r !== role)
      : [...activeRoles, role];

    // Never allow narrowing to zero roles — that would strand the user
    // with no nav at all. Selecting everything is equivalent to "no
    // filter," so store null in that case (keeps the "reset" action and
    // "select everything" converging on the same, simpler state).
    if (nextSet.length === 0) return;
    const isEverything = profile!.realRoleNames.every((r) => nextSet.includes(r));
    setActingAsRoles(isEverything ? null : nextSet);
  }

  function handleReset() {
    setActingAsRoles(null);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="mhd-topbar-icon-btn hidden h-16 items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-base shadow-sm transition-colors sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Choose which of your roles are active"
      >
        <span className="max-w-40 truncate font-medium">
          {isFiltered ? `Acting as ${activeRoles.join(', ')}` : 'All roles'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
        >
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Acting as
          </p>
          <div className="flex flex-col gap-1">
            {profile.realRoleNames.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={activeRoles.includes(role)}
                  onChange={() => handleToggleRole(role)}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                {role}
              </label>
            ))}
          </div>
          {isFiltered ? (
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 w-full rounded-md border-t border-border pt-2 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              Reset to all roles
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
