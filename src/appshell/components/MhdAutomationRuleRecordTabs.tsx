import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdAutomationRuleRecordTab = 'detail';

interface MhdAutomationRuleRecordTabsProps {
  ruleId: string;
  active: MhdAutomationRuleRecordTab;
  className?: string;
  /** Whether the rule is currently armed; drives the pinned action's label/coloring. */
  isActive?: boolean;
  /** Gated by mhdCanArmAutomations at the call site. Omit (or leave onToggleActive unset) to hide the action. */
  canArm?: boolean;
  onToggleActive?: () => void | Promise<void>;
  isToggling?: boolean;
}

/**
 * Record-nav for a single automation rule: Detail only today. Trigger,
 * Conditions and Actions are sections within this one detail page rather than
 * separate routes, so — like MhdCompanyRecordTabs/MhdPersonRecordTabs — there
 * is only one tab. Styled like MhdTaskRecordTabs (button pills built from
 * buttonBaseClasses/buttonVariantClasses, not underlined tabs): primary when
 * active, secondary otherwise, aria-current="page" on the active tab.
 *
 * Arm/Disarm is this record's only mutation, so it takes the pinned-right
 * slot Edit/Delete occupy on MhdTaskRecordTabs (ml-auto, border-left
 * divider, same h-9/px-3/text-[16.8px] sizing) instead of living in the page
 * header — it is a state toggle rather than an edit or a delete, so it uses
 * primary/secondary coloring rather than warning/destructive.
 */
export function MhdAutomationRuleRecordTabs({
  ruleId,
  active,
  className,
  isActive = false,
  canArm = false,
  onToggleActive,
  isToggling = false,
}: MhdAutomationRuleRecordTabsProps) {
  const tabs: Array<{ key: MhdAutomationRuleRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/automations/rules/${ruleId}` },
  ];

  const showArmAction = canArm && Boolean(onToggleActive);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const isCurrentTab = tab.key === active;
        return (
          <Link
            key={tab.key}
            aria-current={isCurrentTab ? 'page' : undefined}
            to={tab.to}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-[16.8px]',
              isCurrentTab ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      {showArmAction ? (
        <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-2">
          <button
            type="button"
            onClick={() => void onToggleActive?.()}
            disabled={isToggling}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-[16.8px]',
              isActive ? buttonVariantClasses.secondary : buttonVariantClasses.primary,
            )}
          >
            {isToggling ? 'Saving…' : isActive ? 'Disarm Rule' : 'Arm Rule'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
