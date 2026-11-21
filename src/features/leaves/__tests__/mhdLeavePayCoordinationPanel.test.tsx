import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdLeavePayCoordinationPanel } from '../components/MhdLeavePayCoordinationPanel';
import type { MhdLeavePaySource, MhdLeavePaySourceWarning } from '../WorkflowTypes';

const CASE_ID = '3e8b1f52-6c07-4d9a-b2e4-71a5c0d8f936';

const sdi: MhdLeavePaySource = {
  id: 'pay-1',
  source_key: 'SDI',
  label: 'State Disability Insurance',
  status: 'PAYING',
  claim_ref: 'DI-55102938',
  paid_from: '2026-08-10',
  paid_to: null,
  employer_required: false,
  mutual_agreement: false,
  note: null,
};

const endedPto: MhdLeavePaySource = {
  ...sdi,
  id: 'pay-2',
  source_key: 'PTO',
  label: 'Paid Time Off',
  status: 'ENDED',
  claim_ref: null,
  paid_from: '2026-08-03',
  paid_to: '2026-08-07',
  employer_required: true,
};

function renderPanel({
  paySources = [sdi, endedPto],
  privileged = true,
  onRecord = vi.fn<(input: unknown) => Promise<MhdLeavePaySourceWarning[] | null>>(),
  onUpdateStatus = vi.fn<(input: unknown) => Promise<MhdLeavePaySourceWarning[] | null>>(),
} = {}) {
  render(
    <MhdLeavePayCoordinationPanel
      caseId={CASE_ID}
      paySources={paySources}
      privileged={privileged}
      onRecord={onRecord}
      onUpdateStatus={onUpdateStatus}
      isPending={false}
    />,
  );
  return { onRecord, onUpdateStatus };
}

describe('MhdLeavePayCoordinationPanel', () => {
  it('lists every pay source with its dates, claim reference and employer requirement', () => {
    renderPanel({ privileged: false });
    expect(screen.getByText('State Disability Insurance')).toBeInTheDocument();
    expect(screen.getByText('DI-55102938')).toBeInTheDocument();
    expect(screen.getByText('Required By Employer')).toBeInTheDocument();
    expect(screen.getByText('Paying')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record Pay Source' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Pay status')).not.toBeInTheDocument();
  });

  it('says so when no pay source is recorded', () => {
    renderPanel({ paySources: [], privileged: false });
    expect(screen.getByText('No pay sources recorded.')).toBeInTheDocument();
  });

  it('shows the client validator message inline when statutory sick leave is required', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Pay source'), { target: { value: 'CA_PAID_SICK' } });
    fireEvent.click(screen.getByLabelText('Employer Is Requiring This'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Statutory California paid sick leave can never be required',
    );
    expect(screen.getByRole('button', { name: 'Record Pay Source' })).toBeDisabled();
  });

  it('refuses to require a wage-replacement source', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Pay source'), { target: { value: 'PFL' } });
    fireEvent.click(screen.getByLabelText('Employer Is Requiring This'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'not something an employer can require an employee to use',
    );
  });

  it('asks whether the employee agrees only for employer sick leave', () => {
    renderPanel();
    expect(screen.queryByLabelText('Employee Agrees')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Pay source'), { target: { value: 'EMPLOYER_SICK' } });
    expect(screen.getByLabelText('Employee Agrees')).toBeInTheDocument();
  });

  it('records a pay source and shows the overlap warning the database returns', async () => {
    const onRecord = vi
      .fn<(input: unknown) => Promise<MhdLeavePaySourceWarning[] | null>>()
      .mockResolvedValue(['SDI_PFL_OVERLAP']);
    renderPanel({ onRecord });
    fireEvent.change(screen.getByLabelText('Pay source'), { target: { value: 'PFL' } });
    fireEvent.change(screen.getByLabelText('Claim reference'), { target: { value: 'FC-20931' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Pay Source' }));
    await waitFor(() => expect(onRecord).toHaveBeenCalledTimes(1));
    expect(onRecord).toHaveBeenCalledWith({
      caseId: CASE_ID,
      sourceKey: 'PFL',
      status: 'EXPECTED',
      claimRef: 'FC-20931',
      paidFrom: null,
      paidTo: null,
      employerRequired: false,
      mutualAgreement: false,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'SDI and Paid Family Leave cannot be paid for the same period.',
    );
    expect(screen.getByLabelText('Claim reference')).toHaveValue('');
  });

  it('keeps the typed values when the record is refused', async () => {
    const onRecord = vi
      .fn<(input: unknown) => Promise<MhdLeavePaySourceWarning[] | null>>()
      .mockResolvedValue(null);
    renderPanel({ onRecord });
    fireEvent.change(screen.getByLabelText('Claim reference'), { target: { value: 'PTO-88' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Pay Source' }));
    await waitFor(() => expect(onRecord).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText('Claim reference')).toHaveValue('PTO-88');
  });

  it('changes an open row status and disables a terminal row', async () => {
    const onUpdateStatus = vi
      .fn<(input: unknown) => Promise<MhdLeavePaySourceWarning[] | null>>()
      .mockResolvedValue([]);
    renderPanel({ onUpdateStatus });
    const [openRow, endedRow] = screen.getAllByLabelText('Pay status');
    expect(endedRow).toBeDisabled();
    expect(openRow).toBeEnabled();
    expect(Array.from(openRow.querySelectorAll('option')).map((option) => option.value)).toEqual([
      'EXPECTED',
      'APPROVED',
      'PAYING',
      'ENDED',
      'DENIED',
    ]);
    fireEvent.change(openRow, { target: { value: 'ENDED' } });
    await waitFor(() =>
      expect(onUpdateStatus).toHaveBeenCalledWith({ paySourceId: 'pay-1', status: 'ENDED' }),
    );
  });
});
