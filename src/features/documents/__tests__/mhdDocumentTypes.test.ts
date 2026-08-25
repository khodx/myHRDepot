import { describe, expect, it } from 'vitest';
import type { MhdDocumentGeneration, MhdDocumentTemplate } from '../Types';

describe('Document Generation type contract', () => {
  it('supports the polymorphic template row shape', () => {
    const template: MhdDocumentTemplate = {
      id: '11111111-1111-4111-8111-111111111111',
      referenceId: 'DOCT-000001',
      companyId: null,
      name: 'Monthly Task Summary',
      templateType: 'REPORT',
      applicableEntityType: 'TASK',
      description: 'A monthly summary report.',
      contentFormat: 'HTML',
      mergeFields: [{ path: 'task.title', label: 'Task Title', source: 'task' }],
      version: 1,
      isActive: true,
      requiresSignature: false,
      createdAt: '2026-07-30T00:00:00Z',
      updatedAt: '2026-07-30T00:00:00Z',
    };

    expect(template.referenceId).toBe('DOCT-000001');
    expect(template.companyId).toBeNull();
  });

  it('supports the polymorphic generation row shape, scoped to any entity type', () => {
    const generation: MhdDocumentGeneration = {
      id: '22222222-2222-4222-8222-222222222222',
      referenceId: 'DGEN-000001',
      templateId: '11111111-1111-4111-8111-111111111111',
      templateName: 'Monthly Task Summary',
      companyId: '33333333-3333-4333-8333-333333333333',
      status: 'GENERATED',
      outputFormat: 'PDF',
      subjectPersonId: null,
      outputFileName: 'task-summary.pdf',
      outputDriveFileId: 'drive-file-id',
      generatedAt: '2026-07-30T00:00:00Z',
      esignatureRequestId: null,
      createdAt: '2026-07-30T00:00:00Z',
    };

    expect(generation.status).toBe('GENERATED');
    expect(generation.esignatureRequestId).toBeNull();
  });
});
