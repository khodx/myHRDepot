import { Eye, LogOut } from 'lucide-react';
import { useMhdAuth } from '../Hook';

/**
 * Persistent full-width strip shown on every authenticated page while a
 * "View As" session is active — deliberately outside MhdTopBar so it stays
 * visible even if the top bar scrolls with content on narrow layouts.
 */
export function MhdImpersonationBanner() {
  const { profile, endImpersonation } = useMhdAuth();
  const impersonation = profile?.impersonation;

  if (!impersonation?.isImpersonating) return null;

  return (
    <div className="flex shrink-0 items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-amber-950">
      <Eye className="h-3.5 w-3.5" aria-hidden />
      <span>
        Viewing as <strong>{impersonation.role}</strong>
        {impersonation.companyName ? (
          <>
            {' '}
            in <strong>{impersonation.companyName}</strong>
          </>
        ) : null}
        {' — '}other users will not see this.
      </span>
      <button
        type="button"
        onClick={() => void endImpersonation()}
        className="inline-flex items-center gap-1 rounded-md bg-amber-950 px-2 py-0.5 text-white transition-colors hover:bg-amber-900"
      >
        <LogOut className="h-3 w-3" />
        Exit
      </button>
    </div>
  );
}
