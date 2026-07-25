import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdFormBuilder } from '../components/MhdFormBuilder';
import type { MhdForm, MhdFormDefinition } from '../Types';

const mockCreateForm = vi.fn();
const mockUpdateForm = vi.fn();
const mockPublishForm = vi.fn();

vi.mock('../Service', async () => {
  const actual = await vi.importActual<typeof import('../Service')>('../Service');
  return {
    ...actual,
    mhdFormService: {
      createForm: (...args: unknown[]) => mockCreateForm(...args),
      updateForm: (...args: unknown[]) => mockUpdateForm(...args),
      publishForm: (...args: unknown[]) => mockPublishForm(...args),
    },
  };
});

describe('MhdFormBuilder', () => {
  beforeEach(() => {
    mockCreateForm.mockReset();
    mockUpdateForm.mockReset();
    mockPublishForm.mockReset();
  });

  it('renders the form name and description inputs', () => {
    render(<MhdFormBuilder companyId="company-1" />);
    expect(screen.getByPlaceholderText('Enter form name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Form description')).toBeInTheDocument();
  });

  it('adds a field to the canvas when "Add Field" is clicked', () => {
    render(<MhdFormBuilder companyId="company-1" />);
    expect(screen.queryByText('Untitled field')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    expect(screen.getByText('Untitled field')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Definition round-trip fidelity (the 22 seeded onboarding forms are
  // single-page and must survive load -> save unmodified)
  // ---------------------------------------------------------------------------

  // Shaped exactly like Service.ts mapDefinition() produces for a seeded
  // single-page form assembled by mhd_assemble_form_definition (pages carry
  // id/title/fields/order; page membership is the page's fields[] array).
  const seededSinglePageDefinition: MhdFormDefinition = {
    id: 'form-1',
    name: 'New Hire - Direct Deposit',
    description: 'Direct deposit setup for new hires.',
    pages: [
      {
        id: 'page-a',
        title: 'Page 1',
        description: undefined,
        fields: ['field-1', 'field-2'],
        order: 1,
        skipLogic: undefined,
      },
    ],
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: 'Bank Name',
        required: true,
        hidden: false,
        defaultValue: null,
        options: [],
      },
      {
        id: 'field-2',
        type: 'select',
        label: 'Account Type',
        required: true,
        hidden: false,
        defaultValue: null,
        options: [{ value: 'CHECKING', label: 'Checking' }],
      },
    ],
    logic: [],
    calculations: [],
    settings: { allowDraft: true, multiPage: false, progressBar: true },
  };

  const seededForm: MhdForm = {
    id: 'form-1',
    referenceId: 'FORM-000001',
    companyId: 'company-1',
    name: 'New Hire - Direct Deposit',
    description: 'Direct deposit setup for new hires.',
    status: 'DRAFT',
    employeeFileCategory: null,
    definition: seededSinglePageDefinition,
    version: 1,
    previousVersionId: null,
    createdAt: '2026-07-17T00:00:00Z',
    updatedAt: '2026-07-17T00:00:00Z',
    publishedAt: null,
    publishedBy: null,
  };

  it('round-trips a seeded single-page definition through load -> save unmodified', async () => {
    mockUpdateForm.mockResolvedValue(seededForm);

    render(<MhdFormBuilder companyId="company-1" formId="form-1" initialForm={seededForm} />);

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => expect(mockUpdateForm).toHaveBeenCalledTimes(1));

    const [savedFormId, updateInput] = mockUpdateForm.mock.calls[0] as [
      string,
      { name: string; description?: string; definition: MhdFormDefinition },
    ];
    expect(savedFormId).toBe('form-1');
    expect(updateInput.name).toBe(seededForm.name);
    // Exact fidelity: an untouched single-page definition must persist byte-for-byte.
    expect(updateInput.definition).toEqual(seededSinglePageDefinition);
    expect(mockCreateForm).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Multi-page authoring
  // ---------------------------------------------------------------------------

  it('authors a second page, assigns new fields to it, and persists page membership', async () => {
    mockCreateForm.mockResolvedValue(seededForm);

    render(<MhdFormBuilder companyId="company-1" />);

    fireEvent.change(screen.getByPlaceholderText('Enter form name'), {
      target: { value: 'Multi-Page Form' },
    });

    // First field lands on the implicit first page.
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    // Add a second page (becomes the active page) and rename it.
    fireEvent.click(screen.getByRole('button', { name: /add page/i }));
    fireEvent.change(screen.getByLabelText('Page Title'), { target: { value: 'Details' } });

    // A field added now belongs to the active (second) page.
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => expect(mockCreateForm).toHaveBeenCalledTimes(1));

    const [createInput] = mockCreateForm.mock.calls[0] as [{ definition: MhdFormDefinition }];
    const { definition } = createInput;

    expect(definition.pages).toHaveLength(2);
    expect(definition.pages[0].order).toBe(1);
    expect(definition.pages[1].order).toBe(2);
    expect(definition.pages[1].title).toBe('Details');
    expect(definition.fields).toHaveLength(2);
    expect(definition.pages[0].fields).toEqual([definition.fields[0].id]);
    expect(definition.pages[1].fields).toEqual([definition.fields[1].id]);
    expect(definition.settings.multiPage).toBe(true);
  });

  it('removing a page reassigns its fields to the first remaining page', async () => {
    mockCreateForm.mockResolvedValue(seededForm);

    render(<MhdFormBuilder companyId="company-1" />);

    fireEvent.change(screen.getByPlaceholderText('Enter form name'), {
      target: { value: 'Collapsed Form' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.click(screen.getByRole('button', { name: /add page/i }));
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    // Remove the active (second) page: its field must fold back into page 1.
    fireEvent.click(screen.getByRole('button', { name: /remove page/i }));

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => expect(mockCreateForm).toHaveBeenCalledTimes(1));

    const [createInput] = mockCreateForm.mock.calls[0] as [{ definition: MhdFormDefinition }];
    expect(createInput.definition.pages).toHaveLength(1);
    expect(createInput.definition.pages[0].fields).toHaveLength(2);
    expect(createInput.definition.settings.multiPage).toBe(false);
  });
});
