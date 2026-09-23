import { describe, expect, it } from 'vitest';
import { mhdAssessmentCreateSchema, mhdAssessmentItemCreateSchema } from '../Schemas';

const companyId = '00000000-0000-4000-8000-000000000001';
describe('assessment schemas', () => {
  it('defaults fixed assessment creation values', () => {
    const result = mhdAssessmentCreateSchema.parse({ companyId, title: 'Screening' });
    expect(result.assemblyMode).toBe('FIXED');
    expect(result.itemIds).toEqual([]);
  });
  it('accepts RANDOM so the RPC can surface its current rejection', () => {
    expect(
      mhdAssessmentCreateSchema.parse({ companyId, title: 'Random', assemblyMode: 'RANDOM' })
        .assemblyMode,
    ).toBe('RANDOM');
  });
  it('requires a non-empty item prompt', () => {
    expect(
      mhdAssessmentItemCreateSchema.safeParse({ companyId, questionType: 'MCQ_SINGLE', prompt: '' })
        .success,
    ).toBe(false);
  });
});
