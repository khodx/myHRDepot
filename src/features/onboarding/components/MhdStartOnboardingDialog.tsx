import { useMemo, useState } from 'react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdStartOnboardingPacket } from '../Hook';
import {
  MHD_ONBOARDING_PACKET_DEFINITIONS,
  type MhdOnboardingDocumentKey,
  type MhdOnboardingRosterRow,
} from '../Types';

interface MhdStartOnboardingDialogProps {
  row: MhdOnboardingRosterRow;
  onClose: () => void;
}

/**
 * Enrollment dialog for the new-hire packet.
 *
 * Defaults to every item the manifest marks required, with all of them
 * selected, because enrolling a partial packet is the exception. The due date
 * is optional and applies only to items this run actually creates — the RPC
 * (migration 0062) never rewrites an existing row, so re-opening this for
 * someone already enrolled tops up missing items without moving deadlines on
 * work already in flight.
 */
export function MhdStartOnboardingDialog({ row, onClose }: MhdStartOnboardingDialogProps) {
  const { profile } = useMhdAuth();
  const startPacket = useMhdStartOnboardingPacket();

  const [dueDate, setDueDate] = useState('');
  const [selected, setSelected] = useState<Set<MhdOnboardingDocumentKey>>(
    () =>
      new Set(
        MHD_ONBOARDING_PACKET_DEFINITIONS.filter((packet) => packet.isRequiredByDefault).map(
          (packet) => packet.documentKey,
        ),
      ),
  );

  // Items already on the person's checklist cannot be re-seeded, so surface
  // that rather than letting someone select an item that will silently no-op.
  const alreadyEnrolled = row.progress !== null && row.progress.totalItems > 0;

  const errorMessage = useMemo(
    () => (startPacket.error instanceof Error ? startPacket.error.message : null),
    [startPacket.error],
  );

  function toggle(key: MhdOnboardingDocumentKey) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit() {
    if (!profile?.companyId || selected.size === 0) return;
    await startPacket.mutateAsync({
      companyId: profile.companyId,
      personId: row.personId,
      documentKeys: [...selected],
      // <input type="date"> yields YYYY-MM-DD; send an explicit UTC instant so
      // the stored deadline does not shift by the viewer's timezone offset.
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00Z`).toISOString() : null,
      actorUserId: profile.userId,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <MhdCard className="max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-foreground">Start Onboarding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enroll <span className="font-medium text-foreground">{row.displayName}</span> in the
          new-hire packet. Selected documents are added as Not Started.
        </p>

        {alreadyEnrolled ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This person already has packet items. Existing items keep their current status and due
            date; only documents not already on the checklist will be added.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="mhd-packet-due">
          Due Date <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="mhd-packet-due"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="mt-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            Documents ({selected.size}/{MHD_ONBOARDING_PACKET_DEFINITIONS.length})
          </p>
          <div className="flex gap-3 text-xs font-semibold">
            <button
              type="button"
              className="text-accent hover:text-accent-hover"
              onClick={() =>
                setSelected(
                  new Set(MHD_ONBOARDING_PACKET_DEFINITIONS.map((packet) => packet.documentKey)),
                )
              }
            >
              Select All
            </button>
            <button
              type="button"
              className="text-accent hover:text-accent-hover"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MHD_ONBOARDING_PACKET_DEFINITIONS.map((packet) => (
            <label
              key={packet.documentKey}
              className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-2 text-sm"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={selected.has(packet.documentKey)}
                onChange={() => toggle(packet.documentKey)}
              />
              <span>
                <span className="font-medium text-foreground">{packet.label}</span>
                {packet.accessTier === 'Restricted' ? (
                  <span className="ml-1 text-xs text-muted-foreground">(Restricted)</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={startPacket.isPending}
            className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={startPacket.isPending || selected.size === 0}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            {startPacket.isPending ? 'Starting...' : 'Start Onboarding'}
          </button>
        </div>
      </MhdCard>
    </div>
  );
}
