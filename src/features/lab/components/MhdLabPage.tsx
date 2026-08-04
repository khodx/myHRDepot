import { useState } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import { MhdLabTestDataSection } from './MhdLabTestDataSection';
import { MhdLabComponentPlaygroundSection } from './MhdLabComponentPlaygroundSection';
import { MhdLabRpcConsoleSection } from './MhdLabRpcConsoleSection';

type MhdLabTab = 'test-data' | 'components' | 'rpc-console';

const TABS: Array<{ key: MhdLabTab; label: string }> = [
  { key: 'test-data', label: 'Test Data' },
  { key: 'components', label: 'Component Playground' },
  { key: 'rpc-console', label: 'RPC Console' },
];

export function MhdLabPage() {
  const [activeTab, setActiveTab] = useState<MhdLabTab>('test-data');

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Lab & Sandbox"
        description="QA and debugging tools — generate synthetic test data, preview shared UI components, or call an RPC directly."
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

      {activeTab === 'test-data' && <MhdLabTestDataSection />}
      {activeTab === 'components' && <MhdLabComponentPlaygroundSection />}
      {activeTab === 'rpc-console' && <MhdLabRpcConsoleSection />}
    </div>
  );
}
