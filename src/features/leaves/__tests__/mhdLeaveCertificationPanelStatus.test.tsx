import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdLeaveCertificationPanel } from '../components/MhdLeaveCertificationPanel';
import type { MhdLeaveCertification } from '../Types';

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
) {
  render(
    <MhdLeaveCertificationPanel
      caseId="case-1"
      certifications={[cert]}
      canSeeMedical={canSeeMedical}
      onRecord={vi.fn()}
      onMarkSufficient={vi.fn()}
      onUpdateStatus={onUpdateStatus}
    />,
  );
  return onUpdateStatus;
}

describe('MhdLeaveCertificationPanel status update', () => {
  it('offers no status control to a viewer who cannot see medical detail', () => {
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Update status' })).not.toBeInTheDocument();
  });

  it('lists exactly the database statuses and carries no diagnosis field', () => {
    renderPanel(true);
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Status' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Select the new certification status.',
    );
    expect(onUpdateStatus).not.toHaveBeenCalled();
  });

  it('records a deficiency with notice date, cure date and operational note', async () => {
    const onUpdateStatus = renderPanel(true);
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
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
    return render(
      <MhdLeaveCertificationPanel
        caseId="case-1"
        certifications={[cert]}
        workflowCertifications={workflowCertifications}
        canSeeMedical={canSeeMedical}
        onRecord={vi.fn()}
        onMarkSufficient={vi.fn()}
        onUpdateStatus={vi.fn().mockResolvedValue(undefined)}
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
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
    expect(screen.getByLabelText('Certification status')).toHaveValue('INCOMPLETE');
  });

  it('works without a workflow record', () => {
    renderWith(undefined);
    expect(screen.queryByText('Cure due')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
    expect(screen.getByLabelText('Certification status')).toHaveValue('');
  });

  it('ignores a workflow certification that matches no row', () => {
    renderWith([{ ...operational, id: 'other-cert' }]);
    expect(screen.queryByText('Cure due')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update status' }));
    expect(screen.getByLabelText('Certification status')).toHaveValue('');
  });
});
