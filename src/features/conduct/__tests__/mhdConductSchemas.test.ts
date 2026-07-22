import { describe, expect, it } from 'vitest';
import {
  mhdConductActionFormSchema,
  mhdConductCaseFilterSchema,
  mhdConductCaseFormSchema,
  mhdConductCaseTransitionSchema,
  mhdConductOutcomeSchema,
} from '../Schemas';

describe('conduct schemas', () => {
  it('accepts a valid case and requires a subject and company', () => {
    expect(
      mhdConductCaseFormSchema.parse({
        companyId: 'company-1',
        personId: 'person-1',
        category: 'PERFORMANCE',
      }).category,
    ).toBe('PERFORMANCE');
    expect(() =>
      mhdConductCaseFormSchema.parse({ companyId: '', personId: 'person-1', category: 'CONDUCT' }),
    ).toThrow('Company is required.');
    expect(() =>
      mhdConductCaseFormSchema.parse({ companyId: 'company-1', personId: '  ', category: 'CONDUCT' }),
    ).toThrow('Subject employee is required.');
  });

  it('requires a non-blank reason only when rescinding a case', () => {
    expect(mhdConductCaseTransitionSchema.parse({ newStatus: 'CLOSED' }).newStatus).toBe('CLOSED');
    expect(() => mhdConductCaseTransitionSchema.parse({ newStatus: 'RESCINDED' })).toThrow(
      'A reason is required to rescind a conduct case.',
    );
    expect(() =>
      mhdConductCaseTransitionSchema.parse({ newStatus: 'RESCINDED', rescindReason: '   ' }),
    ).toThrow('A reason is required to rescind a conduct case.');
    expect(
      mhdConductCaseTransitionSchema.parse({
        newStatus: 'RESCINDED',
        rescindReason: 'Investigation cleared the employee.',
      }).rescindReason,
    ).toBe('Investigation cleared the employee.');
  });

  it('defaults requiresDocument to true on the action form', () => {
    expect(mhdConductActionFormSchema.parse({ severity: 'WRITTEN_WARNING' }).requiresDocument).toBe(true);
    expect(
      mhdConductActionFormSchema.parse({ severity: 'VERBAL_WARNING', requiresDocument: false })
        .requiresDocument,
    ).toBe(false);
  });

  it('requires a reason for REFUSED and WAIVED but not for ACKNOWLEDGED', () => {
    // ACKNOWLEDGED carries no reason — the RPC stamps RECEIPT and gates it on the
    // signature completing; it is never a free assent choice.
    expect(mhdConductOutcomeSchema.parse({ outcome: 'ACKNOWLEDGED' }).outcome).toBe('ACKNOWLEDGED');
    expect(() => mhdConductOutcomeSchema.parse({ outcome: 'REFUSED' })).toThrow(
      'A reason is required to record a refusal or a waiver.',
    );
    expect(() => mhdConductOutcomeSchema.parse({ outcome: 'WAIVED', reason: '   ' })).toThrow(
      'A reason is required to record a refusal or a waiver.',
    );
    expect(
      mhdConductOutcomeSchema.parse({
        outcome: 'REFUSED',
        reason: 'Employee declined to sign.',
        witnessUserId: 'user-9',
      }).witnessUserId,
    ).toBe('user-9');
  });

  it('defaults every optional filter to its ALL / empty sentinel', () => {
    const filters = mhdConductCaseFilterSchema.parse({ companyId: 'company-1' });
    expect(filters).toEqual({
      companyId: 'company-1',
      personId: 'ALL',
      category: 'ALL',
      status: 'ALL',
      searchTerm: '',
    });
  });
});
