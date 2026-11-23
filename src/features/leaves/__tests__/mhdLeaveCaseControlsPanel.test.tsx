import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdLeaveCaseControlsPanel } from '../components/MhdLeaveCaseControlsPanel';
import type { MhdLeaveWorkflow } from '../WorkflowTypes';
import {
  mhdLeaveDraftServiceMock as drafts,
  mhdRenderWithQueryClient,
  mhdResetLeaveDraftService,
  mhdTestLeaveDraft,
} from './leaveDraftTestKit';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

const CASE_ID = 'a61f3c08-9d2e-4b75-8e40-c3b7d1f25e96';

function renderPanel({
  caseData = mhdTestLeaveWorkflow(CASE_ID).case,
  privileged = true,
}: { caseData?: MhdLeaveWorkflow['case']; privileged?: boolean } = {}) {
  const onKeyEmployee = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue(undefined);
  const onWorkersComp = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue(undefined);
  const onEssentialFunctions = vi
    .fn<(providedOn: string | null) => Promise<unknown>>()
    .mockResolvedValue(undefined);
  mhdRenderWithQueryClient(
    <MhdLeaveCaseControlsPanel
      caseData={caseData}
      privileged={privileged}
      onKeyEmployee={onKeyEmployee}
      onWorkersComp={onWorkersComp}
      onEssentialFunctions={onEssentialFunctions}
      isPending={false}
    />,
  );
  return { onKeyEmployee, onWorkersComp, onEssentialFunctions };
}

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
});

describe('MhdLeaveCaseControlsPanel', () => {
  it('shows Not Available where the bundle withholds administrator-only facts', () => {
    renderPanel({
      caseData: mhdTestLeaveWorkflow(CASE_ID, {}, { workers_comp: null, key_employee: null }).case,
      privileged: false,
    });
    expect(screen.getAllByText('Not Available')).toHaveLength(2);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Essential Functions' })).toBeInTheDocument();
  });

  it('records a key-employee determination from the status vocabulary in a dialog', async () => {
    const { onKeyEmployee } = renderPanel();
    expect(screen.queryByLabelText('Key employee status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Key Employee' }));
    const dialog = screen.getByRole('dialog');
    const status = within(dialog).getByLabelText('Key employee status');
    expect(Array.from(status.querySelectorAll('option')).map((option) => option.value)).toEqual([
      'NOT_DETERMINED',
      'NOT_KEY',
      'KEY',
    ]);
    fireEvent.change(status, { target: { value: 'KEY' } });
    fireEvent.change(screen.getByLabelText('Determination date'), {
      target: { value: '08/12/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Determination date'));
    fireEvent.change(screen.getByLabelText('Key-employee notice date'), {
      target: { value: '08/13/2026' },
    });
    fireEvent.blur(screen.getByLabelText('Key-employee notice date'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Key Employee' }));
    await waitFor(() =>
      expect(onKeyEmployee).toHaveBeenCalledWith({
        caseId: CASE_ID,
        status: 'KEY',
        determinedOn: '2026-08-12',
        noticeOn: '2026-08-13',
        restorationDeniedNoticeOn: null,
      }),
    );
    await waitFor(() =>
      expect(drafts.discard).toHaveBeenCalledWith('LEAVE_CASE_ACTION', `${CASE_ID}:key-employee`),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('saves the key-employee form as a draft and resumes it', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Key Employee' }));
    fireEvent.change(screen.getByLabelText('Key employee status'), {
      target: { value: 'NOT_KEY' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save.mock.calls[0][0]).toMatchObject({
      draftKey: `${CASE_ID}:key-employee`,
      payload: {
        status: 'NOT_KEY',
        determinedOn: '',
        noticeOn: '',
        restorationDeniedNoticeOn: '',
      },
    });
  });

  it('restores a saved key-employee draft', async () => {
    drafts.get.mockResolvedValue(
      mhdTestLeaveDraft(`${CASE_ID}:key-employee`, { status: 'KEY', determinedOn: '2026-08-12' }),
    );
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Key Employee' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Resume Draft' }));
    expect(screen.getByLabelText('Key employee status')).toHaveValue('KEY');
    expect(screen.getByLabelText('Determination date')).toHaveValue('08/12/2026');
  });

  it("records a workers' compensation claim and never drafts the light-duty note", async () => {
    const { onWorkersComp } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: "Edit Workers' Compensation" }));
    expect(screen.getByText('Medical details are not saved in drafts.')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Workers' Compensation Claim"));
    fireEvent.change(screen.getByLabelText('Date filed'), { target: { value: '08/06/2026' } });
    fireEvent.blur(screen.getByLabelText('Date filed'));
    fireEvent.change(screen.getByLabelText('Light-duty note'), {
      target: { value: 'Declined modified duty at the Fresno warehouse' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(drafts.save).toHaveBeenCalledTimes(1));
    expect(drafts.save.mock.calls[0][0].payload).toEqual({
      claim: true,
      filedOn: '2026-08-06',
      concurrentDesignatedOn: '',
    });
    fireEvent.click(screen.getByRole('button', { name: "Save Workers' Compensation" }));
    await waitFor(() =>
      expect(onWorkersComp).toHaveBeenCalledWith({
        caseId: CASE_ID,
        claim: true,
        filedOn: '2026-08-06',
        concurrentDesignatedOn: null,
        lightDutyDeclinedNote: 'Declined modified duty at the Fresno warehouse',
      }),
    );
  });

  it('records essential-functions delivery and shows the recorded date', async () => {
    const { onEssentialFunctions } = renderPanel({
      caseData: mhdTestLeaveWorkflow(CASE_ID, {}, { essential_functions_provided_on: '2026-08-14' })
        .case,
    });
    expect(screen.getByText('2026-08-14')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Record Delivery' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record Delivery With Designation' }));
    await waitFor(() => expect(onEssentialFunctions).toHaveBeenCalledWith(null));
  });

  it('shows the refusal inside the dialog and keeps it open', async () => {
    const { onEssentialFunctions } = renderPanel();
    onEssentialFunctions.mockRejectedValueOnce(new Error('No published job description'));
    fireEvent.click(screen.getByRole('button', { name: 'Record Delivery' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record Delivery With Designation' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(
      'No published job description',
    );
    expect(drafts.discard).not.toHaveBeenCalled();
  });

  it('shows recorded facts read-only to a non-administrator who receives them', () => {
    renderPanel({ privileged: false });
    expect(screen.getByText('Not Determined')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Key Employee' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record Delivery' })).not.toBeInTheDocument();
  });
});
