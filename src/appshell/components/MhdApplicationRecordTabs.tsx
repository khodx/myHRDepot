import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdApplicationRecordTab = 'detail' | 'interviews' | 'evaluation' | 'offer';

interface MhdApplicationRecordTabsProps {
  appId: string;
  active: MhdApplicationRecordTab;
  className?: string;
  /**
   * Whether the Offer tab renders at all. Extending / accepting an offer and
   * the onboarding-feed hire preview are privileged (Platform Admin / HR
   * Partner / Client Admin) surfaces — a hiring manager who can view the
   * application does not get this tab.
   */
  showOfferTab: boolean;
}

/**
 * Record-nav buttons for a single application: Detail / Interviews /
 * Evaluation / Offer — each its own routed page, one per recruiting package
 * (package 1 detail, package 2 interviews/evaluation, package 3 offer/hire).
 * Follows MhdTaskRecordTabs' button-pill convention. No Edit or Delete here:
 * an application has no direct edit/delete RPC — its record only advances via
 * the move-stage / reject workflow actions on the Detail tab.
 */
export function MhdApplicationRecordTabs({
  appId,
  active,
  className,
  showOfferTab,
}: MhdApplicationRecordTabsProps) {
  const tabs: Array<{ key: MhdApplicationRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/recruiting/applications/${appId}` },
    { key: 'interviews', label: 'Interviews', to: `/recruiting/applications/${appId}/interviews` },
    { key: 'evaluation', label: 'Evaluation', to: `/recruiting/applications/${appId}/evaluation` },
    ...(showOfferTab
      ? [{ key: 'offer' as const, label: 'Offer', to: `/recruiting/applications/${appId}/offer` }]
      : []),
  ];

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
    </div>
  );
}
