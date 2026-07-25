import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const { mhdAutomationService } = await import('../Service');

function ok(data: unknown) {
  return { data, error: null };
}

function fail(message: string) {
  return { data: null, error: { message } };
}

describe('mhdAutomationService', () => {
  beforeEach(() => mockRpc.mockReset());

  it('maps snake_case rule rows onto the camelCase domain type', async () => {
    mockRpc.mockReturnValue(
      ok([
        {
          id: 'rule-1',
          reference_id: 'ARUL-000001',
          company_id: 'company-1',
          event_type_key: 'RECRUITING_OFFER_ACCEPTED',
          event_label: 'Offer Accepted',
          name: 'New Hire: Start Onboarding',
          description: null,
          is_active: false,
          max_sensitivity: 'STANDARD',
          authored_by: 'user-1',
          authorized_by: null,
          authorized_at: null,
          action_count: 3,
          condition_count: 0,
          last_run_at: null,
          created_at: '2026-07-25T00:00:00.000Z',
        },
      ]),
    );

    const rules = await mhdAutomationService.listRules('company-1');

    expect(mockRpc).toHaveBeenCalledWith('mhd_automation_list_rules', {
      p_company_id: 'company-1',
    });
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      referenceId: 'ARUL-000001',
      eventLabel: 'Offer Accepted',
      isActive: false,
      actionCount: 3,
    });
  });

  it('surfaces a readable error rather than the raw postgres message alone', async () => {
    mockRpc.mockReturnValue(fail('permission denied'));

    await expect(mhdAutomationService.listRules('company-1')).rejects.toThrow(
      'Unable to load automation rules: permission denied',
    );
  });

  it('returns the assembled rule detail without remapping it', async () => {
    // mhd_automation_get_rule builds camelCase JSON server-side, so the service
    // must pass it through — remapping would be a second, drifting contract.
    mockRpc.mockReturnValue(
      ok({
        id: 'rule-1',
        name: 'New Hire: Start Onboarding',
        actions: [{ id: 'a1', sortOrder: 0, actionTypeKey: 'ONBOARDING_START_PACKET' }],
        conditions: [],
      }),
    );

    const detail = await mhdAutomationService.getRule('rule-1');

    expect(mockRpc).toHaveBeenCalledWith('mhd_automation_get_rule', { p_rule_id: 'rule-1' });
    expect(detail.actions[0]?.actionTypeKey).toBe('ONBOARDING_START_PACKET');
  });

  it('treats a missing rule as an error rather than returning undefined', async () => {
    mockRpc.mockReturnValue(ok(null));

    await expect(mhdAutomationService.getRule('nope')).rejects.toThrow(
      'That automation rule could not be found.',
    );
  });

  it('maps run rows including the step tallies used by the list surface', async () => {
    mockRpc.mockReturnValue(
      ok([
        {
          id: 'run-1',
          reference_id: 'ARUN-000001',
          rule_id: 'rule-1',
          rule_name: 'New Hire: Start Onboarding',
          event_id: 'event-1',
          event_type_key: 'RECRUITING_OFFER_ACCEPTED',
          event_reference_id: 'AEVT-000001',
          sensitivity_level: 'STANDARD',
          status: 'SUCCEEDED',
          matched: true,
          started_at: '2026-07-25T00:00:00.000Z',
          finished_at: '2026-07-25T00:00:01.000Z',
          error_text: null,
          steps_total: 3,
          steps_succeeded: 3,
          steps_failed: 0,
        },
      ]),
    );

    const runs = await mhdAutomationService.listRuns('company-1', 10);

    expect(mockRpc).toHaveBeenCalledWith('mhd_automation_list_runs', {
      p_company_id: 'company-1',
      p_limit: 10,
    });
    expect(runs[0]).toMatchObject({ stepsSucceeded: 3, stepsTotal: 3, matched: true });
  });

  it('preserves the withheld-payload signal on a restricted run', async () => {
    // payloadVisible false with a null payload means the server declined to send
    // it, not that the event had none. Collapsing those two would make the run
    // page claim an empty event.
    mockRpc.mockReturnValue(
      ok({
        id: 'run-1',
        status: 'SUCCEEDED',
        event: { sensitivityLevel: 'MEDICAL', payloadVisible: false, payload: null },
        steps: [],
      }),
    );

    const detail = await mhdAutomationService.getRun('run-1');

    expect(detail.event.payloadVisible).toBe(false);
    expect(detail.event.payload).toBeNull();
  });

  it('arms a rule through the authorization ceremony', async () => {
    mockRpc.mockReturnValue(ok([{ id: 'rule-1', name: 'r', is_active: true }]));

    const isActive = await mhdAutomationService.setRuleActive({
      ruleId: 'rule-1',
      isActive: true,
    });

    expect(mockRpc).toHaveBeenCalledWith('mhd_automation_set_rule_active', {
      p_rule_id: 'rule-1',
      p_is_active: true,
    });
    expect(isActive).toBe(true);
  });

  it('words the arming failure according to the direction attempted', async () => {
    mockRpc.mockReturnValue(fail('Only a Platform Admin may arm or disarm an automation rule'));

    await expect(
      mhdAutomationService.setRuleActive({ ruleId: 'rule-1', isActive: false }),
    ).rejects.toThrow(/Unable to disarm the automation rule/);
  });

  it('falls back to an empty catalog rather than throwing on a null payload', async () => {
    mockRpc.mockReturnValue(ok(null));

    await expect(mhdAutomationService.getCatalog()).resolves.toEqual({
      eventTypes: [],
      actionTypes: [],
      recipientKinds: [],
      channels: [],
    });
  });
});
