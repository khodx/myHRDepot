import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Eye, UserCog } from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';

/**
 * User & role management and Company management deliberately link out to the
 * existing /users and /companies pages instead of re-implementing those
 * lists here — both are already full-featured (invite, deactivate, role
 * assignment, edit) and duplicating them would just drift out of sync.
 */
export function MhdAdminOverviewSection() {
  const { profile } = useMhdAuth();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/users"
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
        >
          <div className="flex items-center justify-between">
            <UserCog className="h-6 w-6 text-accent" aria-hidden />
            <ArrowRight
              className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </div>
          <h3 className="text-base font-semibold text-foreground">User &amp; Role Management</h3>
          <p className="text-sm text-muted-foreground">
            Invite, deactivate, and assign roles to login accounts across every company.
          </p>
        </Link>

        <Link
          to="/companies"
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
        >
          <div className="flex items-center justify-between">
            <Building2 className="h-6 w-6 text-accent" aria-hidden />
            <ArrowRight
              className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </div>
          <h3 className="text-base font-semibold text-foreground">Company Management</h3>
          <p className="text-sm text-muted-foreground">
            View and edit tenant companies, including the platform-org flag.
          </p>
        </Link>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-5 shadow-sm">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
        <div>
          <h3 className="text-base font-semibold text-foreground">Role Impersonation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the <strong>View As</strong> menu under your name in the top bar to switch your own
            session to any role (and, for company-scoped roles, a specific company). Reads and
            writes both behave exactly as that role would — this is a real access test, not a
            preview skin — and every action you take while impersonating is still attributed to{' '}
            <strong>{profile?.email ?? 'your real account'}</strong> in the audit trail. Use{' '}
            <strong>Exit Impersonation</strong> in that same menu, or the amber banner at the top
            of every page, to return to your own view.
          </p>
        </div>
      </div>
    </div>
  );
}
