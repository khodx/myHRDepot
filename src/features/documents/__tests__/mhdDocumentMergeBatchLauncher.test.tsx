import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdDocumentMergeBatchLauncher } from '@/components/ui/MhdDocumentMergeBatchLauncher';

const listTemplates = vi.fn();
const requestMergeBatch = vi.fn();
const runMergeBatch = vi.fn();
const getMergeBatch = vi.fn();

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: {
    listTemplates: (...args: unknown[]) => listTemplates(...args),
    requestMergeBatch: (...args: unknown[]) => requestMergeBatch(...args),
    runMergeBatch: (...args: unknown[]) => runMergeBatch(...args),
    getMergeBatch: (...args: unknown[]) => getMergeBatch(...args),
  },
}));

const onClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  listTemplates.mockResolvedValue([
    { id: 'template-1', name: 'Offer Letter' },
    { id: 'template-2', name: 'Warning Notice' },
  ]);
});

describe('MhdDocumentMergeBatchLauncher', () => {
  it('launches a batch with the selected template, format, and recipients', async () => {
    requestMergeBatch.mockResolvedValue({ id: 'batch-1' });
    runMergeBatch.mockResolvedValue(undefined);
    getMergeBatch.mockResolvedValue({
      id: 'batch-1',
      status: 'COMPLETED',
      totalCount: 2,
      succeededCount: 2,
      failedCount: 0,
      items: [],
    });

    render(
      <MhdDocumentMergeBatchLauncher
        companyId="company-1"
        personIds={['person-1', 'person-2']}
        onClose={onClose}
      />,
    );

    await waitFor(() => expect(listTemplates).toHaveBeenCalledWith('company-1'));

    fireEvent.change(screen.getByLabelText(/output format/i), { target: { value: 'PDF' } });
    fireEvent.click(screen.getByRole('button', { name: /launch/i }));

    await waitFor(() =>
      expect(requestMergeBatch).toHaveBeenCalledWith({
        companyId: 'company-1',
        templateId: 'template-1',
        outputFormat: 'PDF',
        personIds: ['person-1', 'person-2'],
      }),
    );
    expect(runMergeBatch).toHaveBeenCalledWith('batch-1');
    await screen.findByText(/generation complete/i);
  });

  it('disables launch when no recipients are selected', async () => {
    render(
      <MhdDocumentMergeBatchLauncher companyId="company-1" personIds={[]} onClose={onClose} />,
    );

    await waitFor(() => expect(listTemplates).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: /launch/i })).toBeDisabled();
    expect(requestMergeBatch).not.toHaveBeenCalled();
  });
});
