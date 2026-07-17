import { render, screen } from '@testing-library/react';
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
    vi.mocked(mhdFormService.getFormById).mockResolvedValue(baseForm as never);
  });

  it('renders the form title and visible field labels', async () => {
    render(<MhdFormRenderer formId="form-1" />);

    expect(await screen.findByText('Onboarding')).toBeInTheDocument();
    expect(await screen.findByText('First Name')).toBeInTheDocument();
  });
});
