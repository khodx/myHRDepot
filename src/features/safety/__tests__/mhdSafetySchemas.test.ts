import { describe, expect, it } from 'vitest';
import {
  mhdOshaAnnualSummaryCertifySchema,
  mhdOshaEstablishmentSchema,
  mhdSafetyIncidentSchema,
  mhdSafetyIncidentUpdateSchema,
} from '../Schemas';

describe('mhdOshaEstablishmentSchema', () => {
  it('accepts a well-formed establishment and uppercases the state code', () => {
    const parsed = mhdOshaEstablishmentSchema.parse({
      establishmentName: 'Main Plant',
      naicsCode: '453998',
      addressState: 'tx',
      averageEmployeeCount: 50,
      totalHoursWorkedYtd: 100000,
    });
    expect(parsed.addressState).toBe('TX');
  });

  it('rejects a state code that is not exactly 2 letters', () => {
    const result = mhdOshaEstablishmentSchema.safeParse({
      establishmentName: 'Main Plant',
      naicsCode: '453998',
      addressState: 'Texas',
      averageEmployeeCount: 50,
      totalHoursWorkedYtd: 100000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative employee count', () => {
    const result = mhdOshaEstablishmentSchema.safeParse({
      establishmentName: 'Main Plant',
      naicsCode: '453998',
      addressState: 'TX',
      averageEmployeeCount: -1,
      totalHoursWorkedYtd: 100000,
    });
    expect(result.success).toBe(false);
  });
});

describe('mhdSafetyIncidentSchema — subject required (mirrors the DB CHECK constraint)', () => {
  const base = {
    establishmentId: '11111111-1111-4111-8111-111111111111',
    dateOfIncident: '2026-01-15',
    whatHappened: 'Fell from a ladder.',
    injuryIllnessDescription: 'Fractured wrist.',
    classification: 'DAYS_AWAY_FROM_WORK' as const,
  };

  it('accepts a case with a linked person and no non-employee name', () => {
    const result = mhdSafetyIncidentSchema.safeParse({
      ...base,
      personId: '22222222-2222-4222-8222-222222222222',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a case with a non-employee name and no linked person', () => {
    const result = mhdSafetyIncidentSchema.safeParse({
      ...base,
      nonEmployeeName: 'Jordan Contractor',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a case with neither a person nor a non-employee name', () => {
    const result = mhdSafetyIncidentSchema.safeParse({ ...base });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown classification value', () => {
    const result = mhdSafetyIncidentSchema.safeParse({
      ...base,
      nonEmployeeName: 'Jordan Contractor',
      classification: 'SOMETHING_ELSE',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative days-away count', () => {
    const result = mhdSafetyIncidentSchema.safeParse({
      ...base,
      nonEmployeeName: 'Jordan Contractor',
      daysAwayCount: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('mhdSafetyIncidentUpdateSchema', () => {
  it('accepts a partial update with only one field', () => {
    const result = mhdSafetyIncidentUpdateSchema.safeParse({ jobTitle: 'Line Lead' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid illness type', () => {
    const result = mhdSafetyIncidentUpdateSchema.safeParse({ illnessType: 'FLU' });
    expect(result.success).toBe(false);
  });
});

describe('mhdOshaAnnualSummaryCertifySchema', () => {
  it('requires both the certifying official name and title', () => {
    expect(
      mhdOshaAnnualSummaryCertifySchema.safeParse({
        certifyingOfficialName: '',
        certifyingOfficialTitle: 'VP Operations',
      }).success,
    ).toBe(false);
    expect(
      mhdOshaAnnualSummaryCertifySchema.safeParse({
        certifyingOfficialName: 'Jane Certifier',
        certifyingOfficialTitle: '',
      }).success,
    ).toBe(false);
    expect(
      mhdOshaAnnualSummaryCertifySchema.safeParse({
        certifyingOfficialName: 'Jane Certifier',
        certifyingOfficialTitle: 'VP Operations',
      }).success,
    ).toBe(true);
  });
});
