import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdPersonService } from '@/features/people/Service';
import { useMhdOnboardingPacket } from '../Hook';
import { MhdOnboardingChecklistPage } from './MhdOnboardingChecklistPage';

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

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={`${person.displayName} — Onboarding`}
        description="New-hire packet status, and the form behind each packet item."
        backTo="/onboarding"
        backLabel="Onboarding"
      />

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
