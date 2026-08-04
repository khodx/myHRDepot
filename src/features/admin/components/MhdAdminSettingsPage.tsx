import { useState } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import { MhdAdminOverviewSection } from './MhdAdminOverviewSection';
import { MhdAdminSystemSection } from './MhdAdminSystemSection';
import { MhdAdminAuditSection } from './MhdAdminAuditSection';

type MhdAdminTab = 'overview' | 'system' | 'audit';

const TABS: Array<{ key: MhdAdminTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'system', label: 'System & Compliance' },
  { key: 'audit', label: 'Audit & Activity' },
];

export function MhdAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<MhdAdminTab>('overview');

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Admin Settings"
        description="Platform-wide administration: users, companies, compliance status, and privileged activity."
      />

      <div role="tablist" className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
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

      {activeTab === 'overview' && <MhdAdminOverviewSection />}
      {activeTab === 'system' && <MhdAdminSystemSection />}
      {activeTab === 'audit' && <MhdAdminAuditSection />}
    </div>
  );
}
