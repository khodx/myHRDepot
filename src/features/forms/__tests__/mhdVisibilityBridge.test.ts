import { describe, expect, it } from 'vitest';
import { mhdVisibilityRuleToLogic } from '../Service';
import type { MhdFormField } from '../Types';

function field(partial: Partial<MhdFormField> & { id: string }): MhdFormField {
  return {
    type: 'text',
    label: partial.id,
    required: false,
    hidden: false,
    ...partial,
  } as MhdFormField;
}

describe('mhdVisibilityRuleToLogic', () => {
  it('resolves a rule that references a field by its destination-column key', () => {
    const fields = [
      field({ id: 'f1', fieldKey: 'worked_here_under_different_name' }),
      field({
        id: 'f2',
        visibilityRule: { field: 'worked_here_under_different_name', op: 'eq', value: 'true' },
      }),
    ];

    const rules = mhdVisibilityRuleToLogic(fields);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      action: 'SHOW',
      targetFieldId: 'f2',
      condition: { field: 'f1', operator: 'equals', value: 'true' },
    });
  });

  it('expands `in` to an OR of equals so multi-value conditions are not dropped', () => {
    const fields = [
      field({ id: 'state', fieldKey: 'state' }),
      field({ id: 'mnok', visibilityRule: { field: 'state', op: 'in', value: ['MN', 'OK'] } }),
    ];

    const rules = mhdVisibilityRuleToLogic(fields);
    expect(rules[0].condition).toEqual({
      combinator: 'OR',
      conditions: [
        { field: 'state', operator: 'equals', value: 'MN' },
        { field: 'state', operator: 'equals', value: 'OK' },
      ],
    });
  });

  it('maps an `all` group to AND', () => {
    const fields = [
      field({ id: 'a', fieldKey: 'election' }),
      field({ id: 'b', fieldKey: 'is_hispanic_or_latino' }),
      field({
        id: 'race',
        visibilityRule: {
          all: [
            { field: 'election', op: 'eq', value: 'COMPLETE' },
            { field: 'is_hispanic_or_latino', op: 'eq', value: 'false' },
          ],
        },
      }),
    ];

    const rules = mhdVisibilityRuleToLogic(fields);
    expect(rules[0].condition).toMatchObject({ combinator: 'AND' });
  });

  it('emits nothing for fields without a rule', () => {
    expect(mhdVisibilityRuleToLogic([field({ id: 'plain' })])).toHaveLength(0);
  });
});
