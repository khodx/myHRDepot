import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock, pollMock, renderMock, returnsMock, rpcMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  pollMock: vi.fn(),
  renderMock: vi.fn(),
  returnsMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock, functions: { invoke: invokeMock } },
}));
vi.mock('../generationEngine', () => ({
  mhdGenerationPollOptionsFor: vi.fn(() => ({ pollAttempts: 7, pollIntervalMs: 11 })),
  mhdPollDocumentGenerationUntilGenerated: pollMock,
  mhdRenderDocumentGeneration: renderMock,
}));

const { mhdDocumentOutputService } = await import('../OutputService');

const id = () => crypto.randomUUID();
const queueRow = {
  id: id(),
  reference_id: 'DQ-2026-0042',
  company_id: id(),
  template_key: 'ONBOARDING_PACKET',
  template_name: 'New Starter Packet',
  entity_type: 'ONBOARDING',
  entity_id: id(),
  subject_person_id: id(),
  subject_person_name: 'Marisol Vega',
  source_wizard: 'ONBOARDING',
  status: 'QUEUED',
  output_format: 'PDF',
  requires_signature: true,
  employee_file_category: 'hr',
  generation_id: null,
  generation_status: null,
  output_file_name: null,
  output_drive_file_id: null,
  failure_reason: null,
  queued_by: id(),
  queued_by_name: 'Elliot Park',
  queued_at: '2026-09-14T10:20:00Z',
  generated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  returnsMock.mockResolvedValue({ data: [], error: null });
  rpcMock.mockImplementation((name: string) =>
    name === 'mhd_document_queue_enqueue' ||
    name === 'mhd_document_queue_list' ||
    name === 'mhd_document_queue_get' ||
    name === 'mhd_document_queue_generate' ||
    name === 'mhd_document_template_fork' ||
    name === 'mhd_document_template_versions' ||
    name === 'mhd_document_template_wizard_settings' ||
    name === 'mhd_document_branding_get' ||
    name === 'mhd_list_employee_file_documents'
      ? { returns: returnsMock }
      : Promise.resolve({ error: null }),
  );
});

describe('mhdDocumentOutputService RPC mappings', () => {
  it('omits optional enqueue and list arguments when unset', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [{ id: 'queued-id', reference_id: 'DQ-2026-0042' }],
      error: null,
    });
    await mhdDocumentOutputService.enqueue({
      companyId: id(),
      templateKey: 'ONBOARDING_PACKET',
      entityType: 'ONBOARDING',
      entityId: id(),
      sourceWizard: 'ONBOARDING',
    });
    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_document_queue_enqueue',
      expect.objectContaining({ p_source_wizard: 'ONBOARDING' }),
    );
    expect(rpcMock.mock.calls[0][1]).not.toHaveProperty('p_wizard_inputs');
    expect(rpcMock.mock.calls[0][1]).not.toHaveProperty('p_output_format');
    await mhdDocumentOutputService.listQueue('company-id');
    expect(rpcMock).toHaveBeenLastCalledWith('mhd_document_queue_list', {
      p_company_id: 'company-id',
    });
  });

  it('sends an empty category for NONE, the chosen category otherwise, and nothing when unset', async () => {
    const enqueueRow = { data: [{ id: 'queued-id', reference_id: 'DQ-2026-0043' }], error: null };
    const base = {
      companyId: id(),
      templateKey: 'EXIT_ACKNOWLEDGMENT',
      entityType: 'OFFBOARDING_CASE',
      entityId: id(),
      sourceWizard: 'OFFBOARDING' as const,
    };

    returnsMock.mockResolvedValueOnce(enqueueRow);
    await mhdDocumentOutputService.enqueue({ ...base, employeeFileCategory: 'NONE' });
    expect(rpcMock.mock.calls[0][1]).toMatchObject({ p_employee_file_category: '' });

    returnsMock.mockResolvedValueOnce(enqueueRow);
    await mhdDocumentOutputService.enqueue({ ...base, employeeFileCategory: 'hr' });
    expect(rpcMock.mock.calls[1][1]).toMatchObject({ p_employee_file_category: 'hr' });

    returnsMock.mockResolvedValueOnce(enqueueRow);
    await mhdDocumentOutputService.enqueue(base);
    expect(rpcMock.mock.calls[2][1]).not.toHaveProperty('p_employee_file_category');
  });

  it('maps queue, detail, template, branding, and employee-file rows to camelCase', async () => {
    returnsMock.mockResolvedValueOnce({ data: [queueRow], error: null });
    expect((await mhdDocumentOutputService.listQueue(queueRow.company_id))[0]).toMatchObject({
      referenceId: queueRow.reference_id,
      subjectPersonName: 'Marisol Vega',
      employeeFileCategory: 'hr',
    });
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          ...queueRow,
          wizard_inputs: { department: 'Operations' },
          merge_overrides: { 'person.display_name': 'Marisol Vega', invalid: ['ignored'] },
          narrative_sections: { summary: 'Welcome aboard', count: 4 },
        },
      ],
      error: null,
    });
    expect(await mhdDocumentOutputService.getQueued(queueRow.id)).toMatchObject({
      wizardInputs: { department: 'Operations' },
      mergeOverrides: { 'person.display_name': 'Marisol Vega' },
      narrativeSections: { summary: 'Welcome aboard' },
    });
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          version: 3,
          name: 'Packet',
          content_format: 'HTML',
          content: '<p>Hi</p>',
          merge_fields: [{ path: 'person.first_name', label: 'First name', source: 'person' }],
          narrative_slots: [{ key: 'summary', label: 'Summary' }, { key: 7 }],
          requires_signature: true,
          changed_by: null,
          changed_by_name: null,
          changed_at: '2026-09-01',
        },
      ],
      error: null,
    });
    expect((await mhdDocumentOutputService.listTemplateVersions(id()))[0]).toMatchObject({
      contentFormat: 'HTML',
      changedAt: '2026-09-01',
      mergeFields: [{ path: 'person.first_name', label: 'First name', source: 'person' }],
      narrativeSlots: [{ key: 'summary', label: 'Summary' }],
    });
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          id: id(),
          company_id: null,
          is_platform_default: true,
          header_text: null,
          footer_text: 'People Operations',
          accent_color: '#0003AA',
          font_family: 'Arial',
          logo_data_uri: null,
          show_reference_id: true,
        },
      ],
      error: null,
    });
    expect(await mhdDocumentOutputService.getBranding(null)).toMatchObject({
      isPlatformDefault: true,
      fontFamily: 'Arial',
      showReferenceId: true,
    });
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          id: id(),
          reference_id: 'DOC-2042',
          template_key: 'ONBOARDING_PACKET',
          template_name: 'New Starter Packet',
          employee_file_category: 'hr',
          entity_type: 'ONBOARDING',
          entity_id: id(),
          status: 'GENERATED',
          output_format: 'PDF',
          output_file_name: 'welcome.pdf',
          output_drive_file_id: 'drive-file',
          esignature_request_id: null,
          generated_at: '2026-09-14',
          created_by: id(),
          created_by_name: 'Elliot Park',
          created_at: '2026-09-14',
        },
      ],
      error: null,
    });
    expect((await mhdDocumentOutputService.listEmployeeFileDocuments(id()))[0]).toMatchObject({
      referenceId: 'DOC-2042',
      outputDriveFileId: 'drive-file',
    });
  });

  it('passes every edit, fork, settings, branding, and category argument', async () => {
    const queueId = id();
    const overrides = { 'record.title': 'Coordinator' };
    const narrative = { rationale: 'Role updated' };
    await mhdDocumentOutputService.updateQueuedEdits(queueId, overrides, narrative);
    expect(rpcMock).toHaveBeenCalledWith('mhd_document_queue_update_edits', {
      p_queue_id: queueId,
      p_merge_overrides: overrides,
      p_narrative_sections: narrative,
    });
    await mhdDocumentOutputService.dismissQueued(queueId, 'Duplicate request');
    await mhdDocumentOutputService.applyEdits(id(), overrides, narrative);
    const sourceTemplateId = id();
    const targetCompanyId = id();
    returnsMock.mockResolvedValueOnce({
      data: [{ id: id(), reference_id: 'DOC-2043', already_existed: false }],
      error: null,
    });
    expect(
      await mhdDocumentOutputService.forkTemplate(sourceTemplateId, targetCompanyId),
    ).toMatchObject({
      referenceId: 'DOC-2043',
      alreadyExisted: false,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_document_template_fork', {
      p_template_id: sourceTemplateId,
      p_company_id: targetCompanyId,
    });
    await mhdDocumentOutputService.setTemplateWizardSettings(id(), {
      employeeFileCategory: 'hr',
      narrativeSlots: [{ key: 'summary', label: 'Summary' }],
    });
    rpcMock.mockImplementationOnce(() => Promise.resolve({ data: id(), error: null }));
    await mhdDocumentOutputService.saveBranding({
      companyId: null,
      headerText: null,
      footerText: 'People Operations',
      accentColor: '#0003AA',
      fontFamily: 'Arial',
      logoDataUri: null,
      showReferenceId: true,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_document_branding_upsert', {
      p_company_id: null,
      p_header_text: null,
      p_footer_text: 'People Operations',
      p_accent_color: '#0003AA',
      p_font_family: 'Arial',
      p_logo_data_uri: null,
      p_show_reference_id: true,
    });
    await mhdDocumentOutputService.setGenerationEmployeeFileCategory(id(), null);
    expect(rpcMock).toHaveBeenCalledWith('mhd_document_queue_dismiss', {
      p_queue_id: queueId,
      p_reason: 'Duplicate request',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_document_generation_apply_edits', {
      p_generation_id: expect.any(String),
      p_overrides: overrides,
      p_narrative: narrative,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_document_generation_set_employee_file_category', {
      p_generation_id: expect.any(String),
      p_category: null,
    });
  });

  it('renders then polls in order, and does not render when queue RPC fails', async () => {
    const generationId = id();
    const order: string[] = [];
    rpcMock.mockImplementationOnce(() => ({
      returns: vi.fn().mockResolvedValue({
        data: [
          {
            generation_id: generationId,
            generation_reference_id: 'DGEN-2042',
            template_id: id(),
          },
        ],
        error: null,
      }),
    }));
    renderMock.mockImplementation(async () => {
      order.push('render');
    });
    pollMock.mockImplementation(async () => {
      order.push('poll');
      return { output_document_hash: 'hash-7', output_drive_file_id: 'drive-7' };
    });
    expect(
      await mhdDocumentOutputService.generateQueued(id(), { pollAttempts: 2, pollIntervalMs: 0 }),
    ).toMatchObject({ generationId, documentHash: 'hash-7', outputDriveFileId: 'drive-7' });
    expect(order).toEqual(['render', 'poll']);
    rpcMock.mockImplementationOnce(() => ({
      returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'Queue is locked' } }),
    }));
    await expect(mhdDocumentOutputService.generateQueued(id())).rejects.toThrow(
      'Unable to generate queued document: Queue is locked',
    );
    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  it('handles preview context and preview render success/failure shapes', async () => {
    // previewContext awaits the RPC directly (no .returns), so it is mocked at the rpc call itself.
    rpcMock.mockImplementationOnce(() =>
      Promise.resolve({ data: { person: { name: 'Marisol Vega' } }, error: null }),
    );
    expect(
      await mhdDocumentOutputService.previewContext({
        templateId: id(),
        companyId: id(),
        entityType: 'ONBOARDING',
        entityId: id(),
      }),
    ).toEqual({ person: { name: 'Marisol Vega' } });
    invokeMock.mockResolvedValueOnce({
      data: { success: true, html: '<h1>Welcome</h1>' },
      error: null,
    });
    const previewTemplateId = id();
    const previewCompanyId = id();
    await expect(
      mhdDocumentOutputService.renderPreviewHtml({
        templateId: previewTemplateId,
        companyId: previewCompanyId,
        mergeData: { person: { name: 'Marisol Vega' } },
      }),
    ).resolves.toBe('<h1>Welcome</h1>');
    expect(invokeMock).toHaveBeenCalledWith('render-document', {
      body: {
        mode: 'preview',
        template_id: previewTemplateId,
        company_id: previewCompanyId,
        merge_data: { person: { name: 'Marisol Vega' } },
      },
    });
    invokeMock.mockResolvedValueOnce({
      data: { success: false, error: 'Template has invalid markup' },
      error: null,
    });
    await expect(
      mhdDocumentOutputService.renderPreviewHtml({
        templateId: id(),
        companyId: id(),
        mergeData: {},
      }),
    ).rejects.toThrow('Preview render failed: Template has invalid markup');
    invokeMock.mockResolvedValueOnce({ data: {}, error: null });
    await expect(
      mhdDocumentOutputService.renderPreviewHtml({
        templateId: id(),
        companyId: id(),
        mergeData: {},
      }),
    ).rejects.toThrow('Preview render failed: no preview was returned.');
  });

  it('drops malformed narrative slots and preserves valid slots', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [
        {
          id: id(),
          template_key: 'HANDBOOK_PACKET',
          version: 2,
          is_system: false,
          company_id: id(),
          requires_signature: false,
          employee_file_category: 'hr',
          narrative_slots: [
            { key: 'purpose', label: 'Purpose', help: 'Why' },
            { key: 7, label: 'bad' },
            { key: 'missing-label' },
            'bad',
          ],
          compliance_module_key: null,
          compliance_content_key: null,
        },
      ],
      error: null,
    });
    await expect(mhdDocumentOutputService.getTemplateWizardSettings(id())).resolves.toMatchObject({
      narrativeSlots: [{ key: 'purpose', label: 'Purpose', help: 'Why' }],
    });
  });

  it('includes the server error message in every representative failure', async () => {
    rpcMock.mockImplementationOnce(() => ({
      returns: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Access denied for queue' } }),
    }));
    await expect(mhdDocumentOutputService.listQueue(id())).rejects.toThrow(
      'Unable to load document queue: Access denied for queue',
    );
  });
});
