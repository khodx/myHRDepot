import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdDocumentTemplateWizardSettingsPanel } from '../components/MhdDocumentTemplateWizardSettingsPanel';

const mockSettings = vi.fn();
const mockSetSettings = vi.fn();
vi.mock('../OutputHook', () => ({
  useMhdDocumentTemplateWizardSettings: (...args: unknown[]) => mockSettings(...args),
  useMhdSetDocumentTemplateWizardSettings: (...args: unknown[]) => mockSetSettings(...args),
}));
const mutation = { isPending: false, error: null as Error | null, mutate: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  mutation.error = null;
  mockSettings.mockReturnValue({
    data: {
      employeeFileCategory: 'general',
      narrativeSlots: [{ key: 'summary', label: 'Summary', help: 'Optional' }],
    },
    isLoading: false,
    error: null,
  });
  mutation.mutate.mockImplementation((_input: unknown, options?: { onSuccess?: () => void }) =>
    options?.onSuccess?.(),
  );
  mockSetSettings.mockReturnValue(mutation);
});

describe('MhdDocumentTemplateWizardSettingsPanel', () => {
  it('loads values, excludes medical, edits sections, and saves null for unfiled', () => {
    render(<MhdDocumentTemplateWizardSettingsPanel templateId="template" canEdit />);
    expect(screen.getByRole('combobox')).toHaveValue('general');
    expect(screen.queryByRole('option', { name: /medical/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Section' }));
    const keys = screen.getAllByRole('textbox', { name: 'Section key' });
    fireEvent.change(keys[1], { target: { value: 'details' } });
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Section label' })[1], {
      target: { value: 'Details' },
    });
    // Remove the section just added; the original stays.
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove Section' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(mutation.mutate).toHaveBeenCalledWith(
      {
        employeeFileCategory: null,
        narrativeSlots: [{ key: 'summary', label: 'Summary', help: 'Optional' }],
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved.');
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled();
  });

  it('shows schema validation and does not save an invalid section', () => {
    render(<MhdDocumentTemplateWizardSettingsPanel templateId="template" canEdit />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Section key' }), {
      target: { value: '1invalid' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it('shows a refused save without claiming success', () => {
    mutation.mutate.mockImplementation(() => undefined);
    mutation.error = new Error('Only Platform Admin can change a platform-level template');
    render(<MhdDocumentTemplateWizardSettingsPanel templateId="template" canEdit />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'hr' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Only Platform Admin');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is read-only when editing is unavailable', () => {
    render(<MhdDocumentTemplateWizardSettingsPanel templateId="template" canEdit={false} />);
    expect(screen.queryByRole('button', { name: 'Save Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Section key' })).toBeDisabled();
  });
});
