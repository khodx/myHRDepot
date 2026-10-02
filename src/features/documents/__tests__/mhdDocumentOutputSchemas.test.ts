import { describe, expect, it } from 'vitest';
import {
  mhdDocumentBrandingFormSchema,
  mhdDocumentMergeOverridesSchema,
  mhdDocumentNarrativeSectionsSchema,
  mhdDocumentNarrativeSlotsSchema,
  mhdDocumentProhibitedMedicalDetailPattern,
  mhdEnqueueDocumentSchema,
} from '../Schemas';

const validBranding = {
  headerText: 'Northstar People',
  footerText: 'Confidential',
  accentColor: '#0003AA',
  fontFamily: 'Georgia' as const,
  logoDataUri: 'data:image/png;base64,QUJDRA==',
  showReferenceId: true,
};

describe('wizard output schemas', () => {
  it('accepts valid overrides and rejects invalid paths and prohibited language', () => {
    expect(
      mhdDocumentMergeOverridesSchema.safeParse({
        'person.display_name': 'Marisol Vega',
        'record.step': 4,
        'custom.flag': null,
      }).success,
    ).toBe(true);
    expect(mhdDocumentMergeOverridesSchema.safeParse({ 'task.display_name': 'No' }).success).toBe(
      false,
    );
    expect(
      mhdDocumentMergeOverridesSchema.safeParse({ 'record.notes': 'Medical records are attached.' })
        .success,
    ).toBe(false);
    expect(mhdDocumentProhibitedMedicalDetailPattern.test('genetic information')).toBe(true);
  });
  it('accepts narrative sections and rejects malformed keys, long text, and prohibited language', () => {
    expect(
      mhdDocumentNarrativeSectionsSchema.safeParse({ summary: 'A clear operational summary.' })
        .success,
    ).toBe(true);
    expect(mhdDocumentNarrativeSectionsSchema.safeParse({ 'Bad-Key': 'No' }).success).toBe(false);
    expect(mhdDocumentNarrativeSectionsSchema.safeParse({ summary: 'diagnosis' }).success).toBe(
      false,
    );
    expect(
      mhdDocumentNarrativeSectionsSchema.safeParse({ summary: 'x'.repeat(8001) }).success,
    ).toBe(false);
  });
  it('validates narrative slot labels and unique keys', () => {
    expect(
      mhdDocumentNarrativeSlotsSchema.safeParse([
        { key: 'purpose', label: 'Purpose', help: 'Why this exists' },
      ]).success,
    ).toBe(true);
    expect(
      mhdDocumentNarrativeSlotsSchema.safeParse([
        { key: 'purpose', label: 'Purpose' },
        { key: 'purpose', label: 'Again' },
      ]).success,
    ).toBe(false);
    expect(
      mhdDocumentNarrativeSlotsSchema.safeParse([{ key: '1purpose', label: 'Purpose' }]).success,
    ).toBe(false);
    expect(
      mhdDocumentNarrativeSlotsSchema.safeParse([{ key: 'purpose', label: '   ' }]).success,
    ).toBe(false);
  });
  it('enforces branding accent, font, logo, and length rules', () => {
    expect(mhdDocumentBrandingFormSchema.safeParse(validBranding).success).toBe(true);
    expect(
      mhdDocumentBrandingFormSchema.safeParse({ ...validBranding, accentColor: '#03AA' }).success,
    ).toBe(false);
    expect(
      mhdDocumentBrandingFormSchema.safeParse({ ...validBranding, fontFamily: 'Papyrus' }).success,
    ).toBe(false);
    expect(
      mhdDocumentBrandingFormSchema.safeParse({
        ...validBranding,
        logoDataUri: 'data:image/svg+xml;base64,QUJDRA==',
      }).success,
    ).toBe(false);
    expect(
      mhdDocumentBrandingFormSchema.safeParse({ ...validBranding, headerText: 'x'.repeat(201) })
        .success,
    ).toBe(false);
  });
  it('validates the enqueue input and optional pieces', () => {
    expect(
      mhdEnqueueDocumentSchema.safeParse({
        companyId: crypto.randomUUID(),
        templateKey: 'ONBOARDING_PACKET',
        entityType: 'ONBOARDING',
        entityId: crypto.randomUUID(),
        sourceWizard: 'ONBOARDING',
        mergeOverrides: { 'person.display_name': 'Marisol Vega' },
        narrativeSections: { purpose: 'Welcome' },
        outputFormat: 'PDF',
        employeeFileCategory: 'hr',
      }).success,
    ).toBe(true);
    expect(
      mhdEnqueueDocumentSchema.safeParse({
        companyId: crypto.randomUUID(),
        templateKey: 'EXIT_ACKNOWLEDGMENT',
        entityType: 'OFFBOARDING_CASE',
        entityId: crypto.randomUUID(),
        sourceWizard: 'OFFBOARDING',
        employeeFileCategory: 'NONE',
      }).success,
    ).toBe(true);
    expect(
      mhdEnqueueDocumentSchema.safeParse({
        companyId: crypto.randomUUID(),
        templateKey: 'EXIT_ACKNOWLEDGMENT',
        entityType: 'OFFBOARDING_CASE',
        entityId: crypto.randomUUID(),
        sourceWizard: 'OFFBOARDING',
        employeeFileCategory: 'medical',
      }).success,
    ).toBe(false);
    expect(
      mhdEnqueueDocumentSchema.safeParse({
        companyId: 'company',
        templateKey: 'bad-key',
        entityType: 'ONBOARDING',
        entityId: 'entity',
        sourceWizard: 'ONBOARDING',
      }).success,
    ).toBe(false);
    expect(
      mhdEnqueueDocumentSchema.safeParse({
        companyId: 'company',
        templateKey: 'ONBOARDING_PACKET',
        entityType: 'ONBOARDING',
        entityId: 'entity',
        sourceWizard: 'NOT_A_WIZARD',
      }).success,
    ).toBe(false);
  });
});
