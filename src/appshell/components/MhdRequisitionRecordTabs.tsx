import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdRequisitionRecordTab = 'detail' | 'pipeline' | 'interview-guide';

interface MhdRequisitionRecordTabsProps {
  reqId: string;
  active: MhdRequisitionRecordTab;
  className?: string;
  /**
   * Whether the Interview Guide tab renders at all. The guide builder is a
   * privileged (Platform Admin / HR Partner / Client Admin) surface — a
   * hiring manager who can view the requisition and its pipeline does not get
   * this tab. Mirrors how MhdTaskRecordTabs hides its Audit tab for
   * non-privileged roles.
   */
  showInterviewGuideTab: boolean;
}

/**
 * Record-nav buttons for a single requisition: Detail / Pipeline / Interview
 * Guide — each its own routed page, matching MhdTaskRecordTabs' button-pill
 * convention (primary when active, secondary otherwise). There is no Edit or
 * Delete action here: no RPC updates or removes a requisition's own fields
 * once created — only its status, which transitions via the Detail tab's
 * status card — so this component never renders those affordances.
 */
export function MhdRequisitionRecordTabs({
  reqId,
  active,
  className,
  showInterviewGuideTab,
}: MhdRequisitionRecordTabsProps) {
  const tabs: Array<{ key: MhdRequisitionRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/recruiting/requisitions/${reqId}` },
    { key: 'pipeline', label: 'Pipeline', to: `/recruiting/requisitions/${reqId}/pipeline` },
    ...(showInterviewGuideTab
      ? [
          {
            key: 'interview-guide' as const,
            label: 'Interview Guide',
            to: `/recruiting/requisitions/${reqId}/interview-guide`,
          },
        ]
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
