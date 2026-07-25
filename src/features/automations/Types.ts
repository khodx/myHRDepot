/**
 * Automation Engine (04.13) — domain types.
 *
 * Backed by migrations 0081-0085. The engine is registry-driven: events, actions
 * and recipient kinds are rows in platform-global catalogs, and the executor
 * dispatches through them rather than naming any concrete action. That is why
 * the keys below are plain `string` rather than string-literal unions — a new
 * capability is added by inserting a registry row, and a union here would have to
 * be edited every time, turning a data change into a code change.
 *
 * The four sensitivity tiers ARE a closed set (0051), so those stay unions.
 */

export type MhdAutomationSensitivity = 'STANDARD' | 'IMPLEMENTATION' | 'RESTRICTED' | 'MEDICAL';

export type MhdAutomationRunStatus =
  'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';

export type MhdAutomationStepStatus = MhdAutomationRunStatus | 'SCHEDULED';

export type MhdAutomationEventStatus =
  'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'SKIPPED';

export interface MhdAutomationRuleSummary {
  id: string;
  referenceId: string;
  companyId: string;
  eventTypeKey: string;
  eventLabel: string;
  name: string;
  description: string | null;
  isActive: boolean;
  maxSensitivity: MhdAutomationSensitivity;
  authoredBy: string;
  authorizedBy: string | null;
  authorizedAt: string | null;
  actionCount: number;
  conditionCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

export interface MhdAutomationCondition {
  id: string;
  groupIndex: number;
  path: string;
  operator: string;
  value: unknown;
}

export interface MhdAutomationAction {
  id: string;
  sortOrder: number;
  actionTypeKey: string;
  actionLabel: string;
  minRole: string;
  sensitivityCeiling: MhdAutomationSensitivity;
  config: Record<string, unknown>;
  continueOnError: boolean;
  delaySeconds: number;
}

export interface MhdAutomationEventTypeRef {
  key: string;
  label: string;
  description: string | null;
  entityType: string;
  sensitivityTier: MhdAutomationSensitivity;
  /** Dotted payload paths a rule may read and a template may interpolate. */
  payloadAllowlist: string[] | null;
}

export interface MhdAutomationRuleDetail {
  id: string;
  referenceId: string;
  companyId: string;
  eventTypeKey: string;
  name: string;
  description: string | null;
  isActive: boolean;
  maxSensitivity: MhdAutomationSensitivity;
  authoredBy: string;
  authorizedBy: string | null;
  authorizedAt: string | null;
  createdAt: string;
  eventType: MhdAutomationEventTypeRef | null;
  conditions: MhdAutomationCondition[];
  actions: MhdAutomationAction[];
}

export interface MhdAutomationRunSummary {
  id: string;
  referenceId: string;
  ruleId: string;
  ruleName: string;
  eventId: string;
  eventTypeKey: string;
  eventReferenceId: string;
  sensitivityLevel: MhdAutomationSensitivity;
  status: MhdAutomationRunStatus;
  matched: boolean | null;
  startedAt: string;
  finishedAt: string | null;
  errorText: string | null;
  stepsTotal: number;
  stepsSucceeded: number;
  stepsFailed: number;
}

export interface MhdAutomationRunStep {
  id: string;
  sortOrder: number;
  actionTypeKey: string;
  status: MhdAutomationStepStatus;
  attempts: number;
  result: Record<string, unknown> | null;
  lastError: string | null;
  completedAt: string | null;
}

export interface MhdAutomationRunEvent {
  id: string;
  referenceId: string;
  eventTypeKey: string;
  entityType: string;
  entityId: string | null;
  sensitivityLevel: MhdAutomationSensitivity;
  occurredAt: string;
  status: MhdAutomationEventStatus;
  /**
   * False when the caller's role is below the event's sensitivity tier. The
   * payload is then null — withheld, not empty — so the surface can say so
   * rather than rendering a misleading blank. Mirrors the RLS partition in 0081.
   */
  payloadVisible: boolean;
  payload: Record<string, unknown> | null;
}

export interface MhdAutomationRunDetail {
  id: string;
  referenceId: string;
  status: MhdAutomationRunStatus;
  matched: boolean | null;
  depth: number;
  startedAt: string;
  finishedAt: string | null;
  errorText: string | null;
  rule: { id: string; name: string; referenceId: string; isActive: boolean } | null;
  event: MhdAutomationRunEvent;
  steps: MhdAutomationRunStep[];
}

export interface MhdAutomationCatalogEntry {
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
}

export interface MhdAutomationActionTypeEntry extends MhdAutomationCatalogEntry {
  minRole: string;
  sensitivityCeiling: MhdAutomationSensitivity;
  configSchema: Record<string, unknown>;
}

export interface MhdAutomationEventTypeEntry extends MhdAutomationCatalogEntry {
  entityType: string;
  sensitivityTier: MhdAutomationSensitivity;
  payloadAllowlist: string[] | null;
}

export interface MhdAutomationChannelEntry extends MhdAutomationCatalogEntry {
  dispatchMode: 'IMMEDIATE' | 'INTERNAL' | 'EXTERNAL';
}

export interface MhdAutomationCatalog {
  eventTypes: MhdAutomationEventTypeEntry[];
  actionTypes: MhdAutomationActionTypeEntry[];
  recipientKinds: MhdAutomationCatalogEntry[];
  channels: MhdAutomationChannelEntry[];
}

export interface MhdAutomationSetRuleActiveInput {
  ruleId: string;
  isActive: boolean;
}

/** Ordering used wherever a sensitivity tier is compared or sorted. */
export const MHD_AUTOMATION_SENSITIVITY_RANK: Record<MhdAutomationSensitivity, number> = {
  STANDARD: 0,
  IMPLEMENTATION: 1,
  RESTRICTED: 2,
  MEDICAL: 3,
};
