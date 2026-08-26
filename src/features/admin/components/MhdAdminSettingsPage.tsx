import { useMemo, useState } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdAdminOverviewSection } from './MhdAdminOverviewSection';
import { MhdAdminSystemSection } from './MhdAdminSystemSection';
import { MhdAdminAuditSection } from './MhdAdminAuditSection';
import { MhdAdminQuotesSection } from './MhdAdminQuotesSection';
import { MhdAdminCalculatorTemplatesSection } from './MhdAdminCalculatorTemplatesSection';

type MhdAdminTab = 'overview' | 'system' | 'audit' | 'quotes' | 'calculator-templates';

const ALL_TABS: Array<{ key: MhdAdminTab; label: string; platformAdminOnly: boolean }> = [
  { key: 'overview', label: 'Overview', platformAdminOnly: true },
  { key: 'system', label: 'System & Compliance', platformAdminOnly: true },
  { key: 'audit', label: 'Audit & Activity', platformAdminOnly: true },
  { key: 'quotes', label: 'Quotes', platformAdminOnly: false },
  { key: 'calculator-templates', label: 'Calculator Templates', platformAdminOnly: true },
];

/**
 * Overview/System/Audit surface platform-wide user, compliance-gate, and
 * impersonation data, so they stay Platform Admin only. Quotes is low-stakes
 * dashboard content managed by the broader HR administrator tier (migration
 * 0208, mhd_is_hr_administrator: Platform Admin OR HR Partner OR HR Admin) —
 * the route itself (mhdRouteAccess) already admits those roles, so a non-
 * Platform-Admin landing here should see only the tab they can use.
 */
export function MhdAdminSettingsPage() {
  const { roles } = useMhdAuth();
  const isPlatformAdmin = roles.includes('Platform Admin');
  const tabs = useMemo(
    () => ALL_TABS.filter((tab) => isPlatformAdmin || !tab.platformAdminOnly),
    [isPlatformAdmin],
  );
  const [activeTab, setActiveTab] = useState<MhdAdminTab>(isPlatformAdmin ? 'overview' : 'quotes');

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Admin Settings"
        description={
          isPlatformAdmin
            ? 'Platform-wide administration: users, companies, compliance status, and privileged activity.'
            : 'Manage the quotes shown on the dashboard greeting card.'
        }
      />

      <div role="tablist" className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-[3px] px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                isActive
                  ? 'border-accent text-accent-hover'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isPlatformAdmin && activeTab === 'overview' && <MhdAdminOverviewSection />}
      {isPlatformAdmin && activeTab === 'system' && <MhdAdminSystemSection />}
      {isPlatformAdmin && activeTab === 'audit' && <MhdAdminAuditSection />}
      {isPlatformAdmin && activeTab === 'calculator-templates' && <MhdAdminCalculatorTemplatesSection />}
      {activeTab === 'quotes' && <MhdAdminQuotesSection />}
    </div>
  );
}
