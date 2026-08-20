import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, libraryRef, createTemplateMock, forkTemplateMock, assignMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  libraryRef: { current: [] as unknown[] },
  createTemplateMock: vi.fn(),
  forkTemplateMock: vi.fn(),
  assignMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { companyId: 'company-1', companyName: 'Acme' },
    roles: ['Client Admin'],
  }),
}));

vi.mock('../Hook', () => ({
  useMhdChecklistLibrary: () => ({ data: libraryRef.current, isLoading: false }),
  useMhdChecklistPeople: () => ({
    data: [{ id: 'person-1', displayName: 'Ada Lovelace' }],
    isLoading: false,
  }),
  useMhdCreateChecklistTemplate: () => ({
    mutateAsync: createTemplateMock,
    isPending: false,
  }),
  useMhdForkChecklistTemplate: () => ({ mutateAsync: forkTemplateMock, isPending: false }),
  useMhdCreateChecklistInstance: () => ({ mutateAsync: assignMock, isPending: false }),
}));

const { mhdChecklistsService } = await import('../Service');
const { MhdChecklistLibraryPage } = await import('../components/MhdChecklistLibraryPage');

beforeEach(() => {
  vi.clearAllMocks();
  libraryRef.current = [];
});

describe('mhdChecklistsService', () => {
  it('maps the checklist library RPC rows', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'tpl-1',
          company_id: null,
          source_template_id: null,
          title: 'Security onboarding',
          description: 'Standard IT checklist',
          category: 'IT',
          is_active: true,
          is_library: true,
          item_count: '3',
        },
      ],
      error: null,
    });

    const [template] = await mhdChecklistsService.listLibrary('company-1', 'IT');

    expect(rpcMock).toHaveBeenCalledWith('mhd_list_checklist_library', {
      p_company_id: 'company-1',
      p_category: 'IT',
    });
    expect(template.itemCount).toBe(3);
    expect(template.isLibrary).toBe(true);
  });

  it('creates a template then adds its ordered items through RPCs only', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: [{ id: 'tpl-2' }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 'item-1' }], error: null });

    await mhdChecklistsService.createTemplate({
      companyId: 'company-1',
      title: 'Closeout',
      category: 'GENERAL',
      items: [
        {
          title: 'Collect equipment',
          isRequired: true,
          requiresEvidence: true,
          sortOrder: 1,
        },
      ],
    });

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'mhd_create_checklist_template', expect.any(Object));
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'mhd_add_checklist_template_item', {
      p_template_id: 'tpl-2',
      p_title: 'Collect equipment',
      p_description: undefined,
      p_is_required: true,
      p_requires_evidence: true,
      p_sort_order: 1,
    });
  });
});

describe('MhdChecklistLibraryPage', () => {
  it('renders a library template and assigns it to a person', async () => {
    libraryRef.current = [
      {
        id: 'tpl-1',
        companyId: null,
        sourceTemplateId: null,
        title: 'Security onboarding',
        description: 'Standard IT checklist',
        category: 'IT',
        isActive: true,
        isLibrary: true,
        itemCount: 3,
      },
    ];

    render(
      <MemoryRouter initialEntries={['/checklists/library']}>
        <Routes>
          <Route path="/checklists/library" element={<MhdChecklistLibraryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Security onboarding')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
    fireEvent.change(screen.getByDisplayValue('Choose a person...'), {
      target: { value: 'person-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Assign Checklist' }));

    expect(assignMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'tpl-1',
        assignedToPersonId: 'person-1',
      }),
    );
  });
});
