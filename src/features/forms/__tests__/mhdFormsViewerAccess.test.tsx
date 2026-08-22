import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdForm } from '../Types';

/**
 * Component-level Viewer (read-only) gating for the forms feature. Route
 * reachability for Viewers is covered in mhdAppRouter.test.tsx; these tests
 * assert that mutating affordances are hidden inside the pages themselves:
 * - forms list: no "Create Form", no builder/edit links
 * - renderer: no draft save / submit, and no draft submission is created
 * - edit route: read-only preview instead of an editable builder
 */

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const mockUseMhdFormsIndex = vi.fn();
vi.mock('../Hook', () => ({
  useMhdFormsIndex: (companyId: string | null) => mockUseMhdFormsIndex(companyId),
}));

vi.mock('../Service', async () => {
  const actual = await vi.importActual<typeof import('../Service')>('../Service');
  return {
    ...actual,
    mhdFormService: {
      getFormById: vi.fn(),
      getSubmissionById: vi.fn(),
      createSubmission: vi.fn(),
      saveDraft: vi.fn(),
      submitForm: vi.fn(),
      listMyDraftSubmissions: vi.fn().mockResolvedValue([]),
    },
  };
});

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: {
    listTemplates: vi.fn().mockResolvedValue([]),
  },
}));

const { mhdFormService } = await import('../Service');
const { MhdFormsPage } = await import('../components/MhdFormsPage');
const { MhdFormRenderer } = await import('../components/MhdFormRenderer');
const { MhdFormBuilderPage } = await import('../components/MhdFormBuilderPage');
const { MhdFormDetailPage } = await import('../components/MhdFormDetailPage');

const baseForm: MhdForm = {
  id: 'form-1',
  referenceId: 'FORM-000001',
  companyId: 'company-1',
  name: 'Onboarding',
  description: 'New hire onboarding form',
  status: 'ACTIVE',
  intakeKind: null,
  employeeFileCategory: null,
  requiresEsignature: false,
  esignatureDocumentTemplateId: null,
  version: 1,
  previousVersionId: null,
  createdAt: '2026-07-17T00:00:00Z',
  updatedAt: '2026-07-17T00:00:00Z',
  publishedAt: '2026-07-17T00:00:00Z',
  publishedBy: 'user-1',
  definition: {
    id: 'form-1',
    name: 'Onboarding',
    pages: [{ id: 'page-1', title: 'Page 1', fields: ['field-1'], order: 1 }],
    fields: [{ id: 'field-1', type: 'text', label: 'First Name', required: true, hidden: false }],
    logic: [],
    calculations: [],
    // allowDraft true on purpose: read-only mode must still not create a draft.
    settings: { allowDraft: true, multiPage: false, progressBar: true },
  },
};

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@myhrdepot.com',
    authUserId: 'auth-user-1',
    profile: {
      userId: 'user-1',
      companyId: 'company-1',
      companyName: 'Acme Co',
      isAdmin: false,
      personId: 'person-1',
      displayName: 'Vera Viewer',
      firstName: 'Vera',
      lastName: 'Viewer',
      email: 'user@myhrdepot.com',
      roleNames: roles,
    },
    roles,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdFormsIndex.mockReturnValue({
    forms: [baseForm],
    drafts: [],
    filters: { status: 'ALL' },
    setFilters: vi.fn(),
    isLoading: false,
    errorMessage: null,
    refresh: vi.fn(),
  });
  vi.mocked(mhdFormService.getFormById).mockResolvedValue(baseForm);
  vi.mocked(mhdFormService.listMyDraftSubmissions).mockResolvedValue([]);
});

describe('MhdFormsPage role gating', () => {
  it('hides "Create Form" and builder/edit links for a Viewer', () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter>
        <MhdFormsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Create Form')).not.toBeInTheDocument();
    expect(screen.queryByText('Builder')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Form')).not.toBeInTheDocument();
    // Row actions collapse into a kebab menu; open it to see the actual links.
    // Menu items carry an explicit role="menuitem" (correct ARIA for a menu
    // popup), so they're queried as menuitem, not the anchor's implicit link role.
    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getAllByText('View').length).toBeGreaterThan(0);
    // List navigation opens the detail page first.
    expect(
      screen
        .getAllByRole('menuitem', { name: 'View' })
        .some((link) => link.getAttribute('href') === '/forms/form-1'),
    ).toBe(true);
    expect(screen.getByText('Open Form')).toBeInTheDocument();
    expect(screen.getByText('Submissions')).toBeInTheDocument();
  });

  it('hides "Create Form" for a Client User (Studio/Submit split, 2026-08-19)', () => {
    // Client User previously saw "Create Form" here even though the server-
    // side RLS on `forms` always rejected their write (Client Admin/HR
    // Partner only) -- a dead-end affordance, not a real capability. The
    // Multi-Tenant Library Architecture build split MHD_FORMS_MUTATING_ROLES
    // into MHD_FORMS_STUDIO_ROLES (build, no longer includes Client User) and
    // MHD_FORMS_SUBMIT_ROLES (fill out/submit, unchanged, still includes
    // Client User) -- this page is Studio, so Client User no longer sees it.
    mockAuth(['Employee']);

    render(
      <MemoryRouter>
        <MhdFormsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Create Form')).not.toBeInTheDocument();
    expect(screen.queryByText('Builder')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Form')).not.toBeInTheDocument();
  });
});

describe('MhdFormDetailPage role gating', () => {
  it('hides the detail-page edit action for a Viewer', async () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter initialEntries={['/forms/form-1']}>
        <Routes>
          <Route path="/forms/:formId" element={<MhdFormDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Onboarding', level: 1 })).toBeInTheDocument();
    // MhdDetailActions' Edit link renders as "Edit Record" (not "Edit Form").
    expect(screen.queryByText('Edit Record')).not.toBeInTheDocument();
    expect(screen.getByText('Open Form')).toBeInTheDocument();
  });

  it('shows the detail-page edit action for a Client Admin', async () => {
    mockAuth(['Client Admin']);

    render(
      <MemoryRouter initialEntries={['/forms/form-1']}>
        <Routes>
          <Route path="/forms/:formId" element={<MhdFormDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Onboarding', level: 1 })).toBeInTheDocument();
    // Edit now renders twice (top + bottom action bar via MhdDetailActions),
    // labeled "Edit Record" rather than "Edit Form".
    const editLinks = screen.getAllByRole('link', { name: 'Edit Record' });
    expect(editLinks.length).toBeGreaterThan(0);
    for (const link of editLinks) {
      expect(link).toHaveAttribute('href', '/forms/form-1/edit');
    }
  });
});

describe('MhdFormRenderer read-only mode (Viewer)', () => {
  it('renders the form without submit or draft-save affordances and creates no draft submission', async () => {
    render(<MhdFormRenderer formId="form-1" readOnly />);

    expect(await screen.findByText('Onboarding')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('You have read-only access to this form.')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save draft/i })).not.toBeInTheDocument();
    // Even though allowDraft is true, read-only mode must not create a submission.
    expect(mhdFormService.createSubmission).not.toHaveBeenCalled();
  });

  it('still shows submit and draft-save for a writable user', async () => {
    vi.mocked(mhdFormService.createSubmission).mockResolvedValue({
      id: 'submission-1',
      referenceId: 'SUBM-000001',
      formId: 'form-1',
      submitterId: 'user-1',
      taskId: null,
      status: 'DRAFT',
      employeeFileCategory: null,
      employeeFilePersonId: null,
      employeeFileUserId: null,
      values: {},
      createdAt: '2026-07-17T00:00:00Z',
      updatedAt: null,
      submittedAt: null,
      isDraft: true,
    });

    render(<MhdFormRenderer formId="form-1" />);

    expect(await screen.findByText('Onboarding')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /submit/i })).toBeInTheDocument();
    await waitFor(() => expect(mhdFormService.createSubmission).toHaveBeenCalledTimes(1));
  });
});

describe('MhdFormBuilderPage read-only mode (Viewer)', () => {
  it('renders a read-only preview instead of the editable builder for a Viewer at /forms/:formId/edit', async () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter initialEntries={['/forms/form-1/edit']}>
        <Routes>
          <Route path="/forms/:formId/edit" element={<MhdFormBuilderPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Onboarding (read-only)')).toBeInTheDocument();
    expect(screen.getByText('You have read-only access to forms.')).toBeInTheDocument();

    // No mutating builder affordances.
    expect(screen.queryByRole('button', { name: /save draft/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter form name')).not.toBeInTheDocument();

    // The preview renderer shows the form content read-only (no submit).
    expect(await screen.findByText('First Name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument();
  });

  it('renders the editable builder for a Client Admin', async () => {
    mockAuth(['Client Admin']);

    render(
      <MemoryRouter initialEntries={['/forms/form-1/edit']}>
        <Routes>
          <Route path="/forms/:formId/edit" element={<MhdFormBuilderPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Form Builder: Onboarding')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
  });
});
