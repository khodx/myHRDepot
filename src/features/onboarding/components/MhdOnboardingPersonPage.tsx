import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdCanMutateOnboarding } from '@/appshell/mhdRouteAccess';
import { MhdOnboardingRecordTabs } from '@/appshell/components/MhdOnboardingRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdPersonService } from '@/features/people/Service';
import { useMhdCancelOnboarding, useMhdOnboardingPacket } from '../Hook';
import { MhdOnboardingChecklistPage } from './MhdOnboardingChecklistPage';

const INPUT_CLASSES =
  'rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * /onboarding/:personId — one person's packet, reached from the roster.
 *
 * This renders the same MhdOnboardingChecklistPage card that /people/:personId
 * embeds; the difference is that here it is the page rather than a section
 * buried below the person's contact details, and it is reachable from the
 * navigation without going through the people directory first.
 */
export function MhdOnboardingPersonPage() {
  const { personId } = useParams<{ personId: string }>();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateOnboarding(roles);

  const {
    data: person,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['mhd-person', personId],
    queryFn: () => mhdPersonService.getPersonById(personId as string),
    enabled: !!personId,
  });

  const packet = useMhdOnboardingPacket(person?.id ?? '', person?.companyId ?? '');
  const cancelOnboarding = useMhdCancelOnboarding();

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Same "anything to cancel" check the roster/packet view already uses to
  // tell not-started from in-progress from complete: any item that has not
  // reached a terminal state (SIGNED — already executed, or VOIDED — already
  // cancelled) means there is still something a cancellation would act on.
  const hasCancellableItems = useMemo(
    () => packet.items.some((item) => item.status !== 'SIGNED' && item.status !== 'VOIDED'),
    [packet.items],
  );

  async function submitCancelOnboarding() {
    if (!person || !cancelReason.trim()) {
      setCancelError('Cancelling onboarding requires a recorded reason.');
      return;
    }
    setCancelError(null);
    try {
      await cancelOnboarding.mutateAsync({ personId: person.id, reason: cancelReason.trim() });
      setIsCancelling(false);
      setCancelReason('');
    } catch (mutationError) {
      setCancelError(
        mutationError instanceof Error ? mutationError.message : 'Unable to cancel onboarding.',
      );
    }
  }

  if (isLoading) {
    return <MhdCard className="p-6 text-sm text-muted-foreground">Loading person...</MhdCard>;
  }

  if (error || !person) {
    return (
      <div className="space-y-6">
        <MhdPageHeader title="Onboarding" backTo="/onboarding" backLabel="Onboarding" />
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error instanceof Error ? error.message : 'This person could not be loaded.'}
        </div>
      </div>
    );
  }

  const showCancelAction = canMutate && hasCancellableItems;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={`${person.displayName} — Onboarding`}
        description="New-hire packet status, and the form behind each packet item."
        backTo="/onboarding"
        backLabel="Onboarding"
      />

      <MhdOnboardingRecordTabs
        personId={person.id}
        active="detail"
        actions={
          showCancelAction ? (
            <MhdDetailActions
              deleteLabel="Cancel Onboarding"
              onDelete={() => setIsCancelling(true)}
              skipConfirm
            />
          ) : undefined
        }
      />

      {isCancelling ? (
        <MhdCard className="space-y-3 border-rose-200">
          <MhdCardHeader title="Cancel Onboarding" />
          <p className="text-xs text-muted-foreground">
            Cancelling voids every checklist item still Not Started, Pending, or Submitted for{' '}
            {person.displayName}. Items that are already Signed are left untouched — they are
            already-executed documents. A reason is required and is recorded on each voided item.
          </p>
          <label className="block text-sm font-medium text-foreground">
            Reason <span className="font-normal text-muted-foreground">(required)</span>
            <textarea
              rows={3}
              className={`mt-1 w-full ${INPUT_CLASSES}`}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Why is this onboarding packet being cancelled?"
            />
          </label>
          {cancelError ? <p className="text-xs text-rose-600">{cancelError}</p> : null}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={cancelOnboarding.isPending || !cancelReason.trim()}
              onClick={() => void submitCancelOnboarding()}
            >
              {cancelOnboarding.isPending ? 'Cancelling…' : 'Confirm Cancel Onboarding'}
            </Button>
            <Button
              variant="secondary"
              disabled={cancelOnboarding.isPending}
              onClick={() => {
                setIsCancelling(false);
                setCancelReason('');
                setCancelError(null);
              }}
            >
              Keep Onboarding Open
            </Button>
          </div>
        </MhdCard>
      ) : null}

      <MhdOnboardingChecklistPage
        personId={person.id}
        personDisplayName={person.displayName}
        items={packet.items}
        completedCount={packet.completedCount}
        requiredCount={packet.requiredItems.length}
        isFullyOnboarded={packet.isFullyOnboarded}
        isLoading={packet.isLoading}
        errorMessage={packet.errorMessage}
      />
    </div>
  );
}
