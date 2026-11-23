import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdResetLeaveDraftService,
  mhdTestLeaveDraft,
} from './leaveDraftTestKit';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

const CASE_ID = '5c2e9a14-7f3b-4d60-8e21-b4a07c93d6f8';
const PERSON_ID = 'c2f81d4e-7a39-4b60-95de-1e8f3a6c4b27';
const FMLA_ID = '0e7d4b29-61c3-4a85-9f12-d8b3a5c6e740';
const CFRA_ID = '8a1f6c53-2d97-4e04-b6a8-3c5e9f017b2d';

const { transitionAsync, setBasesAsync, designateAsync, adjustAsync, basesData } = vi.hoisted(
  () => ({
    transitionAsync: vi.fn(),
    setBasesAsync: vi.fn(),
    designateAsync: vi.fn(),
    adjustAsync: vi.fn(),
    basesData: { current: [] as string[] },
  }),
);

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { companyId: '9b5e2c71-3d84-4f1a-a6c0-58d27e4f1b93', personId: null },
    roles: ['HR Partner'],
  }),
}));

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

vi.mock('@/appshell/components/MhdLeaveCaseRecordTabs', () => ({
  MhdLeaveCaseRecordTabs: () => null,
}));

vi.mock('../components/MhdLeaveWorkflowPanel', () => ({
  MhdLeaveWorkflowPanel: () => null,
}));

const idle = () => ({ mutateAsync: vi.fn(), isPending: false });

vi.mock('../Hook', () => ({
  useMhdLeaveCases: () => ({
    isLoading: false,
    data: [
      {
        id: CASE_ID,
        referenceId: 'LV-004181',
        personId: PERSON_ID,
        personDisplayName: 'Graciela Montoya',
        reasonCategory: 'Own serious health condition',
        status: 'REQUESTED',
        requestedStart: '2026-09-08',
        requestedEnd: '2026-10-16',
      },
    ],
  }),
  useMhdLeaveTypes: () => ({
    isLoading: false,
    data: [
      { id: FMLA_ID, typeName: 'FMLA', jurisdiction: 'FEDERAL', entitlementHours: 480 },
      { id: CFRA_ID, typeName: 'CFRA', jurisdiction: 'CA', entitlementHours: 480 },
    ],
  }),
  useMhdLeaveCaseBases: () => ({ isLoading: false, data: basesData.current }),
  useMhdLeaveLedger: () => ({ isLoading: false, data: [] }),
  useMhdLeaveCertifications: () => ({ isLoading: false, data: [] }),
  useMhdLeaveBalances: () => [],
  useMhdSetLeaveCaseBases: () => ({ mutateAsync: setBasesAsync, isPending: false }),
  useMhdDesignateLeave: () => ({ mutateAsync: designateAsync, isPending: false }),
  useMhdAdjustLeave: () => ({ mutateAsync: adjustAsync, isPending: false }),
  useMhdTransitionLeaveCase: () => ({ mutateAsync: transitionAsync, isPending: false }),
  useMhdRecordCertification: idle,
  useMhdMarkCertificationSufficient: idle,
  useMhdUpdateCertificationStatus: idle,
}));

vi.mock('../WorkflowHook', () => ({
  useMhdLeaveWorkflow: () => ({ isLoading: false, data: mhdTestLeaveWorkflow(CASE_ID) }),
  useMhdLeaveCertificationClearDates: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { MhdLeaveCaseDetailPage } = await import('../components/MhdLeaveCaseDetailPage');

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/leaves/${CASE_ID}`]}>
        <Routes>
          <Route path="/leaves/:caseId" element={<MhdLeaveCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
  basesData.current = [FMLA_ID];
  transitionAsync.mockResolvedValue(undefined);
  setBasesAsync.mockResolvedValue(undefined);
  designateAsync.mockResolvedValue(undefined);
  adjustAsync.mockResolvedValue(undefined);
});

describe('MhdLeaveCaseDetailPage action modals', () => {
  it('changes the status in a dialog and requires a reason to cancel', async () => {
    renderPage();
    expect(screen.queryByLabelText('Move to')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change Status' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Change Leave Status');
    fireEvent.change(within(dialog).getByLabelText('Move to'), { target: { value: 'CANCELLED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Denying or cancelling a leave requires a recorded reason.',
    );
    expect(transitionAsync).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'Employee withdrew the request' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Status' }));
    await waitFor(() =>
      expect(transitionAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        newStatus: 'CANCELLED',
        decisionReason: 'Employee withdrew the request',
      }),
    );
    await waitFor(() =>
      expect(drafts.discard).toHaveBeenCalledWith('LEAVE_CASE_ACTION', `${CASE_ID}:status`),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('edits the basis set in a dialog seeded from the designated bases', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit Bases' })[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('checkbox', { name: /FMLA/ })).toBeChecked();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /CFRA/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save.mock.calls[0][0]).toMatchObject({
      draftKey: `${CASE_ID}:bases`,
      payload: { leaveTypeIds: [FMLA_ID, CFRA_ID] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Bases' }));
    await waitFor(() =>
      expect(setBasesAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        leaveTypeIds: [FMLA_ID, CFRA_ID],
      }),
    );
  });

  it('resumes a designate-hours draft and rejects non-positive hours', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:designate-hours`, { hours: '-4', effectiveDate: '2026-09-11' }),
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Designate Hours' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Hours')).toHaveValue(-4);
    fireEvent.click(screen.getByRole('button', { name: 'Designate' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Designated hours must be positive.',
    );
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Designate' }));
    await waitFor(() =>
      expect(designateAsync).toHaveBeenCalledWith({
        caseId: CASE_ID,
        hours: 16,
        effectiveDate: '2026-09-11',
      }),
    );
  });

  it('disables Designate Hours until a basis is designated', () => {
    basesData.current = [];
    renderPage();
    expect(screen.getByRole('button', { name: 'Designate Hours' })).toBeDisabled();
  });

  it('adjusts a basis in a dialog and shows the server refusal', async () => {
    adjustAsync.mockRejectedValueOnce(new Error('Adjustment would leave a negative balance'));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Adjust A Basis' }));
    fireEvent.change(screen.getByLabelText('Legal basis'), { target: { value: CFRA_ID } });
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '-8' } });
    fireEvent.change(screen.getByLabelText('Reason'), {
      target: { value: 'Reverse duplicate designation from September 4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adjust' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Adjustment would leave a negative balance',
    );
    expect(adjustAsync).toHaveBeenCalledWith({
      personId: PERSON_ID,
      leaveTypeId: CFRA_ID,
      hoursDelta: -8,
      reason: 'Reverse duplicate designation from September 4',
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
