import { describe, expect, it } from 'vitest';
import {
  mhdInvestigationCaseFormSchema,
  mhdInvestigationGrantSchema,
  mhdTransitionInvestigationSchema,
} from '../Schemas';

describe('investigations schemas', () => {
  it('requires a company and a non-blank allegation to open a case, defaulting confidentiality', () => {
    expect(
      mhdInvestigationCaseFormSchema.parse({
        companyId: 'company-1',
        caseType: 'HARASSMENT',
        allegation: 'A detailed narrative of the allegation.',
      }).confidentiality,
    ).toBe('STANDARD');

    expect(() =>
      mhdInvestigationCaseFormSchema.parse({
        companyId: '',
        caseType: 'HARASSMENT',
        allegation: 'x',
      }),
    ).toThrow('Company is required.');

    expect(() =>
      mhdInvestigationCaseFormSchema.parse({
        companyId: 'company-1',
        caseType: 'HARASSMENT',
        allegation: '   ',
      }),
    ).toThrow('An allegation is required to open a case.');
  });

  it('requires a disposition ONLY when the transition target is CLOSED', () => {
    expect(
      mhdTransitionInvestigationSchema.parse({ caseId: 'case-1', newStatus: 'INVESTIGATING' })
        .newStatus,
    ).toBe('INVESTIGATING');

    expect(() =>
      mhdTransitionInvestigationSchema.parse({ caseId: 'case-1', newStatus: 'CLOSED' }),
    ).toThrow('Closing an investigation requires a disposition.');

    expect(
      mhdTransitionInvestigationSchema.parse({
        caseId: 'case-1',
        newStatus: 'CLOSED',
        disposition: 'SUBSTANTIATED',
      }).disposition,
    ).toBe('SUBSTANTIATED');
  });

  it('grant requires a user to let in — there is deliberately no role field', () => {
    expect(mhdInvestigationGrantSchema.parse({ caseId: 'case-1', userId: 'user-1' }).userId).toBe(
      'user-1',
    );
    expect(() => mhdInvestigationGrantSchema.parse({ caseId: 'case-1', userId: '' })).toThrow(
      'Choose a user to grant access to.',
    );
  });
});
