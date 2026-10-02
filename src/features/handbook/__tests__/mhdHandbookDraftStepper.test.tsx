import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdHandbook } from '../Types';

const SECTION_ID = '3b7c1e52-9a4d-4f06-8d2e-61c5a0f7b894';

const { toggleMutate, publishMutate, previewRef } = vi.hoisted(() => ({
  toggleMutate: vi.fn(),
  publishMutate: vi.fn(),
  previewRef: { rows: [] as Array<{ sectionId: string }> },
}));

vi.mock('../Hook', () => ({
  useMhdHandbookSections: () => ({
    data: [{ id: 'section-1', title: 'Attendance', jurisdiction: 'CA' }],
    isLoading: false,
  }),
  useMhdHandbookPreview: () => ({ data: previewRef.rows, isLoading: false }),
  useMhdToggleHandbookSection: () => ({
    mutate: toggleMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useMhdPublishHandbook: () => ({ mutateAsync: publishMutate, isPending: false }),
  useMhdArchiveHandbook: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));
vi.mock('@/appshell/components/MhdHandbookRecordTabs', () => ({
  MhdHandbookRecordTabs: () => <nav>Record tabs</nav>,
}));
vi.mock('@/components/ui/MhdDocumentGenerationPanel', () => ({
  MhdDocumentGenerationPanel: () => <p>Export panel</p>,
}));
vi.mock('../components/MhdHandbookAckPolicyCard', () => ({
  MhdHandbookAckPolicyCard: () => <p>Acknowledgment policy card</p>,
}));
vi.mock('../components/MhdHandbookAckBoard', () => ({
  MhdHandbookAckBoard: () => <p>Ack board</p>,
}));
vi.mock('../components/MhdHandbookVersionView', () => ({
  MhdHandbookVersionView: () => <p>Frozen version</p>,
}));
vi.mock('../components/MhdHandbookPreview', () => ({
  MhdHandbookPreview: ({ rows }: { rows: unknown[] }) => (
    <p>{`Preview of ${rows.length} section(s)`}</p>
  ),
}));
vi.mock('../components/MhdHandbookSectionPicker', () => ({
  MhdHandbookSectionPicker: ({
    sections,
    onToggle,
    disabled,
  }: {
    sections: Array<{ id: string; title: string }>;
    onToggle: (id: string, included: boolean) => void;
    disabled: boolean;
  }) => (
    <div>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          disabled={disabled}
          onClick={() => onToggle(section.id, true)}
        >
          {`Include ${section.title}`}
        </button>
      ))}
    </div>
  ),
}));

const { MhdHandbookWizard } = await import('../components/MhdHandbookWizard');

const draft = {
  id: 'handbook-1',
  referenceId: 'HB-2026-0003',
  title: 'Employee Handbook',
  handbookType: 'EMPLOYEE',
  status: 'DRAFT',
  jurisdictions: ['CA'],
  currentVersionId: null,
  requiresSignature: false,
} as unknown as MhdHandbook;

function renderWizard(canManage: boolean, handbook: MhdHandbook = draft) {
  return render(
    <MemoryRouter>
      <MhdHandbookWizard handbook={handbook} companyId="company-1" canManage={canManage} />
    </MemoryRouter>,
  );
}

async function clickNext() {
  const next = screen.getByRole('button', { name: 'Next' });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
}

beforeEach(() => {
  vi.clearAllMocks();
  previewRef.rows = [];
  publishMutate.mockResolvedValue(undefined);
});

describe('MhdHandbookWizard draft stepper', () => {
  it('walks a manager through Sections, Acknowledgment and Preview & Publish', async () => {
    previewRef.rows = [{ sectionId: SECTION_ID }];
    renderWizard(true);

    expect(screen.getByRole('button', { name: 'Include Attendance' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Include Attendance' }));
    expect(toggleMutate).toHaveBeenCalledWith({
      handbookId: 'handbook-1',
      sectionId: 'section-1',
      included: true,
    });

    await clickNext();
    expect(await screen.findByText('Acknowledgment policy card')).toBeInTheDocument();
    await clickNext();
    expect(await screen.findByText('Preview of 1 section(s)')).toBeInTheDocument();
    expect(publishMutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Publish Handbook' }));
    await waitFor(() =>
      expect(publishMutate).toHaveBeenCalledWith({ handbookId: 'handbook-1', effectiveDate: null }),
    );
  });

  it('will not leave the Sections step until at least one section is included', async () => {
    renderWizard(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Include at least one section before continuing.',
    );
    expect(screen.queryByText('Acknowledgment policy card')).not.toBeInTheDocument();
  });

  it("shows the server's message when publishing is refused and stays on the last step", async () => {
    previewRef.rows = [{ sectionId: SECTION_ID }];
    publishMutate.mockRejectedValueOnce(
      new Error('This handbook type already has a live handbook.'),
    );
    renderWizard(true);
    await clickNext();
    await clickNext();
    await screen.findByText('Preview of 1 section(s)');
    fireEvent.click(screen.getByRole('button', { name: 'Publish Handbook' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This handbook type already has a live handbook.',
    );
    expect(screen.getByText('Preview of 1 section(s)')).toBeInTheDocument();
  });

  it('shows someone who cannot manage the handbook the sections and preview, with nothing to publish', () => {
    previewRef.rows = [{ sectionId: SECTION_ID }];
    renderWizard(false);
    expect(screen.getByText('Preview of 1 section(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Include Attendance' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish Handbook' })).not.toBeInTheDocument();
  });

  it('shows the frozen version and the export for a published handbook, not the stepper', () => {
    renderWizard(true, {
      ...draft,
      status: 'PUBLISHED',
      currentVersionId: 'version-1',
    } as unknown as MhdHandbook);
    expect(screen.getByText('Frozen version')).toBeInTheDocument();
    expect(screen.getByText('Export panel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });
});
