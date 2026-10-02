import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdDocumentTemplateVersionsModal } from '../components/MhdDocumentTemplateVersionsModal';

const mockVersions = vi.fn();
vi.mock('../OutputHook', () => ({
  useMhdDocumentTemplateVersions: (...args: unknown[]) => mockVersions(...args),
}));
const id = () => crypto.randomUUID();
const older = {
  version: 1,
  name: 'Old',
  contentFormat: 'MARKDOWN',
  content: 'old body',
  mergeFields: [],
  narrativeSlots: [],
  requiresSignature: false,
  changedBy: id(),
  changedByName: 'A Reviewer',
  changedAt: '2026-09-01T10:00:00Z',
};
const current = {
  ...older,
  version: 2,
  name: 'Current',
  content: 'current body',
  changedByName: null,
  changedAt: '2026-09-02T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVersions.mockReturnValue({ data: [current, older], isLoading: false, error: null });
});

describe('MhdDocumentTemplateVersionsModal', () => {
  it('lists newest first, previews selected content, and restores only older versions', async () => {
    const onRestore = vi.fn().mockResolvedValue(undefined);
    render(
      <MhdDocumentTemplateVersionsModal
        templateId={id()}
        templateName="Letter"
        canRestore
        isRestoring={false}
        onRestore={onRestore}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore This Version' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Version 1/ }));
    expect(screen.getByText('old body')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore This Version' }));
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith(older));
  });

  it('shows empty and error states', () => {
    mockVersions.mockReturnValueOnce({ data: [], isLoading: false, error: null });
    const { rerender } = render(
      <MhdDocumentTemplateVersionsModal
        templateId={id()}
        templateName="Empty"
        canRestore={false}
        isRestoring={false}
        onRestore={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No versions found.');
    mockVersions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('load failed'),
    });
    rerender(
      <MhdDocumentTemplateVersionsModal
        templateId={id()}
        templateName="Broken"
        canRestore={false}
        isRestoring={false}
        onRestore={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('load failed');
  });
});
