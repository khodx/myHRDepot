import { describe, expect, it } from 'vitest';
import { mhdDocumentTemplateFormSchema } from '../Schemas';

describe('mhdDocumentTemplateFormSchema', () => {
  it('accepts a valid platform-level template payload', () => {
    const result = mhdDocumentTemplateFormSchema.safeParse({
      companyId: null,
      name: 'Monthly Task Summary',
      templateType: 'REPORT',
      contentFormat: 'HTML',
      content: '<p>{{task.title}} due {{task.due_date}}</p>',
      mergeFields: [{ path: 'task.title', label: 'Task Title', source: 'task' }],
      description: 'A monthly summary report.',
      requiresSignature: false,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a company-scoped template', () => {
    const result = mhdDocumentTemplateFormSchema.safeParse({
      companyId: '11111111-1111-4111-8111-111111111111',
      name: 'Offer Letter',
      templateType: 'OFFER_LETTER',
      contentFormat: 'HTML',
      content: 'Dear {{person.first_name}},',
      mergeFields: [],
      requiresSignature: true,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown template type', () => {
    const result = mhdDocumentTemplateFormSchema.safeParse({
      companyId: null,
      name: 'Bad Template',
      templateType: 'NOT_A_REAL_TYPE',
      contentFormat: 'HTML',
      content: 'x',
      mergeFields: [],
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a merge field missing a path', () => {
    const result = mhdDocumentTemplateFormSchema.safeParse({
      companyId: null,
      name: 'Bad Merge Field',
      templateType: 'REPORT',
      contentFormat: 'HTML',
      content: 'x',
      mergeFields: [{ path: '', label: 'Missing path', source: 'custom' }],
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});
