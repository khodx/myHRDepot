import { useState } from 'react';
import { Bot } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAutomationCatalog, useMhdAutomationRules, useMhdAutomationRuns } from '../Hook';
import { mhdAutomationRunVariant, mhdAutomationSensitivityVariant } from '../mhdAutomationBadges';

type MhdAutomationTab = 'rules' | 'runs' | 'catalog';

const TABS: Array<{ value: MhdAutomationTab; label: string }> = [
  { value: 'rules', label: 'Rules' },
  { value: 'runs', label: 'Run History' },
  { value: 'catalog', label: 'Catalog' },
];

function formatWhen(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—';
}

/**
 * /automations — the Automation Engine surface.
 *
 * This replaces the gap-inventory placeholder that reported "No automation
 * tables, rule service, scheduler, or execution queue found." Migrations
 * 0081-0085 built all of those, so the page now reads the real thing.
 *
 * Read-only by design in this phase, with one exception: arming. Rules are
 * provisioned INACTIVE (0084) and the database refuses an active rule with no
 * recorded authorizer, so without an arming control every automation would be
 * permanently dormant. Authoring rules — the builder — is the next phase.
 */
export function MhdAutomationsPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;

  const [tab, setTab] = useState<MhdAutomationTab>('rules');
  const rules = useMhdAutomationRules(companyId);
  const runs = useMhdAutomationRuns(companyId);
  const catalog = useMhdAutomationCatalog();

  const activeCount = (rules.data ?? []).filter((rule) => rule.isActive).length;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Automations"
        description="Rules that react to events across the platform, and the history of what they did."
      />

      <MhdTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'rules' && (
        <MhdCard className="overflow-hidden p-0">
          {rules.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading Rules…</p>
          ) : rules.error ? (
            <p className="p-6 text-sm text-red-600">{(rules.error as Error).message}</p>
          ) : (rules.data ?? []).length === 0 ? (
            <MhdEmptyState
              icon={Bot}
              title="No Automation Rules Yet"
              description="A Platform Admin provisions the starting rules for a company, then arms the ones that should run."
            />
          ) : (
            <>
              <MhdTable>
                <thead>
                  <tr>
                    <MhdTh>Rule</MhdTh>
                    <MhdTh>Trigger</MhdTh>
                    <MhdTh>Status</MhdTh>
                    <MhdTh>Steps</MhdTh>
                    <MhdTh>Last Run</MhdTh>
                  </tr>
                </thead>
                <tbody>
                  {(rules.data ?? []).map((rule) => (
                    <MhdTr key={rule.id} to={`/automations/rules/${rule.id}`}>
                      <MhdTd className="font-semibold">
                        {rule.name}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {rule.referenceId}
                        </span>
                      </MhdTd>
                      <MhdTd className="text-muted-foreground">{rule.eventLabel}</MhdTd>
                      <MhdTd>
                        <MhdBadge variant={rule.isActive ? 'success' : 'neutral'}>
                          {rule.isActive ? 'Armed' : 'Inactive'}
                        </MhdBadge>
                      </MhdTd>
                      <MhdTd className="text-muted-foreground">
                        {rule.actionCount} action{rule.actionCount === 1 ? '' : 's'}
                        {rule.conditionCount > 0 ? `, ${rule.conditionCount} condition` : ''}
                        {rule.conditionCount > 1 ? 's' : ''}
                      </MhdTd>
                      <MhdTd className="text-muted-foreground">{formatWhen(rule.lastRunAt)}</MhdTd>
                    </MhdTr>
                  ))}
                </tbody>
              </MhdTable>
              <MhdTableFooter
                summary={`Showing ${(rules.data ?? []).length} Rule${
                  (rules.data ?? []).length === 1 ? '' : 's'
                }, ${activeCount} Armed`}
              />
            </>
          )}
        </MhdCard>
      )}

      {tab === 'runs' && (
        <MhdCard className="overflow-hidden p-0">
          {runs.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading Run History…</p>
          ) : runs.error ? (
            <p className="p-6 text-sm text-red-600">{(runs.error as Error).message}</p>
          ) : (runs.data ?? []).length === 0 ? (
            <MhdEmptyState
              icon={Bot}
              title="Nothing Has Run Yet"
              description="Runs appear here once an armed rule matches an event."
            />
          ) : (
            <>
              <MhdTable>
                <thead>
                  <tr>
                    <MhdTh>Rule</MhdTh>
                    <MhdTh>Event</MhdTh>
                    <MhdTh>Result</MhdTh>
                    <MhdTh>Steps</MhdTh>
                    <MhdTh>Started</MhdTh>
                  </tr>
                </thead>
                <tbody>
                  {(runs.data ?? []).map((run) => (
                    <MhdTr key={run.id} to={`/automations/runs/${run.id}`}>
                      <MhdTd className="font-semibold">{run.ruleName}</MhdTd>
                      <MhdTd className="text-muted-foreground">
                        {run.eventTypeKey}
                        {run.sensitivityLevel !== 'STANDARD' && (
                          <MhdBadge
                            className="ml-2"
                            variant={mhdAutomationSensitivityVariant(run.sensitivityLevel)}
                          >
                            {run.sensitivityLevel}
                          </MhdBadge>
                        )}
                      </MhdTd>
                      <MhdTd>
                        <MhdBadge variant={mhdAutomationRunVariant(run.status)}>
                          {run.matched === false ? 'No Match' : run.status}
                        </MhdBadge>
                      </MhdTd>
                      <MhdTd className="text-muted-foreground">
                        {run.stepsSucceeded}/{run.stepsTotal} succeeded
                        {run.stepsFailed > 0 ? `, ${run.stepsFailed} blocked or failed` : ''}
                      </MhdTd>
                      <MhdTd className="text-muted-foreground">{formatWhen(run.startedAt)}</MhdTd>
                    </MhdTr>
                  ))}
                </tbody>
              </MhdTable>
              <MhdTableFooter summary={`Showing ${(runs.data ?? []).length} Recent Runs`} />
            </>
          )}
        </MhdCard>
      )}

      {tab === 'catalog' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            What the engine can react to, what it can do, and how it can reach people. These are
            platform-wide capabilities, not per-company settings — a rule chooses from this list.
          </p>

          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Action</MhdTh>
                  <MhdTh>What It Does</MhdTh>
                  <MhdTh>Minimum Author Role</MhdTh>
                  <MhdTh>Sensitivity Ceiling</MhdTh>
                </tr>
              </thead>
              <tbody>
                {(catalog.data?.actionTypes ?? []).map((action) => (
                  <MhdTr key={action.key}>
                    <MhdTd className="font-semibold">{action.label}</MhdTd>
                    <MhdTd className="text-muted-foreground">{action.description}</MhdTd>
                    <MhdTd className="text-muted-foreground">{action.minRole}</MhdTd>
                    <MhdTd>
                      <MhdBadge
                        variant={mhdAutomationSensitivityVariant(action.sensitivityCeiling)}
                      >
                        {action.sensitivityCeiling}
                      </MhdBadge>
                    </MhdTd>
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
            <MhdTableFooter summary="Actions An Automation Can Take" />
          </MhdCard>

          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Delivery Channel</MhdTh>
                  <MhdTh>How It Is Sent</MhdTh>
                  <MhdTh>Status</MhdTh>
                </tr>
              </thead>
              <tbody>
                {(catalog.data?.channels ?? []).map((channel) => (
                  <MhdTr key={channel.key}>
                    <MhdTd className="font-semibold">{channel.label}</MhdTd>
                    <MhdTd className="text-muted-foreground">{channel.description}</MhdTd>
                    <MhdTd>
                      <MhdBadge variant={channel.isActive ? 'success' : 'neutral'}>
                        {channel.isActive ? 'Available' : 'Not Yet Available'}
                      </MhdBadge>
                    </MhdTd>
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
            <MhdTableFooter summary="Ways An Automation Can Reach Someone" />
          </MhdCard>
        </div>
      )}
    </div>
  );
}
