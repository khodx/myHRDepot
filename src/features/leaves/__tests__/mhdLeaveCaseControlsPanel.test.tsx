import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdLeaveCaseControlsPanel } from '../components/MhdLeaveCaseControlsPanel';
import type { MhdLeaveWorkflow } from '../WorkflowTypes';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

const CASE_ID = 'a61f3c08-9d2e-4b75-8e40-c3b7d1f25e96';

function renderPanel({
  caseData = mhdTestLeaveWorkflow(CASE_ID).case,
  privileged = true,
}: { caseData?: MhdLeaveWorkflow['case']; privileged?: boolean } = {}) {
  const onKeyEmployee = vi.fn<(input: unknown) => Promise<boolean>>().mockResolvedValue(true);
  const onWorkersComp = vi.fn<(input: unknown) => Promise<boolean>>().mockResolvedValue(true);
  const onEssentialFunctions = vi
    .fn<(providedOn: string | null) => Promise<boolean>>()
    .mockResolvedValue(true);
  render(
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

  it('records a key-employee determination from the status vocabulary', async () => {
    const { onKeyEmployee } = renderPanel();
    const status = screen.getByLabelText('Key employee status');
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
  });

  it("records a workers' compensation claim", async () => {
    const { onWorkersComp } = renderPanel();
    fireEvent.click(screen.getByLabelText("Workers' Compensation Claim"));
    fireEvent.change(screen.getByLabelText('Date filed'), { target: { value: '08/06/2026' } });
    fireEvent.blur(screen.getByLabelText('Date filed'));
    fireEvent.change(screen.getByLabelText('Light-duty note'), {
      target: { value: 'Declined modified duty at the Fresno warehouse' },
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
    fireEvent.click(screen.getByRole('button', { name: 'Record Delivery With Designation' }));
    await waitFor(() => expect(onEssentialFunctions).toHaveBeenCalledWith(null));
  });

  it('shows recorded facts read-only to a non-administrator who receives them', () => {
    renderPanel({ privileged: false });
    expect(screen.getByText('Not Determined')).toBeInTheDocument();
    expect(screen.queryByLabelText('Key employee status')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Record Delivery With Designation' }),
    ).not.toBeInTheDocument();
  });
});
