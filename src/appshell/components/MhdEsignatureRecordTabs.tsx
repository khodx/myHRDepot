import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdEsignatureRecordTab = 'detail';

interface MhdEsignatureRecordTabsProps {
  requestId: string;
  active: MhdEsignatureRecordTab;
  className?: string;
  /**
   * Void the signature request. Omit to hide the action entirely — the
   * caller only passes this when the viewer can mutate e-signature records
   * AND the request is still PENDING/IN_PROGRESS (voiding a COMPLETED,
   * DECLINED, EXPIRED, or already-VOIDED request is not offered).
   */
  onVoid?: () => void | Promise<void>;
  voidConfirmMessage?: string;
}

/**
 * Record-nav row for a single e-signature request: Detail (only tab today —
 * the signer chain, disclosure snapshot, and event timeline all render
 * inline, matching the single-"detail"-tab convention used by every other
 * case-like record: MhdInvestigationCaseRecordTabs, MhdConductCaseRecordTabs,
 * MhdOffboardingCaseRecordTabs, MhdAccommodationCaseRecordTabs). Styled the
 * same button-pill way as MhdTaskRecordTabs (buttonBaseClasses/
 * buttonVariantClasses, primary when active, secondary otherwise).
 *
 * A signature request has no Edit route and no Delete: once created it is an
 * append-only record of a signing ceremony (signers, consent, event trail).
 * The only lifecycle action a privileged viewer can take against it is Void,
 * so that is the sole pinned-right button here — there is intentionally no
 * Edit button, unlike MhdTaskRecordTabs.
 */
export function MhdEsignatureRecordTabs({
  requestId,
  active,
  className,
  onVoid,
  voidConfirmMessage = 'Void this signature request? This cannot be undone.',
}: MhdEsignatureRecordTabsProps) {
  const [voiding, setVoiding] = useState(false);

  const tabs: Array<{ key: MhdEsignatureRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/esignature/${requestId}` },
  ];

  async function handleVoid() {
    if (!onVoid || voiding) return;
    if (!window.confirm(voidConfirmMessage)) return;
    setVoiding(true);
    try {
      await onVoid();
    } finally {
      setVoiding(false);
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            aria-current={isActive ? 'page' : undefined}
            to={tab.to}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-[16.8px]',
              isActive ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      {onVoid ? (
        <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-2">
          <button
            type="button"
            onClick={() => void handleVoid()}
            disabled={voiding}
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.destructive,
              'h-9 px-3 text-[16.8px]',
            )}
          >
            <Ban className="h-4 w-4" aria-hidden />
            {voiding ? 'Voiding…' : 'Void Request'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
