import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  enqueueMock: vi.fn(),
  generateMock: vi.fn(),
  templateState: { data: null as unknown, isLoading: false },
  settingsState: { data: null as unknown },
  previewState: {
    data: undefined as unknown,
    isFetching: false,
    isError: false,
    error: null as unknown,
  },
  lastPreviewInput: { current: null as unknown },
}));

vi.mock('@/features/documents/Hook', () => ({
  useMhdDocumentTemplateByKey: () => hooks.templateState,
  useMhdDocumentTemplateWizardSettings: () => hooks.settingsState,
  useMhdEnqueueDocument: () => ({ mutateAsync: hooks.enqueueMock, isPending: false }),
  useMhdGenerateQueuedDocument: () => ({ mutateAsync: hooks.generateMock, isPending: false }),
  useMhdDocumentPreviewHtml: (input: unknown) => {
    hooks.lastPreviewInput.current = input;
    return hooks.previewState;
  },
}));

const { MhdWizardOutputStep } = await import('../MhdWizardOutputStep');

const companyId = crypto.randomUUID();
const entityId = crypto.randomUUID();
const template = {
  id: crypto.randomUUID(),
  mergeFields: [
    { path: 'person.job_title', label: 'Job Title', source: 'person' },
    { path: 'record.severity', label: 'Severity', source: 'record' },
    { path: 'system.current_date', label: 'Date', source: 'system' },
  ],
};
const mergeData = { person: { job_title: 'Line Cook' }, record: { severity: 'Written Warning' } };

function setup(overrides: Partial<Parameters<typeof MhdWizardOutputStep>[0]> = {}) {
  const onResolved = vi.fn();
  render(
    <MemoryRouter>
      <MhdWizardOutputStep
        companyId={companyId}
        sourceWizard="CONDUCT"
        templateKey="CORRECTIVE_GENERAL"
        entityType="CONDUCT_ACTION"
        entityId={entityId}
        recordLabel="corrective action"
        onResolved={onResolved}
        {...overrides}
      />
    </MemoryRouter>,
  );
  return { onResolved };
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.templateState = { data: template, isLoading: false };
  hooks.settingsState = {
    data: {
      requiresSignature: false,
      employeeFileCategory: 'hr',
      narrativeSlots: [
        { key: 'additional_context', label: 'Additional Context', help: 'Anything to add.' },
      ],
    },
  };
  hooks.previewState = {
    data: { mergeData, html: '<p>Corrective action for Dana Whitfield</p>' },
    isFetching: false,
    isError: false,
    error: null,
  };
  hooks.enqueueMock.mockResolvedValue({ id: 'queue-1', referenceId: 'DGQ-1' });
  hooks.generateMock.mockResolvedValue({
    queueId: 'queue-1',
    generationId: 'generation-1',
    generationReferenceId: 'DGEN-1',
    templateId: template.id,
    documentHash: 'hash-1',
    outputDriveFileId: 'drive-1',
  });
});

describe('MhdWizardOutputStep', () => {
  it('shows editable details, narrative sections and a sandboxed preview', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Generate A Document' })).toBeInTheDocument();
    expect(screen.getByLabelText('Job Title')).toHaveValue('Line Cook');
    expect(screen.getByLabelText('Severity')).toHaveValue('Written Warning');
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Additional Context/)).toBeInTheDocument();

    const frame = screen.getByTitle('Document preview');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveAttribute('srcdoc', '<p>Corrective action for Dana Whitfield</p>');
  });

  it('saves a request to generate later, sending only what the person changed', async () => {
    const user = userEvent.setup();
    const { onResolved } = setup({ wizardInputs: { incident: 'Late arrival' } });

    await user.clear(screen.getByLabelText('Job Title'));
    await user.type(screen.getByLabelText('Job Title'), 'Sous Chef');
    await user.type(screen.getByLabelText(/Additional Context/), 'Second occurrence this month.');
    await user.click(screen.getByRole('button', { name: 'Generate Later' }));

    expect(hooks.enqueueMock).toHaveBeenCalledWith({
      companyId,
      templateKey: 'CORRECTIVE_GENERAL',
      entityType: 'CONDUCT_ACTION',
      entityId,
      sourceWizard: 'CONDUCT',
      wizardInputs: { incident: 'Late arrival' },
      mergeOverrides: { 'person.job_title': 'Sous Chef' },
      narrativeSections: { additional_context: 'Second occurrence this month.' },
      outputFormat: 'PDF',
      employeeFileCategory: 'hr',
    });
    expect(hooks.generateMock).not.toHaveBeenCalled();
    expect(onResolved).toHaveBeenCalledWith({ outcome: 'QUEUED', queueId: 'queue-1' });
    expect(await screen.findByRole('link', { name: 'Open The List' })).toHaveAttribute(
      'href',
      '/reports/queue',
    );
  });

  it('generates now, then offers the document', async () => {
    const user = userEvent.setup();
    const { onResolved } = setup();

    await user.click(screen.getByRole('button', { name: 'Generate Now' }));

    expect(hooks.generateMock).toHaveBeenCalledWith({
      queueId: 'queue-1',
      entityType: 'CONDUCT_ACTION',
    });
    expect(onResolved).toHaveBeenCalledWith({
      outcome: 'GENERATED',
      queueId: 'queue-1',
      generationId: 'generation-1',
      documentHash: 'hash-1',
      outputDriveFileId: 'drive-1',
      esignatureRequestId: null,
    });
    expect(await screen.findByRole('link', { name: 'View Document' })).toHaveAttribute(
      'href',
      'https://drive.google.com/file/d/drive-1/view',
    );
  });

  it('sends a signature request after generating when the template needs one', async () => {
    const user = userEvent.setup();
    hooks.settingsState = {
      data: { requiresSignature: true, employeeFileCategory: 'hr', narrativeSlots: [] },
    };
    const createRequest = vi.fn().mockResolvedValue({ requestId: 'sig-1', invitationErrors: [] });
    const { onResolved } = setup({ signing: { createRequest } });

    expect(screen.getByText(/sent for signature as soon as it is generated/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Generate Now' }));

    expect(createRequest).toHaveBeenCalledWith({
      generationId: 'generation-1',
      documentHash: 'hash-1',
    });
    expect(onResolved).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'GENERATED', esignatureRequestId: 'sig-1' }),
    );
  });

  it('refuses to route for signature without an integrity hash and explains why', async () => {
    const user = userEvent.setup();
    hooks.settingsState = {
      data: { requiresSignature: true, employeeFileCategory: null, narrativeSlots: [] },
    };
    hooks.generateMock.mockResolvedValue({
      queueId: 'queue-1',
      generationId: 'generation-1',
      generationReferenceId: 'DGEN-1',
      templateId: template.id,
      documentHash: null,
      outputDriveFileId: 'drive-1',
    });
    const createRequest = vi.fn();
    const { onResolved } = setup({ signing: { createRequest } });

    await user.click(screen.getByRole('button', { name: 'Generate Now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no integrity hash/);
    expect(createRequest).not.toHaveBeenCalled();
    expect(onResolved).not.toHaveBeenCalled();
  });

  it('files under the chosen category, or nowhere', async () => {
    const user = userEvent.setup();
    setup();

    const filing = screen.getByLabelText('File Document In');
    expect(filing).toHaveValue('hr');
    expect(within(filing).queryByRole('option', { name: /medical/i })).not.toBeInTheDocument();

    await user.selectOptions(filing, 'NONE');
    await user.click(screen.getByRole('button', { name: 'Generate Later' }));
    expect(hooks.enqueueMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ employeeFileCategory: 'NONE' }),
    );
  });

  it('offers no filing choice, and files nowhere, for a record that has no employee-file home', async () => {
    const user = userEvent.setup();
    setup({ allowEmployeeFile: false });

    expect(screen.queryByLabelText('File Document In')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Generate Later' }));
    expect(hooks.enqueueMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ employeeFileCategory: 'NONE' }),
    );
  });

  it('stops text that includes a diagnosis, cause or medical record before anything is saved', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(
      screen.getByLabelText(/Additional Context/),
      'Employee has a diagnosis of anxiety.',
    );
    await user.click(screen.getByRole('button', { name: 'Generate Later' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/must not include a diagnosis/);
    expect(hooks.enqueueMock).not.toHaveBeenCalled();
  });

  it('keeps Generate Later available when a compliance gate blocks generating now', async () => {
    hooks.previewState = {
      data: undefined,
      isFetching: false,
      isError: true,
      error: new Error(
        'Content CONDUCT.DISCIPLINARY_NOTICE_CONTENT is blocked by the pre-live compliance review gate',
      ),
    };
    setup();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This document is blocked until its compliance content has been approved',
    );
    expect(screen.getByRole('button', { name: 'Generate Now' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate Later' })).toBeEnabled();
  });

  it('lets someone skip', async () => {
    const user = userEvent.setup();
    const { onResolved } = setup();

    await user.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onResolved).toHaveBeenCalledWith({ outcome: 'SKIPPED' });
    expect(hooks.enqueueMock).not.toHaveBeenCalled();
    expect(screen.getByText('No document was generated.')).toBeInTheDocument();
  });

  it('still offers Generate Later when the template cannot be read', async () => {
    const user = userEvent.setup();
    hooks.templateState = { data: null, isLoading: false };
    hooks.settingsState = { data: null };
    setup();

    expect(screen.getByRole('button', { name: 'Generate Now' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Generate Later' }));
    expect(hooks.enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({ templateKey: 'CORRECTIVE_GENERAL', employeeFileCategory: 'NONE' }),
    );
  });

  it('shows the server message when generating fails', async () => {
    const user = userEvent.setup();
    hooks.generateMock.mockRejectedValue(new Error('Document access denied'));
    const { onResolved } = setup();

    await user.click(screen.getByRole('button', { name: 'Generate Now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Document access denied');
    expect(onResolved).not.toHaveBeenCalled();
  });
});
