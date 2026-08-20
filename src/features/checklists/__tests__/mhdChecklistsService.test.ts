import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdChecklistsService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdChecklistsService - template library', () => {
  it('lists global and company templates through the library RPC and maps counts', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'template-1',
          company_id: null,
          source_template_id: null,
          title: 'Standard New Hire Checklist',
          description: 'Baseline onboarding tasks.',
          category: 'ONBOARDING',
          is_active: true,
          is_library: true,
          item_count: '3',
        },
      ],
      error: null,
    });

    const [template] = await mhdChecklistsService.listLibrary('company-1', 'ONBOARDING');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_checklist_library', {
      p_company_id: 'company-1',
      p_category: 'ONBOARDING',
    });
    expect(template).toEqual({
      id: 'template-1',
      companyId: null,
      sourceTemplateId: null,
      title: 'Standard New Hire Checklist',
      description: 'Baseline onboarding tasks.',
      category: 'ONBOARDING',
      isActive: true,
      isLibrary: true,
      itemCount: 3,
    });
  });

  it('creates a template first and then adds each item through RPCs', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: [{ id: 'template-2' }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 'item-1' }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 'item-2' }], error: null });

    await mhdChecklistsService.createTemplate({
      companyId: 'company-1',
      title: 'Monthly Safety Checklist',
      description: 'Warehouse safety checks.',
      category: 'SAFETY',
      items: [
        {
          title: 'Inspect exits',
          isRequired: true,
          requiresEvidence: false,
          sortOrder: 100,
        },
        {
          title: 'Upload drill note',
          description: 'Plain text evidence is enough.',
          isRequired: true,
          requiresEvidence: true,
          sortOrder: 200,
        },
      ],
    });

    expect(rpcMock.mock.calls[0]).toEqual([
      'mhd_create_checklist_template',
      {
        p_company_id: 'company-1',
        p_title: 'Monthly Safety Checklist',
        p_description: 'Warehouse safety checks.',
        p_category: 'SAFETY',
        p_source_template_id: undefined,
      },
    ]);
    expect(rpcMock.mock.calls[1]).toEqual([
      'mhd_add_checklist_template_item',
      {
        p_template_id: 'template-2',
        p_title: 'Inspect exits',
        p_description: undefined,
        p_is_required: true,
        p_requires_evidence: false,
        p_sort_order: 100,
      },
    ]);
    expect(rpcMock.mock.calls[2][0]).toBe('mhd_add_checklist_template_item');
  });

  it('forks a global template into the current company', async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'company-template-1' }], error: null });

    await expect(
      mhdChecklistsService.forkTemplate('global-template-1', 'company-1'),
    ).resolves.toEqual({ id: 'company-template-1' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_fork_checklist_template', {
      p_source_template_id: 'global-template-1',
      p_company_id: 'company-1',
    });
  });
});

describe('mhdChecklistsService - assigned instances', () => {
  it('lists the signed-in user checklist instances and maps progress counts', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'instance-1',
          reference_id: 'CKLI-001',
          company_id: 'company-1',
          title: 'New Hire Checklist',
          status: 'IN_PROGRESS',
          due_date: '2026-08-30',
          total_items: '5',
          completed_items: '2',
        },
      ],
      error: null,
    });

    const [instance] = await mhdChecklistsService.listMyInstances();

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_my_checklist_instances');
    expect(instance.completedItems).toBe(2);
    expect(instance.totalItems).toBe(5);
  });

  it('gets an instance through the header-only detail RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'instance-1',
          reference_id: 'CKLI-001',
          company_id: 'company-1',
          title: 'New Hire Checklist',
          status: 'IN_PROGRESS',
          assigned_to_person_id: 'person-1',
          entity_type: null,
          entity_id: null,
          due_date: null,
          completed_at: null,
        },
      ],
      error: null,
    });

    const detail = await mhdChecklistsService.getInstance('instance-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_get_checklist_instance', {
      p_instance_id: 'instance-1',
    });
    expect(detail?.items).toEqual([]);
  });

  it('completes an item with optional plain text evidence', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdChecklistsService.completeItem({
      itemId: 'item-1',
      isCompleted: true,
      evidenceNote: 'Confirmed in HRIS.',
    });

    expect(rpcMock).toHaveBeenCalledWith('mhd_complete_checklist_item', {
      p_item_id: 'item-1',
      p_is_completed: true,
      p_evidence_note: 'Confirmed in HRIS.',
      p_evidence_attachment_id: undefined,
    });
  });
});
