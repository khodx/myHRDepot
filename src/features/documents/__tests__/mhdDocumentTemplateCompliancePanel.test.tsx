import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdDocumentTemplateCompliancePanel } from '../components/MhdDocumentTemplateCompliancePanel';

const mockUseMhdTemplateCompliance = vi.fn();
const mockUseMhdComplianceContentOptions = vi.fn();
const mockUseMhdSetTemplateCompliance = vi.fn();

vi.mock('../Hook', () => ({
  useMhdTemplateCompliance: (...args: unknown[]) => mockUseMhdTemplateCompliance(...args),
  useMhdComplianceContentOptions: (...args: unknown[]) => mockUseMhdComplianceContentOptions(...args),
  useMhdSetTemplateCompliance: (...args: unknown[]) => mockUseMhdSetTemplateCompliance(...args),
}));

const options = [
  {
    moduleKey: 'LEAVE', contentKey: 'FMLA_NOTICE', version: 3, authorityName: 'DOL',
    reviewStatus: 'APPROVED', productionEnabled: true,
  },
  {
    moduleKey: 'TASK', contentKey: 'TASK_NOTICE', version: 1, authorityName: 'State',
    reviewStatus: 'PENDING', productionEnabled: false,
  },
];

const mutation = { isPending: false, error: null as Error | null, mutateAsync: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  mutation.error = null;
  mockUseMhdTemplateCompliance.mockReturnValue({
    data: { moduleKey: 'LEAVE', contentKey: 'FMLA_NOTICE' },
  });
  mockUseMhdComplianceContentOptions.mockReturnValue({ data: options });
  mockUseMhdSetTemplateCompliance.mockReturnValue(mutation);
});

describe('MhdDocumentTemplateCompliancePanel', () => {
  it('renders nothing when the user cannot manage compliance', () => {
    const { container } = render(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current tag and formatted registry options', async () => {
    render(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage />);
    expect(screen.getByText('Current Tag: LEAVE / FMLA_NOTICE')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'LEAVE / FMLA_NOTICE (v3) — APPROVED, Enabled' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'TASK / TASK_NOTICE (v1) — PENDING, Not Enabled' })).toBeInTheDocument();
  });

  it('saves the selected module and content', async () => {
    mutation.mutateAsync.mockResolvedValue(undefined);
    render(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TASK\u0000TASK_NOTICE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Compliance Content' }));
    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledWith({
      moduleKey: 'TASK', contentKey: 'TASK_NOTICE',
    }));
  });

  it('clears the tag with None', async () => {
    mutation.mutateAsync.mockResolvedValue(undefined);
    render(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Compliance Content' }));
    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledWith({
      moduleKey: null, contentKey: null,
    }));
  });

  it('shows a refusal and keeps the selected option', async () => {
    mutation.mutateAsync.mockRejectedValue(new Error('permission denied'));
    const { rerender } = render(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TASK\u0000TASK_NOTICE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Compliance Content' }));
    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalled());
    mutation.error = new Error('permission denied');
    rerender(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage />);
    expect(screen.getByText('permission denied')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('TASK\u0000TASK_NOTICE');
  });

  it('disables save when the selection is unchanged', () => {
    render(<MhdDocumentTemplateCompliancePanel templateId="template-1" canManage />);
    expect(screen.getByRole('button', { name: 'Save Compliance Content' })).toBeDisabled();
  });
});
