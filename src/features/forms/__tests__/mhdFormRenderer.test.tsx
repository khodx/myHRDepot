import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdFormRenderer } from '../components/MhdFormRenderer';
import { mhdFormService } from '../Service';

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
    },
  };
});

const baseForm = {
  id: 'form-1',
  referenceId: 'FORM-000001',
  companyId: 'company-1',
  name: 'Onboarding',
  description: 'New hire onboarding form',
  status: 'ACTIVE',
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
    settings: { allowDraft: false, multiPage: false, progressBar: true },
  },
};

describe('MhdFormRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mhdFormService.getFormById).mockResolvedValue(baseForm as never);
  });

  it('renders the form title and visible field labels', async () => {
    render(<MhdFormRenderer formId="form-1" />);

    expect(await screen.findByText('Onboarding')).toBeInTheDocument();
    expect(await screen.findByText('First Name')).toBeInTheDocument();
  });

  it('renders fields marked hidden by default so form logic can be planned', async () => {
    vi.mocked(mhdFormService.getFormById).mockResolvedValue({
      ...baseForm,
      definition: {
        ...baseForm.definition,
        pages: [
          {
            id: 'page-1',
            title: 'Page 1',
            fields: ['field-1', 'manager-notes'],
            order: 1,
          },
        ],
        fields: [
          ...baseForm.definition.fields,
          {
            id: 'manager-notes',
            type: 'longtext',
            label: 'Manager Notes',
            required: false,
            hidden: true,
          },
        ],
      },
    } as never);

    render(<MhdFormRenderer formId="form-1" />);

    expect(await screen.findByText('Manager Notes')).toBeInTheDocument();
  });

  it('renders fields targeted by HIDE logic so branching can be planned', async () => {
    vi.mocked(mhdFormService.getFormById).mockResolvedValue({
      ...baseForm,
      definition: {
        ...baseForm.definition,
        pages: [
          {
            id: 'page-1',
            title: 'Page 1',
            fields: ['field-1', 'conditional-field'],
            order: 1,
          },
        ],
        fields: [
          ...baseForm.definition.fields,
          {
            id: 'conditional-field',
            type: 'text',
            label: 'Conditional Field',
            required: false,
            hidden: false,
          },
        ],
        logic: [
          {
            id: 'logic-1',
            order: 1,
            condition: { field: 'field-1', operator: 'isEmpty' },
            action: 'HIDE',
            targetFieldId: 'conditional-field',
          },
        ],
      },
    } as never);

    render(<MhdFormRenderer formId="form-1" />);

    expect(await screen.findByText('Conditional Field')).toBeInTheDocument();
  });

  it('does not create duplicate drafts when the load effect re-runs before state commits', async () => {
    const draftForm = {
      ...baseForm,
      definition: {
        ...baseForm.definition,
        settings: { ...baseForm.definition.settings, allowDraft: true },
      },
    };
    let resolveDraft!: (submission: { id: string }) => void;
    const draftPromise = new Promise<{ id: string }>((resolve) => {
      resolveDraft = resolve;
    });

    vi.mocked(mhdFormService.getFormById).mockResolvedValue(draftForm as never);
    vi.mocked(mhdFormService.createSubmission).mockReturnValue(draftPromise as never);

    const { rerender } = render(
      <MhdFormRenderer formId="form-1" taskPrefillValues={{ source: 'initial' }} />,
    );

    await waitFor(() => expect(mhdFormService.createSubmission).toHaveBeenCalledTimes(1));

    rerender(<MhdFormRenderer formId="form-1" taskPrefillValues={{ source: 'rerender' }} />);

    await waitFor(() => expect(mhdFormService.getFormById).toHaveBeenCalledTimes(2));
    expect(mhdFormService.createSubmission).toHaveBeenCalledTimes(1);

    resolveDraft({ id: 'submission-1' });

    expect(await screen.findByText('Save Draft')).toBeInTheDocument();
    expect(mhdFormService.createSubmission).toHaveBeenCalledTimes(1);
  });
});
