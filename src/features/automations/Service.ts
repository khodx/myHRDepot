import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAutomationCatalog,
  MhdAutomationRuleDetail,
  MhdAutomationRuleSummary,
  MhdAutomationRunDetail,
  MhdAutomationRunSummary,
  MhdAutomationSetRuleActiveInput,
} from './Types';

/**
 * The automation RPCs (migrations 0081-0085) are deliberately NOT in
 * src/types/database.types.ts.
 *
 * Regenerating that file from the local stack produces a 40,000-line diff and
 * two type errors in files this feature does not own — one of them
 * features/onboarding/Service.ts, which another session is editing right now
 * (a nullable RPC argument the generator types as non-null), and one TS2589
 * "type instantiation is excessively deep" in features/performance/Service.ts,
 * which the larger generated union tips over. Neither is this feature's to fix
 * mid-flight, and clobbering a shared generated file while another session is
 * working in it is how two agents corrupt each other's work.
 *
 * So the RPC boundary is typed locally instead. Everything past this seam is
 * fully typed by the domain interfaces in ./Types — the untyped surface is one
 * function, in one file, with the row shapes checked by the map* functions
 * below. When database.types.ts is next regenerated (and the two errors above
 * are dealt with deliberately), this can be swapped for the generated client
 * with no change to any caller.
 */
type MhdRpcResult<T> = { data: T | null; error: { message: string } | null };

const mhdRpc = supabaseClient.rpc.bind(supabaseClient) as unknown as <T>(
  fn: string,
  args?: Record<string, unknown>,
) => PromiseLike<MhdRpcResult<T>>;

type MhdAutomationRuleRow = {
  id: string;
  reference_id: string;
  company_id: string;
  event_type_key: string;
  event_label: string;
  name: string;
  description: string | null;
  is_active: boolean;
  max_sensitivity: MhdAutomationRuleSummary['maxSensitivity'];
  authored_by: string;
  authorized_by: string | null;
  authorized_at: string | null;
  action_count: number;
  condition_count: number;
  last_run_at: string | null;
  created_at: string;
};

type MhdAutomationRunRow = {
  id: string;
  reference_id: string;
  rule_id: string;
  rule_name: string;
  event_id: string;
  event_type_key: string;
  event_reference_id: string;
  sensitivity_level: MhdAutomationRunSummary['sensitivityLevel'];
  status: MhdAutomationRunSummary['status'];
  matched: boolean | null;
  started_at: string;
  finished_at: string | null;
  error_text: string | null;
  steps_total: number;
  steps_succeeded: number;
  steps_failed: number;
};

type MhdSetRuleActiveRow = {
  id: string;
  name: string;
  is_active: boolean;
  authorized_by: string | null;
  authorized_at: string | null;
};

function mapRuleRow(row: MhdAutomationRuleRow): MhdAutomationRuleSummary {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    eventTypeKey: row.event_type_key,
    eventLabel: row.event_label,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    maxSensitivity: row.max_sensitivity,
    authoredBy: row.authored_by,
    authorizedBy: row.authorized_by,
    authorizedAt: row.authorized_at,
    actionCount: row.action_count,
    conditionCount: row.condition_count,
    lastRunAt: row.last_run_at,
    createdAt: row.created_at,
  };
}

function mapRunRow(row: MhdAutomationRunRow): MhdAutomationRunSummary {
  return {
    id: row.id,
    referenceId: row.reference_id,
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    eventId: row.event_id,
    eventTypeKey: row.event_type_key,
    eventReferenceId: row.event_reference_id,
    sensitivityLevel: row.sensitivity_level,
    status: row.status,
    matched: row.matched,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorText: row.error_text,
    stepsTotal: row.steps_total,
    stepsSucceeded: row.steps_succeeded,
    stepsFailed: row.steps_failed,
  };
}

export const mhdAutomationService = {
  async listRules(companyId: string): Promise<MhdAutomationRuleSummary[]> {
    const { data, error } = await mhdRpc<MhdAutomationRuleRow[]>('mhd_automation_list_rules', {
      p_company_id: companyId,
    });

    if (error) {
      throw new Error(`Unable to load automation rules: ${error.message}`);
    }

    return (data ?? []).map(mapRuleRow);
  },

  /**
   * mhd_automation_get_rule returns camelCase JSON already assembled server-side
   * (event type, conditions and ordered actions in one round trip), so there is
   * no row mapping to do — unlike the list RPCs, which return SQL rows.
   */
  async getRule(ruleId: string): Promise<MhdAutomationRuleDetail> {
    const { data, error } = await mhdRpc<MhdAutomationRuleDetail>('mhd_automation_get_rule', {
      p_rule_id: ruleId,
    });

    if (error) {
      throw new Error(`Unable to load the automation rule: ${error.message}`);
    }
    if (!data) {
      throw new Error('That automation rule could not be found.');
    }

    return data;
  },

  async listRuns(companyId: string, limit = 50): Promise<MhdAutomationRunSummary[]> {
    const { data, error } = await mhdRpc<MhdAutomationRunRow[]>('mhd_automation_list_runs', {
      p_company_id: companyId,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Unable to load automation runs: ${error.message}`);
    }

    return (data ?? []).map(mapRunRow);
  },

  async getRun(runId: string): Promise<MhdAutomationRunDetail> {
    const { data, error } = await mhdRpc<MhdAutomationRunDetail>('mhd_automation_get_run', {
      p_run_id: runId,
    });

    if (error) {
      throw new Error(`Unable to load the automation run: ${error.message}`);
    }
    if (!data) {
      throw new Error('That automation run could not be found.');
    }

    return data;
  },

  async getCatalog(): Promise<MhdAutomationCatalog> {
    const { data, error } = await mhdRpc<MhdAutomationCatalog>('mhd_automation_list_catalog');

    if (error) {
      throw new Error(`Unable to load the automation catalog: ${error.message}`);
    }

    return data ?? { eventTypes: [], actionTypes: [], recipientKinds: [], channels: [] };
  },

  /**
   * Arming records WHO authorized the rule — the constraint
   * automation_rules_active_requires_authorization refuses an active rule with
   * no authorizer. Platform Admin only, enforced server-side; the UI gate is
   * only about whether the control renders.
   */
  async setRuleActive(
    input: MhdAutomationSetRuleActiveInput,
  ): Promise<MhdAutomationRuleSummary['isActive']> {
    const { data, error } = await mhdRpc<MhdSetRuleActiveRow[]>('mhd_automation_set_rule_active', {
      p_rule_id: input.ruleId,
      p_is_active: input.isActive,
    });

    if (error) {
      throw new Error(
        `Unable to ${input.isActive ? 'arm' : 'disarm'} the automation rule: ${error.message}`,
      );
    }

    return data?.[0]?.is_active ?? input.isActive;
  },
};
