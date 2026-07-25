import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanArmAutomations } from '@/appshell/mhdRouteAccess';
import { useMhdAutomationRule, useMhdSetAutomationRuleActive } from '../Hook';
import { mhdAutomationSensitivityVariant } from '../mhdAutomationBadges';

function describeCondition(path: string, operator: string, value: unknown): string {
  switch (operator) {
    case 'IS_NULL':
      return `${path} is empty`;
    case 'IS_NOT_NULL':
      return `${path} is set`;
    case 'CHANGED':
      return `${path} changed`;
    default:
      return `${path} ${operator.toLowerCase().replace('_', ' ')} ${JSON.stringify(value)}`;
  }
}

/**
 * /automations/rules/:ruleId — one rule, its trigger, its conditions and the
 * ordered actions it takes.
 *
 * The only mutation here is arming. Everything else is read-only until the rule
 * builder ships.
 */
export function MhdAutomationRuleDetailPage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const { profile, roles } = useMhdAuth();
  const rule = useMhdAutomationRule(ruleId ?? null);
  const setActive = useMhdSetAutomationRuleActive(profile?.companyId ?? null);

  const canArm = mhdCanArmAutomations(roles);

  if (rule.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading Rule…</p>;
  }

  if (rule.error || !rule.data) {
    return (
      <MhdCard className="p-6">
        <p className="text-sm text-red-600">
          {(rule.error as Error | undefined)?.message ?? 'That automation rule could not be found.'}
        </p>
      </MhdCard>
    );
  }

  const detail = rule.data;
  const conditionGroups = detail.conditions.reduce<Record<number, typeof detail.conditions>>(
    (groups, condition) => {
      const list = groups[condition.groupIndex] ?? [];
      list.push(condition);
      groups[condition.groupIndex] = list;
      return groups;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={detail.name}
        description={detail.description ?? undefined}
        backTo="/automations"
        backLabel="Automations"
        chips={
          <>
            <MhdBadge variant={detail.isActive ? 'success' : 'neutral'}>
              {detail.isActive ? 'Armed' : 'Inactive'}
            </MhdBadge>
            <MhdBadge variant={mhdAutomationSensitivityVariant(detail.maxSensitivity)}>
              Max {detail.maxSensitivity}
            </MhdBadge>
          </>
        }
        actions={
          canArm ? (
            <Button
              variant={detail.isActive ? 'secondary' : 'primary'}
              disabled={setActive.isPending}
              onClick={() => setActive.mutate({ ruleId: detail.id, isActive: !detail.isActive })}
            >
              {detail.isActive ? 'Disarm Rule' : 'Arm Rule'}
            </Button>
          ) : undefined
        }
      />

      {setActive.error && (
        <p className="text-sm text-red-600">{(setActive.error as Error).message}</p>
      )}

      <MhdCard className="p-6">
        <h2 className="text-base font-semibold text-foreground">Trigger</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {detail.eventType?.label ?? detail.eventTypeKey}
          {detail.eventType?.description ? ` — ${detail.eventType.description}` : ''}
        </p>
        {detail.eventType?.payloadAllowlist && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-foreground">Readable Fields</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Only these fields reach a condition or a message template. Anything else is stripped
              before the event is stored, so it cannot be referenced at all.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {detail.eventType.payloadAllowlist.map((path) => (
                <MhdBadge key={path} variant="neutral">
                  {path}
                </MhdBadge>
              ))}
            </div>
          </>
        )}
      </MhdCard>

      <MhdCard className="p-6">
        <h2 className="text-base font-semibold text-foreground">Conditions</h2>
        {detail.conditions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No conditions — this rule runs for every {detail.eventType?.label ?? 'matching'} event.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {Object.entries(conditionGroups).map(([groupIndex, conditions], index) => (
              <div key={groupIndex}>
                {index > 0 && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    Or
                  </p>
                )}
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {conditions.map((condition) => (
                    <li key={condition.id}>
                      {describeCondition(condition.path, condition.operator, condition.value)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </MhdCard>

      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>#</MhdTh>
              <MhdTh>Action</MhdTh>
              <MhdTh>Configuration</MhdTh>
              <MhdTh>Ceiling</MhdTh>
            </tr>
          </thead>
          <tbody>
            {detail.actions.map((action) => (
              <MhdTr key={action.id}>
                <MhdTd className="text-muted-foreground">{action.sortOrder + 1}</MhdTd>
                <MhdTd className="font-semibold">
                  {action.actionLabel}
                  {action.delaySeconds > 0 && (
                    <MhdBadge className="ml-2" variant="info">
                      After {action.delaySeconds}s
                    </MhdBadge>
                  )}
                </MhdTd>
                <MhdTd className="text-muted-foreground">
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(action.config, null, 2)}
                  </pre>
                </MhdTd>
                <MhdTd>
                  <MhdBadge variant={mhdAutomationSensitivityVariant(action.sensitivityCeiling)}>
                    {action.sensitivityCeiling}
                  </MhdBadge>
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      </MhdCard>
    </div>
  );
}
