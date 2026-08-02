import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { mhdRecruitingIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdRecruitingPeople } from '../requisitions/Hook';
import { MhdApplicationOfferPage } from '../requisitions/components/MhdApplicationOfferPage';

/**
 * `/recruiting/applications/:appId/offer` — the application's Offer tab
 * (package 3): extending/accepting the offer and the hire handoff. Privileged
 * only (Platform Admin / HR Partner / Client Admin) — a non-privileged viewer
 * never sees this tab (see `MhdApplicationRecordTabs`), and reaching the route
 * directly redirects to the application's Detail tab, matching the pattern of
 * every other privileged-only sub-surface in this module.
 */
export function MhdApplicationOfferRoutePage() {
  const { appId } = useParams<{ appId: string }>();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canManage = mhdRecruitingIsPrivileged(roles);

  const people = useMhdRecruitingPeople(canManage ? companyId : null);
  const reportingManagers = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        displayName:
          person.preferredName || [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  if (!companyId || !appId) {
    return (
      <div className="text-sm text-muted-foreground">
        This application could not be resolved for your account.
      </div>
    );
  }

  if (!canManage) {
    return <Navigate to={`/recruiting/applications/${appId}`} replace />;
  }

  return (
    <MhdApplicationOfferPage applicationId={appId} reportingManagers={reportingManagers} />
  );
}
