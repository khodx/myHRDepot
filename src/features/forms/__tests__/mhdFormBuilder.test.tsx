import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdFormBuilder } from '../components/MhdFormBuilder';

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
});
