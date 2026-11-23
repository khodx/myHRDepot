import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdLeaveCertificationPanel } from '../components/MhdLeaveCertificationPanel';
import type { MhdLeaveCertification } from '../Types';
import { mhdLeaveDraftServiceMock as drafts, mhdRenderWithQueryClient } from './leaveDraftTestKit';

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

const cert: MhdLeaveCertification = {
  id: 'cert-1',
  certificationType: 'INITIAL',
  dueDate: '2026-08-01',
  receivedAt: null,
  sufficient: null,
  providerNote: null,
  driveFileId: null,
};

function renderPanel(
  canSeeMedical: boolean,
  onUpdateStatus = vi.fn().mockResolvedValue(undefined),
  onClearDates = vi.fn().mockResolvedValue(undefined),
) {
  mhdRenderWithQueryClient(
    <MhdLeaveCertificationPanel
      caseId="case-1"
      certifications={[cert]}
      canSeeMedical={canSeeMedical}
      onRecord={vi.fn()}
      onMarkSufficient={vi.fn()}
      onUpdateStatus={onUpdateStatus}
      onClearDates={onClearDates}
    />,
  );
  return onUpdateStatus;
}

describe('MhdLeaveCertificationPanel status update', () => {
  it('offers no status control to a viewer who cannot see medical detail', () => {
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Update Status' })).not.toBeInTheDocument();
  });

  it('lists exactly the database statuses and carries no diagnosis field', () => {
    renderPanel(true);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    const options = Array.from(
      screen.getByLabelText('Certification status').querySelectorAll('option'),
    ).map((option) => option.value);
    expect(options).toEqual([
      '',
      'REQUESTED',
      'RECEIVED',
      'INCOMPLETE',
      'INSUFFICIENT',
      'SUFFICIENT',
      'EXPIRED',
      'WAIVED',
    ]);
    expect(screen.getByText(/no diagnosis or medical detail/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^(diagnosis|condition|symptoms)/i)).not.toBeInTheDocument();
  });

  it('requires a status before saving', async () => {
    const onUpdateStatus = renderPanel(true);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Status' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Select the new certification status.',
    );
    expect(onUpdateStatus).not.toHaveBeenCalled();
  });

  it('records a deficiency with notice date, cure date and operational note', async () => {
    const onUpdateStatus = renderPanel(true);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    fireEvent.change(screen.getByLabelText('Certification status'), {
      target: { value: 'INCOMPLETE' },
    });
    fireEvent.change(screen.getByLabelText('Deficiency notified date'), {
      target: { value: '08/07/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Deficiency notified date'));
    fireEvent.change(screen.getByLabelText('Cure due date'), { target: { value: '08/14/2026' } });
    fireEvent.blur(screen.getByLabelText('Cure due date'));
    fireEvent.change(screen.getByLabelText(/Operational note/), {
      target: { value: ' Provider section unsigned ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Status' }));
    await waitFor(() => expect(onUpdateStatus).toHaveBeenCalledTimes(1));
    expect(onUpdateStatus).toHaveBeenCalledWith({
      certId: 'cert-1',
      status: 'INCOMPLETE',
      receivedAt: null,
      deficiencyNotifiedAt: '2026-08-07',
      cureDueDate: '2026-08-14',
      reviewNote: 'Provider section unsigned',
      requestedAt: null,
    });
    await waitFor(() =>
      expect(screen.queryByLabelText('Certification status')).not.toBeInTheDocument(),
    );
  });

  it('shows the exact refusal and keeps the form open', async () => {
    const onUpdateStatus = vi
      .fn()
      .mockRejectedValue(new Error('Certification not found or medical access denied'));
    renderPanel(true, onUpdateStatus);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    fireEvent.change(screen.getByLabelText('Certification status'), {
      target: { value: 'RECEIVED' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Status' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Certification not found or medical access denied',
    );
    expect(screen.getByLabelText('Certification status')).toHaveValue('RECEIVED');
  });
});

describe('MhdLeaveCertificationPanel operational status display', () => {
  const operational = {
    id: 'cert-1',
    certification_type: 'INITIAL',
    status: 'INCOMPLETE',
    requested_at: '2026-07-20',
    due_date: '2026-08-01',
    received_at: null,
    deficiency_notified_at: '2026-08-07',
    cure_due_date: '2026-08-14',
  };

  function renderWith(
    workflowCertifications: (typeof operational)[] | undefined,
    canSeeMedical = true,
  ) {
    return mhdRenderWithQueryClient(
      <MhdLeaveCertificationPanel
        caseId="case-1"
        certifications={[cert]}
        workflowCertifications={workflowCertifications}
        canSeeMedical={canSeeMedical}
        onRecord={vi.fn()}
        onMarkSufficient={vi.fn()}
        onUpdateStatus={vi.fn().mockResolvedValue(undefined)}
        onClearDates={vi.fn().mockResolvedValue(undefined)}
      />,
    );
  }

  it('shows status, requested, deficiency-notified and cure-due dates', () => {
    renderWith([operational]);
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument();
    expect(screen.getByText('2026-07-20')).toBeInTheDocument();
    expect(screen.getByText('2026-08-07')).toBeInTheDocument();
    expect(screen.getByText('2026-08-14')).toBeInTheDocument();
  });

  it('shows the operational facts without medical access and still hides the provider note', () => {
    renderWith([operational], false);
    expect(screen.getByText('INCOMPLETE')).toBeInTheDocument();
    expect(screen.getByText('Cure due')).toBeInTheDocument();
    expect(screen.getByText(/Restricted/)).toBeInTheDocument();
  });

  it('opens the status form on the current status', () => {
    renderWith([operational]);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    expect(screen.getByLabelText('Certification status')).toHaveValue('INCOMPLETE');
  });

  it('works without a workflow record', () => {
    renderWith(undefined);
    expect(screen.queryByText('Cure due')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    expect(screen.getByLabelText('Certification status')).toHaveValue('');
  });

  it('ignores a workflow certification that matches no row', () => {
    renderWith([{ ...operational, id: 'other-cert' }]);
    expect(screen.queryByText('Cure due')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    expect(screen.getByLabelText('Certification status')).toHaveValue('');
  });
});

describe('MhdLeaveCertificationPanel requested date and date clearing', () => {
  it('sends the Requested On date with a status update', async () => {
    const onUpdateStatus = renderPanel(true);
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    fireEvent.change(screen.getByLabelText('Certification status'), {
      target: { value: 'REQUESTED' },
    });
    fireEvent.change(screen.getByLabelText('Requested On'), { target: { value: '07/20/2026' } });
    fireEvent.blur(screen.getByLabelText('Requested On'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Status' }));
    await waitFor(() => expect(onUpdateStatus).toHaveBeenCalledTimes(1));
    expect(onUpdateStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'REQUESTED', requestedAt: '2026-07-20' }),
    );
  });

  it('offers Clear A Date only to a viewer who can see medical detail', () => {
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Clear A Date' })).not.toBeInTheDocument();
  });

  it('clears the chosen dates with a required reason', async () => {
    const onClearDates = vi.fn().mockResolvedValue(undefined);
    renderPanel(true, undefined, onClearDates);
    fireEvent.click(screen.getByRole('button', { name: 'Clear A Date' }));
    const options = screen.getAllByRole('checkbox');
    expect(options).toHaveLength(3);
    const clear = screen.getByRole('button', { name: 'Clear Dates' });
    expect(clear).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Received Date'));
    expect(clear).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason for clearing'), {
      target: { value: 'Entered against the wrong certification' },
    });
    fireEvent.click(clear);
    await waitFor(() => expect(onClearDates).toHaveBeenCalledTimes(1));
    expect(onClearDates).toHaveBeenCalledWith({
      certificationId: 'cert-1',
      fields: ['received_at'],
      reason: 'Entered against the wrong certification',
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Clear Dates' })).not.toBeInTheDocument(),
    );
  });

  it('shows the refusal and keeps the clear form open', async () => {
    const onClearDates = vi.fn().mockRejectedValue(new Error('Medical access denied'));
    renderPanel(true, undefined, onClearDates);
    fireEvent.click(screen.getByRole('button', { name: 'Clear A Date' }));
    fireEvent.click(screen.getByLabelText('Requested Date'));
    fireEvent.change(screen.getByLabelText('Reason for clearing'), {
      target: { value: 'Duplicate entry' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Dates' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Medical access denied');
    expect(screen.getByLabelText('Requested Date')).toBeChecked();
  });
});

describe('MhdLeaveCertificationPanel modals keep no medical draft', () => {
  it('opens Record Certification as a dialog with no Save Draft and no draft lookup', async () => {
    const onRecord = vi.fn().mockResolvedValue(undefined);
    mhdRenderWithQueryClient(
      <MhdLeaveCertificationPanel
        caseId="case-1"
        certifications={[]}
        canSeeMedical
        onRecord={onRecord}
        onMarkSufficient={vi.fn()}
        onUpdateStatus={vi.fn()}
        onClearDates={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record Certification' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Record Certification');
    expect(screen.getByText('Medical details are not saved in drafts.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Draft' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    await waitFor(() =>
      expect(onRecord).toHaveBeenCalledWith({
        caseId: 'case-1',
        certificationType: 'INITIAL',
        dueDate: null,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(drafts.get).not.toHaveBeenCalled();
    expect(drafts.discard).not.toHaveBeenCalled();
  });

  it('records a sufficiency review with the restricted provider note', async () => {
    const onMarkSufficient = vi.fn().mockResolvedValue(undefined);
    mhdRenderWithQueryClient(
      <MhdLeaveCertificationPanel
        caseId="case-1"
        certifications={[cert]}
        canSeeMedical
        onRecord={vi.fn()}
        onMarkSufficient={onMarkSufficient}
        onUpdateStatus={vi.fn()}
        onClearDates={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Review Sufficiency' }));
    expect(screen.queryByRole('button', { name: 'Save Draft' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Provider note/), {
      target: { value: 'Duration section left blank' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark Insufficient' }));
    await waitFor(() =>
      expect(onMarkSufficient).toHaveBeenCalledWith({
        certId: 'cert-1',
        sufficient: false,
        providerNote: 'Duration section left blank',
      }),
    );
  });
});
