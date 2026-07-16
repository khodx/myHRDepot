import { LogOut } from 'lucide-react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdNotificationBell } from '@/features/notifications/components/MhdNotificationBell';
export function MhdTopBar() {
  const { profile, signOut } = useMhdAuth();

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || '??'
    : '??';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {profile?.companyName ?? ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <MhdNotificationBell />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {initials}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium">{profile?.displayName ?? 'User'}</span>
          <span className="text-xs text-muted-foreground">{profile?.roleNames.join(', ') ?? ''}</span>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
